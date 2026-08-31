create index push_deliveries_event_claim_idx
  on app.push_deliveries(status, kind, claimed_at, created_at)
  where
    kind in ('matchday_published', 'matchday_evaluated')
    and status in ('pending', 'processing', 'failed');

create function private.enqueue_matchday_push_deliveries(
  p_matchday_id uuid,
  p_kind app.push_reminder_kind
) returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  inserted_count integer;
begin
  if p_kind not in ('matchday_published', 'matchday_evaluated') then
    raise exception using errcode = '22023', message = 'Invalid matchday push event kind';
  end if;

  insert into app.push_deliveries(
    subscription_id,
    user_id,
    round_id,
    matchday_id,
    kind
  )
  select
    subscription.id,
    subscription.user_id,
    membership.round_id,
    p_matchday_id,
    p_kind
  from app.matchdays matchday
  join app.prediction_rounds round
    on round.league_season_id = matchday.league_season_id
    and round.status = 'active'
  join app.round_memberships membership
    on membership.round_id = round.id
    and membership.status = 'active'
  join app.profiles profile
    on profile.user_id = membership.user_id
    and profile.status = 'active'
    and profile.app_role = 'user'
  join app.push_subscriptions subscription
    on subscription.user_id = membership.user_id
  where matchday.id = p_matchday_id
  order by subscription.id, membership.round_id
  on conflict on constraint push_deliveries_reminder_unique do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end
$function$;

create function private.queue_published_matchday_from_matchday()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
    and exists (
      select 1
      from app.matches match
      where match.matchday_id = new.id
        and match.status in ('published', 'postponed')
        and match.kickoff_at > clock_timestamp()
    ) then
    perform private.enqueue_matchday_push_deliveries(new.id, 'matchday_published');
  end if;

  return null;
end
$function$;

create function private.queue_published_matchday_from_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status in ('published', 'postponed')
    and new.kickoff_at > clock_timestamp()
    and exists (
      select 1
      from app.matchdays matchday
      where matchday.id = new.matchday_id
        and matchday.status = 'published'
    ) then
    perform private.enqueue_matchday_push_deliveries(
      new.matchday_id,
      'matchday_published'
    );
  end if;

  return null;
end
$function$;

