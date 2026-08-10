create type app.push_reminder_kind as enum ('advance_24h', 'final_60m');
create type app.push_delivery_status as enum ('pending', 'processing', 'sent', 'failed');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table app.push_notification_preferences (
  user_id uuid primary key references app.profiles(user_id) on delete cascade,
  missing_tips_enabled boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table app.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(user_id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_secret text not null,
  user_agent text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  unique (id, user_id),
  constraint push_subscriptions_endpoint_https check (
    endpoint = btrim(endpoint)
    and endpoint like 'https://%'
    and char_length(endpoint) between 12 and 2048
  ),
  constraint push_subscriptions_keys_valid check (
    p256dh_key = btrim(p256dh_key)
    and auth_secret = btrim(auth_secret)
    and char_length(p256dh_key) between 16 and 512
    and char_length(auth_secret) between 8 and 256
  ),
  constraint push_subscriptions_user_agent_length check (
    user_agent is null or char_length(user_agent) <= 512
  )
);

create table app.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null,
  user_id uuid not null,
  round_id uuid not null references app.prediction_rounds(id) on delete cascade,
  matchday_id uuid not null references app.matchdays(id) on delete cascade,
  kind app.push_reminder_kind not null,
  status app.push_delivery_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 3),
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (subscription_id, user_id)
    references app.push_subscriptions(id, user_id) on delete cascade,
  constraint push_deliveries_reminder_unique
    unique (subscription_id, round_id, matchday_id, kind),
  constraint push_deliveries_error_length check (
    last_error_code is null or char_length(last_error_code) <= 80
  )
);

create index push_subscriptions_user_id_idx on app.push_subscriptions(user_id);
create index push_deliveries_claim_idx
  on app.push_deliveries(status, claimed_at, created_at)
  where status in ('pending', 'processing', 'failed');

create trigger push_notification_preferences_set_updated_at
before update on app.push_notification_preferences
for each row execute function private.set_updated_at();

create trigger push_subscriptions_set_updated_at
before update on app.push_subscriptions
for each row execute function private.set_updated_at();

create trigger push_deliveries_set_updated_at
before update on app.push_deliveries
for each row execute function private.set_updated_at();

alter table app.push_notification_preferences enable row level security;
alter table app.push_notification_preferences force row level security;
alter table app.push_subscriptions enable row level security;
alter table app.push_subscriptions force row level security;
alter table app.push_deliveries enable row level security;
alter table app.push_deliveries force row level security;

create policy push_notification_preferences_own_read
on app.push_notification_preferences for select to authenticated
using (private.is_active_user() and user_id = (select auth.uid()));

create policy push_subscriptions_own_read
on app.push_subscriptions for select to authenticated
using (private.is_active_user() and user_id = (select auth.uid()));

revoke all on app.push_notification_preferences, app.push_subscriptions, app.push_deliveries
from public, anon, authenticated;
grant select on app.push_notification_preferences, app.push_subscriptions to authenticated;
grant all on app.push_notification_preferences, app.push_subscriptions, app.push_deliveries
to service_role;

create view api.my_push_notification_preferences with (security_invoker = true) as
select user_id, missing_tips_enabled, updated_at
from app.push_notification_preferences
where user_id = (select auth.uid());

create view api.my_push_subscriptions with (security_invoker = true) as
select id, endpoint, p256dh_key, auth_secret, created_at, updated_at, last_seen_at
from app.push_subscriptions
where user_id = (select auth.uid());

revoke all on api.my_push_notification_preferences, api.my_push_subscriptions
from public, anon;
grant select on api.my_push_notification_preferences, api.my_push_subscriptions
to authenticated, service_role;

create function api.upsert_my_push_subscription(
  p_endpoint text,
  p_p256dh_key text,
  p_auth_secret text,
  p_user_agent text default null
) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare
  actor uuid;
  subscription_id uuid;
begin
  actor := private.require_round_user();
  perform private.enforce_rate_limit(actor, 'push-subscription', 20, interval '5 minutes');

  p_endpoint := btrim(p_endpoint);
  p_p256dh_key := btrim(p_p256dh_key);
  p_auth_secret := btrim(p_auth_secret);
  p_user_agent := nullif(left(btrim(p_user_agent), 512), '');

  if p_endpoint not like 'https://%'
    or char_length(p_endpoint) not between 12 and 2048
    or char_length(p_p256dh_key) not between 16 and 512
    or char_length(p_auth_secret) not between 8 and 256 then
    raise exception using errcode = '22023', message = 'Invalid push subscription';
  end if;

  insert into app.push_notification_preferences(user_id)
  values (actor)
  on conflict (user_id) do nothing;

  insert into app.push_subscriptions(user_id, endpoint, p256dh_key, auth_secret, user_agent)
  values (actor, p_endpoint, p_p256dh_key, p_auth_secret, p_user_agent)
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh_key = excluded.p256dh_key,
    auth_secret = excluded.auth_secret,
    user_agent = excluded.user_agent,
    last_seen_at = clock_timestamp()
  returning id into subscription_id;

  return subscription_id;
