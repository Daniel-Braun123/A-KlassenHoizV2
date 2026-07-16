-- Simplified competition administration. The existing league-season key remains
-- the stable internal reference used by private prediction rounds, but the API
-- exposes one product concept: a league with a year and a selected club set.

-- The product owner explicitly chose a clean competition restart. User accounts
-- and app-admin assignments are intentionally preserved.
delete from app.prediction_rounds;
delete from private.mutation_idempotency
where scope in ('create_round', 'join_round', 'save_prediction');
delete from app.result_revisions;
delete from app.match_results;
delete from app.matches;
delete from app.matchdays;
delete from app.league_season_clubs;
delete from app.league_seasons;
delete from app.seasons;
delete from app.leagues;
delete from app.clubs;

drop index if exists app.leagues_name_ci_unique;
alter table app.seasons drop constraint if exists seasons_label_key;

alter table app.clubs alter column short_name drop not null;
alter table app.clubs add column logo_url text;
alter table app.clubs add constraint clubs_logo_url_valid check (
  logo_url is null or (
    logo_url = btrim(logo_url)
    and char_length(logo_url) between 8 and 2048
    and logo_url ~* '^https?://'
  )
);

create type app.matchday_phase as enum ('first_leg', 'second_leg');
alter table app.matchdays add column phase app.matchday_phase not null default 'first_leg';
alter table app.matchdays drop constraint if exists matchdays_league_season_id_number_key;
create unique index matchdays_league_phase_number_unique
  on app.matchdays (league_season_id, phase, number);

create table private.competition_change_audit (
  id bigint generated always as identity primary key,
  object_type text not null check (object_type in ('league', 'matchday', 'match')),
  object_id uuid not null,
  action text not null check (char_length(btrim(action)) between 1 and 60),
  reason text check (reason is null or (reason = btrim(reason) and char_length(reason) between 1 and 500)),
  changed_by uuid not null references app.profiles(user_id),
  changed_at timestamptz not null default clock_timestamp()
);
revoke all on private.competition_change_audit from public, anon, authenticated;
grant all on private.competition_change_audit to service_role;

