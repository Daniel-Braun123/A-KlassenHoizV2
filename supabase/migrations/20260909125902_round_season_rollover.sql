alter table app.prediction_rounds
  add column predecessor_round_id uuid references app.prediction_rounds(id) on delete set null,
  add constraint prediction_rounds_predecessor_not_self
    check (predecessor_round_id is null or predecessor_round_id <> id);

create unique index prediction_rounds_one_successor_idx
  on app.prediction_rounds(predecessor_round_id)
  where predecessor_round_id is not null;

create function private.guard_successor_round_invitation()
returns trigger
language plpgsql
security definer
set search_path = '' as $function$
begin
  if new.revoked_at is null and exists (
    select 1
    from app.prediction_rounds successor
    where successor.predecessor_round_id = new.round_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'Invitations are unavailable after a season rollover';
  end if;

  return new;
end
$function$;

revoke all on function private.guard_successor_round_invitation() from public, anon, authenticated;

create trigger invitations_guard_successor_round
before insert or update of revoked_at on private.invitations
for each row execute function private.guard_successor_round_invitation();

create or replace view api.my_rounds with (security_invoker = true) as
select r.id, r.name, r.status, r.version, r.league_season_id, m.id as membership_id, m.role, m.nickname,
  l.name as league_name, s.label as season_label, r.created_at, r.predecessor_round_id,
  successor.id as successor_round_id
from app.prediction_rounds r
join app.round_memberships m on m.round_id = r.id
  and m.user_id = (select auth.uid()) and m.status = 'active'
join app.league_seasons ls on ls.id = r.league_season_id
join app.leagues l on l.id = ls.league_id
join app.seasons s on s.id = ls.season_id
left join app.prediction_rounds successor on successor.predecessor_round_id = r.id;

create view api.round_rollover_options with (security_invoker = true) as
select source.id as source_round_id, target.id as league_season_id,
  league.name as league_name, league.short_name as league_short_name,
  target_season.label as season_label, target_season.starts_on, target_season.ends_on
from app.prediction_rounds source
join app.round_memberships owner_membership on owner_membership.round_id = source.id
  and owner_membership.user_id = (select auth.uid())
  and owner_membership.role = 'owner' and owner_membership.status = 'active'
join app.league_seasons source_league_season on source_league_season.id = source.league_season_id
join app.seasons source_season on source_season.id = source_league_season.season_id
join app.league_seasons target on target.status = 'published'
join app.seasons target_season on target_season.id = target.season_id
  and target_season.starts_on > source_season.ends_on
join app.leagues league on league.id = target.league_id
where source_league_season.status in ('completed', 'archived')
  and not exists (
    select 1 from app.prediction_rounds successor where successor.predecessor_round_id = source.id
  );

revoke all on api.round_rollover_options from public, anon;
grant select on api.round_rollover_options to authenticated, service_role;

create function private.rollover_round(
  p_source_round_id uuid,
  p_target_league_season_id uuid,
  p_expected_version integer
) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare
  actor uuid;
  source_round app.prediction_rounds%rowtype;
  source_season_ends_on date;
  source_league_status app.league_season_status;
  target_season_starts_on date;
  target_league_status app.league_season_status;
  successor_round_id uuid;
  successor_owner_membership_id uuid := gen_random_uuid();
begin
  actor := private.require_round_user();

  select * into source_round
  from app.prediction_rounds
  where id = p_source_round_id
  for update;

  if source_round.id is null or not private.is_round_owner(p_source_round_id) then
    raise exception using errcode = '42501', message = 'Round owner required';
  end if;

  select id into successor_round_id
  from app.prediction_rounds
  where predecessor_round_id = p_source_round_id;
  if successor_round_id is not null then return successor_round_id; end if;

  if source_round.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'Version conflict';
  end if;

  perform private.enforce_rate_limit(
    actor,
    'round_rollover:' || p_source_round_id::text,
    3,
    interval '15 minutes'
  );

  perform 1
  from app.league_seasons
  where id in (source_round.league_season_id, p_target_league_season_id)
  order by id
  for share;

  select ls.status, season.ends_on
  into source_league_status, source_season_ends_on
  from app.league_seasons ls
  join app.seasons season on season.id = ls.season_id
  where ls.id = source_round.league_season_id;

  select ls.status, season.starts_on
  into target_league_status, target_season_starts_on
  from app.league_seasons ls
  join app.seasons season on season.id = ls.season_id
  where ls.id = p_target_league_season_id;

  if source_league_status not in ('completed', 'archived') then
    raise exception using errcode = '23514', message = 'Source season must be completed';
  end if;
  if target_league_status is distinct from 'published'
    or target_season_starts_on <= source_season_ends_on then
    raise exception using errcode = '22023', message = 'A later published league season is required';
  end if;

  successor_round_id := gen_random_uuid();
  insert into app.prediction_rounds(
    id, name, league_season_id, owner_membership_id, predecessor_round_id
  ) values (
    successor_round_id,
    source_round.name,
    p_target_league_season_id,
    successor_owner_membership_id,
    source_round.id
  );

  -- Revoke the old invitation before taking the membership snapshot so a
  -- concurrent join either completes first and is copied, or observes the
  -- revoked token and cannot enter the finished season afterwards.
  update private.invitations
  set revoked_at = clock_timestamp()
  where round_id = source_round.id and revoked_at is null;

  insert into app.round_memberships(id, round_id, user_id, role, nickname)
  select
    case
      when membership.id = source_round.owner_membership_id
        then successor_owner_membership_id
      else gen_random_uuid()
    end,
    successor_round_id,
    membership.user_id,
    membership.role,
    membership.nickname
  from app.round_memberships membership
  where membership.round_id = source_round.id and membership.status = 'active';

  update app.profiles
  set last_active_round_id = successor_round_id
  where user_id = actor;

  return successor_round_id;
end
$function$;

revoke all on function private.rollover_round(uuid, uuid, integer) from public, anon, authenticated;

create function api.rollover_round(
  p_source_round_id uuid,
  p_target_league_season_id uuid,
  p_expected_version integer
) returns uuid
language sql security definer set search_path = '' as $function$
  select private.rollover_round(p_source_round_id, p_target_league_season_id, p_expected_version)
$function$;

revoke all on function api.rollover_round(uuid, uuid, integer) from public, anon;
grant execute on function api.rollover_round(uuid, uuid, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