end
$function$;

create function api.remove_my_push_subscription(p_endpoint text) returns boolean
language plpgsql security definer set search_path = '' as $function$
declare
  actor uuid;
  removed_count integer;
begin
  actor := private.require_round_user();
  delete from app.push_subscriptions
  where user_id = actor and endpoint = btrim(p_endpoint);
  get diagnostics removed_count = row_count;
  return removed_count > 0;
end
$function$;

create function api.set_my_push_preferences(p_missing_tips_enabled boolean) returns boolean
language plpgsql security definer set search_path = '' as $function$
declare actor uuid;
begin
  actor := private.require_round_user();
  insert into app.push_notification_preferences(user_id, missing_tips_enabled)
  values (actor, p_missing_tips_enabled)
  on conflict (user_id) do update set missing_tips_enabled = excluded.missing_tips_enabled;
  return p_missing_tips_enabled;
end
$function$;

revoke all on function api.upsert_my_push_subscription(text, text, text, text),
  api.remove_my_push_subscription(text), api.set_my_push_preferences(boolean)
from public, anon;
grant execute on function api.upsert_my_push_subscription(text, text, text, text),
  api.remove_my_push_subscription(text), api.set_my_push_preferences(boolean)
to authenticated, service_role;

create function api.claim_due_push_reminders(
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
  missing_count integer,
  next_kickoff_at timestamptz
)
language plpgsql security definer set search_path = '' as $function$
begin
  if p_limit not between 1 and 500 then
    raise exception using errcode = '22023', message = 'Invalid delivery limit';
  end if;

  with eligible as (
    select
      sub.id as subscription_id,
      sub.user_id,
      membership.round_id,
      matchday.id as matchday_id,
      case
        when min(match.kickoff_at) <= p_now + interval '60 minutes'
          then 'final_60m'::app.push_reminder_kind
        else 'advance_24h'::app.push_reminder_kind
      end as kind
    from app.push_subscriptions sub
    join app.push_notification_preferences preference
      on preference.user_id = sub.user_id
      and preference.missing_tips_enabled
    join app.profiles profile
      on profile.user_id = sub.user_id
      and profile.status = 'active'
      and profile.app_role = 'user'
    join app.round_memberships membership
      on membership.user_id = sub.user_id
      and membership.status = 'active'
    join app.prediction_rounds round
      on round.id = membership.round_id
      and round.status = 'active'
    join app.matchdays matchday
      on matchday.league_season_id = round.league_season_id
      and matchday.status = 'published'
    join app.matches match
      on match.matchday_id = matchday.id
      and match.status in ('published', 'postponed')
      and match.kickoff_at > p_now
    left join app.predictions prediction
      on prediction.round_id = round.id
      and prediction.membership_id = membership.id
      and prediction.match_id = match.id
    where prediction.id is null
    group by sub.id, sub.user_id, membership.round_id, matchday.id
    having min(match.kickoff_at) <= p_now + interval '24 hours'
  )
  insert into app.push_deliveries(subscription_id, user_id, round_id, matchday_id, kind)
  select
    eligible.subscription_id,
    eligible.user_id,
    eligible.round_id,
    eligible.matchday_id,
    eligible.kind
  from eligible
  on conflict on constraint push_deliveries_reminder_unique do nothing;

  return query
  with eligible as materialized (
    select
      sub.id as subscription_id,
      sub.user_id,
      sub.endpoint,
      sub.p256dh_key,
      sub.auth_secret,
      membership.round_id,
      matchday.id as matchday_id,
      case
        when min(match.kickoff_at) <= p_now + interval '60 minutes'
          then 'final_60m'::app.push_reminder_kind
        else 'advance_24h'::app.push_reminder_kind
      end as kind,
      count(*)::integer as missing_count,
      min(match.kickoff_at) as next_kickoff_at
    from app.push_subscriptions sub
    join app.push_notification_preferences preference
      on preference.user_id = sub.user_id
      and preference.missing_tips_enabled
    join app.profiles profile
      on profile.user_id = sub.user_id
      and profile.status = 'active'
      and profile.app_role = 'user'
    join app.round_memberships membership
      on membership.user_id = sub.user_id
      and membership.status = 'active'
    join app.prediction_rounds round
      on round.id = membership.round_id
      and round.status = 'active'
    join app.matchdays matchday
      on matchday.league_season_id = round.league_season_id
      and matchday.status = 'published'
    join app.matches match
      on match.matchday_id = matchday.id
      and match.status in ('published', 'postponed')
      and match.kickoff_at > p_now
    left join app.predictions prediction
      on prediction.round_id = round.id
      and prediction.membership_id = membership.id
      and prediction.match_id = match.id
    where prediction.id is null
    group by
      sub.id, sub.user_id, sub.endpoint, sub.p256dh_key, sub.auth_secret,
      membership.round_id, matchday.id
    having min(match.kickoff_at) <= p_now + interval '24 hours'
  ), candidates as (
    select delivery.id
    from app.push_deliveries delivery
    join eligible
      on eligible.subscription_id = delivery.subscription_id
      and eligible.round_id = delivery.round_id
      and eligible.matchday_id = delivery.matchday_id
      and eligible.kind = delivery.kind
    where
      (delivery.status in ('pending', 'failed')
        or (delivery.status = 'processing'
          and delivery.claimed_at < p_now - interval '10 minutes'))
      and delivery.attempts < 3
    order by eligible.next_kickoff_at, delivery.created_at
    limit p_limit
    for update of delivery skip locked
  ), claimed as (
    update app.push_deliveries delivery set
      status = 'processing',
      attempts = delivery.attempts + 1,
      claimed_at = p_now,
      last_error_code = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  )
  select
    claimed.id,
    eligible.subscription_id,
    eligible.endpoint,
    eligible.p256dh_key,
    eligible.auth_secret,
    eligible.round_id,
    eligible.matchday_id,
    eligible.kind,
    eligible.missing_count,
    eligible.next_kickoff_at
  from claimed
  join eligible
    on eligible.subscription_id = claimed.subscription_id
    and eligible.round_id = claimed.round_id
    and eligible.matchday_id = claimed.matchday_id
    and eligible.kind = claimed.kind;