create function private.league_has_predictions(p_league_season_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select private.is_app_admin() and exists (
    select 1
    from app.predictions p
    join app.prediction_rounds r on r.id = p.round_id
    where r.league_season_id = p_league_season_id
  )
$function$;

create function private.matchday_has_predictions(p_matchday_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select private.is_app_admin() and exists (
    select 1 from app.predictions p
    join app.matches m on m.id = p.match_id
    where m.matchday_id = p_matchday_id
  )
$function$;

create function private.match_has_predictions(p_match_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select private.is_app_admin() and exists (select 1 from app.predictions where match_id = p_match_id)
$function$;

revoke all on function private.league_has_predictions(uuid),
  private.matchday_has_predictions(uuid), private.match_has_predictions(uuid)
  from public, anon, authenticated;
grant execute on function private.league_has_predictions(uuid),
  private.matchday_has_predictions(uuid), private.match_has_predictions(uuid)
  to authenticated, service_role;

create function private.require_valid_league_year(p_year_label text)
returns integer language plpgsql immutable set search_path = '' as $function$
declare
  first_year integer;
  second_year integer;
begin
  if coalesce(p_year_label, '') !~ '^[0-9]{2}/[0-9]{2}$' then
    raise exception using errcode = '22023', message = 'Year must use the format 26/27';
  end if;
  first_year := 2000 + split_part(p_year_label, '/', 1)::integer;
  second_year := split_part(p_year_label, '/', 2)::integer;
  if second_year <> ((first_year + 1) % 100) then
    raise exception using errcode = '22023', message = 'League year must contain consecutive years';
  end if;
  return first_year;
end
$function$;
revoke all on function private.require_valid_league_year(text) from public, anon, authenticated;

create function private.require_valid_club_set(p_club_ids uuid[])
returns void language plpgsql stable security definer set search_path = '' as $function$
declare
  requested_count integer := coalesce(cardinality(p_club_ids), 0);
  active_count integer;
begin
  if requested_count < 2 then
    raise exception using errcode = '22023', message = 'A league needs at least two clubs';
  end if;
  select count(distinct c.id) into active_count
  from app.clubs c
  where c.id = any(p_club_ids) and c.status = 'active';
  if active_count <> requested_count then
    raise exception using errcode = '22023', message = 'Club selection contains duplicates or unavailable clubs';
  end if;
end
$function$;
revoke all on function private.require_valid_club_set(uuid[]) from public, anon, authenticated;

create function private.validate_matchday_club_uniqueness()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  perform 1 from app.matchdays where id = new.matchday_id for update;
  if exists (
    select 1 from app.matches m
    where m.matchday_id = new.matchday_id
      and m.id <> new.id
      and (
        m.home_club_id in (new.home_club_id, new.away_club_id)
        or m.away_club_id in (new.home_club_id, new.away_club_id)
      )
  ) then
    raise exception using errcode = '23514', message = 'A club can only play once per matchday';
  end if;
  return new;
end
$function$;

create trigger matches_validate_matchday_club_uniqueness
before insert or update of matchday_id, home_club_id, away_club_id on app.matches
for each row execute function private.validate_matchday_club_uniqueness();
revoke all on function private.validate_matchday_club_uniqueness() from public, anon, authenticated;

create or replace view api.club_catalog with (security_invoker = true) as
select c.id, c.name, c.short_name, c.logo_path, c.status, c.version, c.logo_url
from app.clubs c;

create view api.admin_leagues with (security_invoker = true) as
select
  ls.id,
  ls.status,
  ls.version,
  l.name,
  s.label as year_label,
  coalesce(clubs.club_ids, array[]::uuid[]) as club_ids,
  coalesce(clubs.club_names, array[]::text[]) as club_names,
  coalesce(clubs.club_count, 0)::integer as club_count,
  private.league_has_predictions(ls.id) as has_predictions
from app.league_seasons ls
join app.leagues l on l.id = ls.league_id
join app.seasons s on s.id = ls.season_id
left join lateral (
  select
    array_agg(c.id order by c.name) as club_ids,
    array_agg(c.name order by c.name) as club_names,
    count(*) as club_count
  from app.league_season_clubs lsc
  join app.clubs c on c.id = lsc.club_id
  where lsc.league_season_id = ls.id and lsc.status = 'active'
) clubs on true;

create view api.admin_schedule with (security_invoker = true) as
select
  md.id as matchday_id,
  md.league_season_id as league_id,
  l.name as league_name,
  s.label as year_label,
  md.phase,
  md.number as matchday_number,
  md.display_name,
  md.status as matchday_status,
  md.version as matchday_version,
  private.matchday_has_predictions(md.id) as matchday_has_predictions,
  m.id as match_id,
  m.home_club_id,
  hc.name as home_club_name,
  hc.logo_url as home_club_logo_url,
  m.away_club_id,
  ac.name as away_club_name,
  ac.logo_url as away_club_logo_url,
  m.kickoff_at,
  m.status as match_status,
  m.version as match_version,
  private.match_has_predictions(m.id) as match_has_predictions,
  r.decision,
  r.home_goals,
  r.away_goals,
  r.revision_no,
  case
    when m.id is null then null
    when r.match_id is not null then 'completed'
    when m.status = 'postponed' then 'postponed'
    when m.status = 'cancelled' then 'cancelled'
    when m.status = 'abandoned' then 'abandoned'
    when clock_timestamp() < m.kickoff_at then 'scheduled'
    when clock_timestamp() < m.kickoff_at + interval '90 minutes' then 'live'
    else 'result_missing'
  end as display_status,
  (m.id is not null and clock_timestamp() >= m.kickoff_at + interval '90 minutes') as can_enter_result
from app.matchdays md
join app.league_seasons ls on ls.id = md.league_season_id
join app.leagues l on l.id = ls.league_id
join app.seasons s on s.id = ls.season_id
left join app.matches m on m.matchday_id = md.id
left join app.clubs hc on hc.id = m.home_club_id
left join app.clubs ac on ac.id = m.away_club_id
left join app.match_results r on r.match_id = m.id;

create or replace view api.matchday_prediction_sheet with (security_invoker = true) as
select
  r.id as round_id,
  md.id as matchday_id,
  md.number as matchday_number,
  md.display_name,
  md.status as matchday_status,
  mt.id as match_id,
  mt.kickoff_at,
  mt.status as match_status,
  hc.id as home_club_id,
  hc.name as home_club_name,
  hc.short_name as home_club_short_name,
  hc.logo_path as home_logo_path,
  ac.id as away_club_id,
  ac.name as away_club_name,
  ac.short_name as away_club_short_name,
  ac.logo_path as away_logo_path,
  p.home_goals as predicted_home_goals,
  p.away_goals as predicted_away_goals,
  p.updated_at as prediction_saved_at,
  (clock_timestamp() < mt.kickoff_at and mt.status in ('published', 'postponed') and md.status = 'published') as is_open,
  md.phase,
  hc.logo_url as home_logo_url,
  ac.logo_url as away_logo_url
from app.prediction_rounds r
join app.round_memberships own_m on own_m.round_id = r.id and own_m.user_id = (select auth.uid()) and own_m.status = 'active'
join app.matchdays md on md.league_season_id = r.league_season_id and md.status in ('published', 'completed')
join app.matches mt on mt.matchday_id = md.id and mt.status <> 'draft'
join app.clubs hc on hc.id = mt.home_club_id
join app.clubs ac on ac.id = mt.away_club_id
left join app.predictions p on p.round_id = r.id and p.membership_id = own_m.id and p.match_id = mt.id;

create or replace view api.round_results with (security_invoker = true) as
select
  r.id as round_id,
  md.id as matchday_id,
  md.number as matchday_number,
  md.display_name,
  mt.id as match_id,
  mt.kickoff_at,
  mt.status as match_status,
  hc.name as home_club_name,
  ac.name as away_club_name,
  mr.decision,
  mr.home_goals,
  mr.away_goals,
  mr.revision_no,
  mr.updated_at,
  coalesce(mr.revision_no, 0) > 1 as is_correction,
  md.phase,
  hc.logo_url as home_logo_url,
  ac.logo_url as away_logo_url,
  case
    when mr.match_id is not null then 'completed'
    when mt.status = 'postponed' then 'postponed'
    when mt.status = 'cancelled' then 'cancelled'
    when mt.status = 'abandoned' then 'abandoned'
    when clock_timestamp() < mt.kickoff_at then 'scheduled'
    when clock_timestamp() < mt.kickoff_at + interval '90 minutes' then 'live'
    else 'result_missing'
  end as display_status
from app.prediction_rounds r
join app.round_memberships own_m on own_m.round_id = r.id and own_m.user_id = (select auth.uid()) and own_m.status = 'active'
join app.matchdays md on md.league_season_id = r.league_season_id and md.status in ('published', 'completed')
join app.matches mt on mt.matchday_id = md.id and mt.status <> 'draft'
join app.clubs hc on hc.id = mt.home_club_id
join app.clubs ac on ac.id = mt.away_club_id
left join app.match_results mr on mr.match_id = mt.id;

revoke all on api.admin_leagues, api.admin_schedule from public, anon;
grant select on api.admin_leagues, api.admin_schedule to authenticated, service_role;
grant select on api.matchday_prediction_sheet, api.round_results to authenticated, service_role;
grant select on api.club_catalog to authenticated, service_role;

create function api.create_admin_league(p_name text, p_year_label text, p_club_ids uuid[])
returns uuid language plpgsql security definer set search_path = '' as $function$
declare
  league_id uuid;
  season_id uuid;
  league_season_id uuid;
  first_year integer;
begin
  perform private.require_app_admin();
  perform private.require_valid_club_set(p_club_ids);
  first_year := private.require_valid_league_year(btrim(p_year_label));
  if exists (
    select 1 from app.league_seasons ls
    join app.leagues l on l.id = ls.league_id
    join app.seasons s on s.id = ls.season_id
    where lower(l.name) = lower(btrim(p_name)) and s.label = btrim(p_year_label)
  ) then
    raise exception using errcode = '23505', message = 'League and year already exist';
  end if;
  insert into app.leagues(name, status) values (btrim(p_name), 'active') returning id into league_id;
  insert into app.seasons(label, starts_on, ends_on, status)
  values (btrim(p_year_label), make_date(first_year, 7, 1), make_date(first_year + 1, 6, 30), 'active')
  returning id into season_id;
  insert into app.league_seasons(league_id, season_id) values (league_id, season_id)
  returning id into league_season_id;
  insert into app.league_season_clubs(league_season_id, club_id)
  select league_season_id, club_id from unnest(p_club_ids) club_id;
  return league_season_id;
end
$function$;

create function api.update_admin_league(
  p_id uuid,
  p_expected_version integer,
  p_name text,
  p_year_label text,
  p_club_ids uuid[],
  p_reason text default null
) returns integer language plpgsql security definer set search_path = '' as $function$
declare
  target app.league_seasons%rowtype;
  first_year integer;
  has_predictions boolean;
  new_version integer;
begin
  perform private.require_app_admin();
  perform private.require_valid_club_set(p_club_ids);
  first_year := private.require_valid_league_year(btrim(p_year_label));
  select * into target from app.league_seasons where id = p_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'League unavailable'; end if;
  if target.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  has_predictions := private.league_has_predictions(p_id);
  if has_predictions and nullif(btrim(p_reason), '') is null then
    raise exception using errcode = '22023', message = 'A reason is required because predictions already exist';
  end if;
  if exists (
    select 1 from app.league_seasons ls
    join app.leagues l on l.id = ls.league_id
    join app.seasons s on s.id = ls.season_id
    where ls.id <> p_id and lower(l.name) = lower(btrim(p_name)) and s.label = btrim(p_year_label)
  ) then
    raise exception using errcode = '23505', message = 'League and year already exist';
  end if;
  update app.leagues set name = btrim(p_name), version = version + 1 where id = target.league_id;
  update app.seasons set label = btrim(p_year_label), starts_on = make_date(first_year, 7, 1),
    ends_on = make_date(first_year + 1, 6, 30), version = version + 1 where id = target.season_id;
  update app.league_season_clubs set status = 'withdrawn' where league_season_id = p_id;
  insert into app.league_season_clubs(league_season_id, club_id, status)
  select p_id, club_id, 'active'::app.league_season_club_status from unnest(p_club_ids) club_id
  on conflict (league_season_id, club_id) do update set status = excluded.status;
  update app.league_seasons set version = version + 1 where id = p_id returning version into new_version;
  insert into private.competition_change_audit(object_type, object_id, action, reason, changed_by)
  values ('league', p_id, 'updated', nullif(btrim(p_reason), ''), auth.uid());
  return new_version;
end
$function$;

create function api.publish_admin_league(p_id uuid, p_expected_version integer)
returns integer language plpgsql security definer set search_path = '' as $function$
declare
  new_version integer;
begin
  perform private.require_app_admin();
  update app.league_seasons
  set status = 'published', published_at = clock_timestamp(), version = version + 1
  where id = p_id and version = p_expected_version and status = 'draft'
  returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'League is not a current draft'; end if;
  update app.matchdays set status = 'published', version = version + 1
  where league_season_id = p_id and status = 'draft';
  update app.matches m set status = 'published', version = m.version + 1
  from app.matchdays md where md.id = m.matchday_id and md.league_season_id = p_id and m.status = 'draft';
  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('league', p_id, 'published', auth.uid());
  return new_version;
end
$function$;

create function api.create_club_simple(p_name text, p_logo_url text default null)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.clubs(name, short_name, logo_url)
  values (btrim(p_name), null, nullif(btrim(p_logo_url), '')) returning id into new_id;
  return new_id;
end
$function$;

create function api.update_club_simple(
  p_id uuid, p_expected_version integer, p_name text, p_logo_url text default null
) returns integer language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.clubs set name = btrim(p_name), logo_url = nullif(btrim(p_logo_url), ''), version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end
$function$;

create function api.create_matchday_auto(p_league_id uuid, p_phase app.matchday_phase)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare
  next_number smallint;
  new_id uuid;
  league_status app.league_season_status;
begin
  perform private.require_app_admin();
  select status into league_status from app.league_seasons where id = p_league_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'League unavailable'; end if;
  select (coalesce(max(number), 0) + 1)::smallint into next_number
  from app.matchdays where league_season_id = p_league_id and phase = p_phase;
  insert into app.matchdays(league_season_id, phase, number, display_name, status)
  values (
    p_league_id,
    p_phase,
    next_number,
    case when p_phase = 'first_leg' then 'Hinrunde · Spieltag ' else 'Rückrunde · Spieltag ' end || next_number,
    case when league_status = 'published' then 'published'::app.matchday_status else 'draft'::app.matchday_status end
  ) returning id into new_id;
  return new_id;
end
$function$;

create function api.move_matchday_phase(
  p_id uuid, p_expected_version integer, p_phase app.matchday_phase
) returns integer language plpgsql security definer set search_path = '' as $function$
declare
  target app.matchdays%rowtype;
  next_number smallint;
  new_version integer;
begin
  perform private.require_app_admin();
  select * into target from app.matchdays where id = p_id for update;
  if not found or target.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'Version conflict';
  end if;
  if private.matchday_has_predictions(p_id) then
    raise exception using errcode = '22023', message = 'Matchday cannot be changed after predictions';
  end if;
  if target.phase = p_phase then return target.version; end if;
  select (coalesce(max(number), 0) + 1)::smallint into next_number
  from app.matchdays where league_season_id = target.league_season_id and phase = p_phase;
  update app.matchdays set phase = p_phase, number = next_number,
    display_name = (case when p_phase = 'first_leg' then 'Hinrunde · Spieltag ' else 'Rückrunde · Spieltag ' end) || next_number,
    version = version + 1 where id = p_id returning version into new_version;
  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('matchday', p_id, 'phase_changed', auth.uid());
  return new_version;
end
$function$;

create function api.delete_matchday_simple(p_id uuid, p_expected_version integer)
returns void language plpgsql security definer set search_path = '' as $function$
begin
  perform private.require_app_admin();
  perform 1 from app.matchdays where id = p_id and version = p_expected_version for update;
  if not found then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  if private.matchday_has_predictions(p_id) then
    raise exception using errcode = '22023', message = 'Matchday cannot be deleted after predictions';
  end if;
  delete from app.result_revisions where match_id in (select id from app.matches where matchday_id = p_id);
  delete from app.match_results where match_id in (select id from app.matches where matchday_id = p_id);
  delete from app.matches where matchday_id = p_id;
  delete from app.matchdays where id = p_id;
  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('matchday', p_id, 'deleted', auth.uid());
end
$function$;

create function api.create_match_simple(
  p_matchday_id uuid, p_home_club_id uuid, p_away_club_id uuid, p_kickoff_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $function$
declare
  new_id uuid;
  day_status app.matchday_status;
begin
  perform private.require_app_admin();
  select status into day_status from app.matchdays where id = p_matchday_id;
  if not found then raise exception using errcode = 'P0002', message = 'Matchday unavailable'; end if;
  if private.matchday_has_predictions(p_matchday_id) then
    raise exception using errcode = '22023', message = 'Matches cannot be added after predictions';
  end if;
  insert into app.matches(matchday_id, home_club_id, away_club_id, kickoff_at, status)
  values (
    p_matchday_id, p_home_club_id, p_away_club_id, p_kickoff_at,
    case when day_status = 'published' then 'published'::app.match_status else 'draft'::app.match_status end
  ) returning id into new_id;
  return new_id;
end
$function$;

create function api.update_match_simple(
  p_id uuid,
  p_expected_version integer,
  p_home_club_id uuid,
  p_away_club_id uuid,
  p_kickoff_at timestamptz,
  p_status app.match_status
) returns integer language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  if p_status = 'completed' then
    raise exception using errcode = '22023', message = 'Completed state is controlled by results';
  end if;
  if private.match_has_predictions(p_id) then
    raise exception using errcode = '22023', message = 'Match cannot be changed after predictions';
  end if;
  update app.matches set home_club_id = p_home_club_id, away_club_id = p_away_club_id,
    kickoff_at = p_kickoff_at, status = p_status, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('match', p_id, 'updated', auth.uid());
  return new_version;
end
$function$;

create function api.delete_match_simple(p_id uuid, p_expected_version integer)
returns void language plpgsql security definer set search_path = '' as $function$
begin
  perform private.require_app_admin();
  perform 1 from app.matches where id = p_id and version = p_expected_version for update;
  if not found then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  if private.match_has_predictions(p_id) then
    raise exception using errcode = '22023', message = 'Match cannot be deleted after predictions';
  end if;
  delete from app.result_revisions where match_id = p_id;
  delete from app.match_results where match_id = p_id;
  delete from app.matches where id = p_id;
  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('match', p_id, 'deleted', auth.uid());
end
$function$;

create or replace function api.set_match_result(
  p_match_id uuid,
  p_expected_match_version integer,
  p_expected_revision integer,
  p_decision app.result_decision,
  p_home_goals smallint default null,
  p_away_goals smallint default null,
  p_reason text default null
) returns table(revision_no integer, match_version integer, recalculated_count integer)
language plpgsql security definer set search_path = '' as $function$
declare
  current_result app.match_results%rowtype;
  target_match app.matches%rowtype;
  next_revision integer;
  next_match_version integer;
  affected integer;
begin
  perform private.require_app_admin();
  select * into target_match from app.matches where id = p_match_id for update;
  if not found or target_match.version <> p_expected_match_version then
    raise exception using errcode = 'P0001', message = 'Version conflict';
  end if;
  if clock_timestamp() < target_match.kickoff_at + interval '90 minutes' then
    raise exception using errcode = '22023', message = 'Results are locked until 90 minutes after kickoff';
  end if;
  select * into current_result from app.match_results where match_id = p_match_id for update;
  if coalesce(current_result.revision_no, 0) <> p_expected_revision then
    raise exception using errcode = 'P0001', message = 'Revision conflict';
  end if;
  if (p_decision = 'official' and (p_home_goals is null or p_away_goals is null))
     or (p_decision = 'excluded' and (p_home_goals is not null or p_away_goals is not null)) then
    raise exception using errcode = '23514', message = 'Invalid result shape';
  end if;
  next_revision := p_expected_revision + 1;
  insert into app.result_revisions(
    match_id, revision_no, old_decision, old_home_goals, old_away_goals,
    new_decision, new_home_goals, new_away_goals, changed_by, reason
  ) values (
    p_match_id, next_revision, current_result.decision, current_result.home_goals, current_result.away_goals,
    p_decision, p_home_goals, p_away_goals, auth.uid(), nullif(btrim(p_reason), '')
  );
  insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
  values (p_match_id, p_decision, p_home_goals, p_away_goals, next_revision, auth.uid())
  on conflict (match_id) do update set decision = excluded.decision, home_goals = excluded.home_goals,
    away_goals = excluded.away_goals, revision_no = excluded.revision_no, updated_by = excluded.updated_by,
    updated_at = clock_timestamp();
  update app.matches set status = 'completed', version = version + 1
  where id = p_match_id returning version into next_match_version;
  affected := private.recalculate_match_scores(p_match_id);
  return query select next_revision, next_match_version, affected;
end
$function$;

create function api.set_match_results_batch(p_results jsonb)
returns table(match_id uuid, revision_no integer, match_version integer, recalculated_count integer)
language plpgsql security definer set search_path = '' as $function$
declare
  item jsonb;
  result_row record;
  current_match_id uuid;
begin
  perform private.require_app_admin();
  if jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) = 0 then
    raise exception using errcode = '22023', message = 'At least one result is required';
  end if;
  for item in select value from jsonb_array_elements(p_results)
  loop
    current_match_id := (item ->> 'matchId')::uuid;
    select * into result_row from api.set_match_result(
      current_match_id,
      (item ->> 'expectedMatchVersion')::integer,
      (item ->> 'expectedRevision')::integer,
      (item ->> 'decision')::app.result_decision,
      nullif(item ->> 'homeGoals', '')::smallint,
      nullif(item ->> 'awayGoals', '')::smallint,
      nullif(item ->> 'reason', '')
    );
    match_id := current_match_id;
    revision_no := result_row.revision_no;
    match_version := result_row.match_version;
    recalculated_count := result_row.recalculated_count;
    return next;
  end loop;
end
$function$;

revoke all on function api.create_admin_league(text,text,uuid[]),
  api.update_admin_league(uuid,integer,text,text,uuid[],text),
  api.publish_admin_league(uuid,integer),
  api.create_club_simple(text,text),
  api.update_club_simple(uuid,integer,text,text),
  api.create_matchday_auto(uuid,app.matchday_phase),
  api.move_matchday_phase(uuid,integer,app.matchday_phase),
  api.delete_matchday_simple(uuid,integer),
  api.create_match_simple(uuid,uuid,uuid,timestamptz),
  api.update_match_simple(uuid,integer,uuid,uuid,timestamptz,app.match_status),
  api.delete_match_simple(uuid,integer),
  api.set_match_results_batch(jsonb)
from public, anon;

grant execute on function api.create_admin_league(text,text,uuid[]),
  api.update_admin_league(uuid,integer,text,text,uuid[],text),
  api.publish_admin_league(uuid,integer),
  api.create_club_simple(text,text),
  api.update_club_simple(uuid,integer,text,text),
  api.create_matchday_auto(uuid,app.matchday_phase),
  api.move_matchday_phase(uuid,integer,app.matchday_phase),
  api.delete_matchday_simple(uuid,integer),
  api.create_match_simple(uuid,uuid,uuid,timestamptz),
  api.update_match_simple(uuid,integer,uuid,uuid,timestamptz,app.match_status),
  api.delete_match_simple(uuid,integer),
  api.set_match_results_batch(jsonb)
to authenticated, service_role;

-- Retire the old multi-step mutation surface. Keeping these functions for
-- service-role fixtures avoids rewriting historical migrations, while clients
-- can only use the simplified atomic RPCs above.
revoke execute on function api.create_league(text,text),
  api.create_season(text,date,date),
  api.create_league_season(uuid,uuid),
  api.update_league(uuid,integer,text,text,app.catalog_status),
  api.update_season(uuid,integer,text,date,date,app.catalog_status),
  api.transition_league_season(uuid,integer,app.league_season_status),
  api.create_club(text,text),
  api.update_club(uuid,integer,text,text,app.club_status),
  api.assign_club(uuid,uuid,app.league_season_club_status),
  api.set_club_logo_path(uuid,integer,text),
  api.create_matchday(uuid,smallint,text),
  api.update_matchday(uuid,integer,smallint,text,app.matchday_status),
  api.create_match(uuid,uuid,uuid,timestamptz),
  api.update_match(uuid,integer,uuid,uuid,uuid,timestamptz,app.match_status)
from authenticated;