create function private.matchday_is_fully_evaluated(p_matchday_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    exists (
      select 1
      from app.matches match
      where match.matchday_id = p_matchday_id
        and match.status <> 'draft'
    )
    and not exists (
      select 1
      from app.matches match
      left join app.match_results result on result.match_id = match.id
      where match.matchday_id = p_matchday_id
        and match.status <> 'draft'
        and result.decision is null
    )
$function$;

create function private.queue_evaluated_matchday()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status = 'completed'
    and old.status is distinct from new.status
    and private.matchday_is_fully_evaluated(new.matchday_id) then
    perform private.enqueue_matchday_push_deliveries(
      new.matchday_id,
      'matchday_evaluated'
    );
  end if;

  return null;
end
$function$;

create trigger matchdays_queue_published_push
after insert or update of status on app.matchdays
for each row execute function private.queue_published_matchday_from_matchday();

create trigger matches_queue_published_matchday_push
after insert or update of matchday_id, kickoff_at, status on app.matches
for each row execute function private.queue_published_matchday_from_match();

create constraint trigger matches_queue_evaluated_matchday_push
after update on app.matches
deferrable initially deferred
for each row execute function private.queue_evaluated_matchday();

create function api.claim_due_push_events(
  p_now timestamptz default clock_timestamp(),
  p_limit integer default 100
) returns table (
  delivery_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh_key text,
  auth_secret text,
  round_id uuid,
  matchday_id uuid,
  kind app.push_reminder_kind,
  matchday_number smallint,
  matchday_points integer,
  overall_rank integer
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_limit not between 1 and 500 then
    raise exception using errcode = '22023', message = 'Invalid delivery limit';
  end if;

  return query
  with candidates as (
    select delivery.id
    from app.push_deliveries delivery
    join app.push_subscriptions subscription
      on subscription.id = delivery.subscription_id
      and subscription.user_id = delivery.user_id
    join app.profiles profile
      on profile.user_id = delivery.user_id
      and profile.status = 'active'
      and profile.app_role = 'user'
    join app.round_memberships recipient_membership
      on recipient_membership.round_id = delivery.round_id
      and recipient_membership.user_id = delivery.user_id
      and recipient_membership.status = 'active'
    join app.prediction_rounds round
      on round.id = delivery.round_id
      and round.status = 'active'
    where
      delivery.kind in ('matchday_published', 'matchday_evaluated')
      and (
        delivery.status in ('pending', 'failed')
        or (
          delivery.status = 'processing'
          and delivery.claimed_at < p_now - interval '10 minutes'
        )
      )
      and delivery.attempts < 3
    order by delivery.created_at, delivery.id
    limit p_limit
    for update of delivery skip locked
  ), claimed as (
    update app.push_deliveries delivery
    set
      status = 'processing',
      attempts = delivery.attempts + 1,
      claimed_at = p_now,
      last_error_code = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  ), recipients as materialized (
    select
      claimed.id as delivery_id,
      claimed.subscription_id,
      claimed.user_id,
      claimed.round_id,
      claimed.matchday_id,
      claimed.kind,
      subscription.endpoint,
      subscription.p256dh_key,
      subscription.auth_secret,
      membership.id as membership_id,
      matchday.number as matchday_number
    from claimed
    join app.push_subscriptions subscription
      on subscription.id = claimed.subscription_id
      and subscription.user_id = claimed.user_id
    join app.round_memberships membership
      on membership.round_id = claimed.round_id
      and membership.user_id = claimed.user_id
      and membership.status = 'active'
    join app.matchdays matchday on matchday.id = claimed.matchday_id
  ), matchday_totals as (
    select
      recipient.delivery_id,
      coalesce(sum(score.points), 0)::integer as points
    from recipients recipient
    left join app.prediction_scores score
      on score.membership_id = recipient.membership_id
      and score.round_id = recipient.round_id
      and score.matchday_id = recipient.matchday_id
    group by recipient.delivery_id
  ), overall_totals as (
    select
      recipient.delivery_id,
      membership.id as membership_id,
      coalesce(sum(score.points), 0)::integer as points
    from recipients recipient
    join app.round_memberships membership
      on membership.round_id = recipient.round_id
      and membership.status not in ('removed', 'anonymized')
    left join app.prediction_scores score
      on score.membership_id = membership.id
      and score.round_id = recipient.round_id
    group by recipient.delivery_id, membership.id
  ), overall_rankings as (
    select
      total.delivery_id,
      total.membership_id,
      rank() over (
        partition by total.delivery_id
        order by total.points desc
      )::integer as rank
    from overall_totals total
  )
  select
    recipient.delivery_id,
    recipient.subscription_id,
    recipient.endpoint,
    recipient.p256dh_key,
    recipient.auth_secret,
    recipient.round_id,
    recipient.matchday_id,
    recipient.kind,
    recipient.matchday_number,
    case
      when recipient.kind = 'matchday_evaluated' then matchday_total.points
      else null
    end as matchday_points,
    case
      when recipient.kind = 'matchday_evaluated' then overall_ranking.rank
      else null
    end as overall_rank
  from recipients recipient
  join matchday_totals matchday_total
    on matchday_total.delivery_id = recipient.delivery_id
  join overall_rankings overall_ranking
    on overall_ranking.delivery_id = recipient.delivery_id
    and overall_ranking.membership_id = recipient.membership_id
  order by recipient.delivery_id;
end
$function$;

revoke all on function private.enqueue_matchday_push_deliveries(uuid, app.push_reminder_kind),
  private.queue_published_matchday_from_matchday(),
  private.queue_published_matchday_from_match(),
  private.matchday_is_fully_evaluated(uuid),
  private.queue_evaluated_matchday()
from public, anon, authenticated;

revoke all on function api.claim_due_push_events(timestamptz, integer)
from public, anon, authenticated;
grant execute on function api.claim_due_push_events(timestamptz, integer)
to service_role;