end
$function$;

create function api.complete_push_delivery(
  p_delivery_id uuid,
  p_succeeded boolean,
  p_error_code text default null
) returns void
language plpgsql security definer set search_path = '' as $function$
begin
  update app.push_deliveries set
    status = case
      when p_succeeded then 'sent'::app.push_delivery_status
      else 'failed'::app.push_delivery_status
    end,
    sent_at = case when p_succeeded then clock_timestamp() else null end,
    last_error_code = case
      when p_succeeded then null
      else left(coalesce(nullif(btrim(p_error_code), ''), 'unknown'), 80)
    end
  where id = p_delivery_id and status = 'processing';
end
$function$;

create function api.delete_push_subscription(p_subscription_id uuid) returns void
language sql security definer set search_path = '' as $function$
  delete from app.push_subscriptions where id = p_subscription_id
$function$;

revoke all on function api.claim_due_push_reminders(timestamptz, integer),
  api.complete_push_delivery(uuid, boolean, text), api.delete_push_subscription(uuid)
from public, anon, authenticated;
grant execute on function api.claim_due_push_reminders(timestamptz, integer),
  api.complete_push_delivery(uuid, boolean, text), api.delete_push_subscription(uuid)
to service_role;

create or replace function api.prepare_account_deletion() returns uuid
language plpgsql security definer set search_path = '' as $function$
declare actor uuid; membership record;
begin
  actor := private.require_round_user();
  if exists(
    select 1 from app.round_memberships
    where user_id = actor and role = 'owner' and status = 'active'
  ) then
    raise exception using errcode = 'P0001', message = 'Transfer or delete owned rounds first';
  end if;
  delete from app.push_subscriptions where user_id = actor;
  delete from app.push_notification_preferences where user_id = actor;
  for membership in
    select id from app.round_memberships where user_id = actor order by round_id, id for update
  loop
    update app.round_memberships set
      user_id = null,
      status = 'anonymized',
      ended_at = coalesce(ended_at, clock_timestamp()),
      anonymization_key = gen_random_uuid(),
      nickname = 'Gelöschtes Mitglied'
    where id = membership.id;
  end loop;
  update app.profiles set
    deletion_pending_at = coalesce(deletion_pending_at, clock_timestamp()),
    last_active_round_id = null
  where user_id = actor;
  return actor;
end
$function$;

create function private.invoke_push_reminder_endpoint() returns bigint
language plpgsql security definer set search_path = '' as $function$
declare
  target_url text;
  cron_secret text;
  request_id bigint;
begin
  select decrypted_secret into target_url
  from vault.decrypted_secrets
  where name = 'push_reminder_endpoint';

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets
  where name = 'push_cron_secret';

  if target_url is null or cron_secret is null then
    return null;
  end if;

  select net.http_post(
    url := target_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  ) into request_id;
  return request_id;
end
$function$;

revoke all on function private.invoke_push_reminder_endpoint() from public, anon, authenticated;

select cron.schedule(
  'dispatch-push-reminders',
  '*/10 * * * *',
  'select private.invoke_push_reminder_endpoint()'
);
