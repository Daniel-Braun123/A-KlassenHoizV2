alter table app.matchdays
  add column starts_on date,
  add column ends_on date;

with derived_periods as (
  select
    md.id,
    coalesce(
      min((m.kickoff_at at time zone 'Europe/Berlin')::date),
      (md.created_at at time zone 'Europe/Berlin')::date
    ) as starts_on,
    coalesce(
      max((m.kickoff_at at time zone 'Europe/Berlin')::date),
      (md.created_at at time zone 'Europe/Berlin')::date
    ) as ends_on
  from app.matchdays md
  left join app.matches m on m.matchday_id = md.id
  group by md.id
)
update app.matchdays md
set starts_on = periods.starts_on,
    ends_on = periods.ends_on
from derived_periods periods
where periods.id = md.id;

alter table app.matchdays
  alter column starts_on set default ((clock_timestamp() at time zone 'Europe/Berlin')::date),
  alter column starts_on set not null,
  alter column ends_on set default ((clock_timestamp() at time zone 'Europe/Berlin')::date),
  alter column ends_on set not null,
  add constraint matchdays_valid_period check (starts_on <= ends_on);

create index matchdays_league_period_idx
  on app.matchdays (league_season_id, starts_on, ends_on);

create function private.validate_match_kickoff_in_matchday_period()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_starts_on date;
  target_ends_on date;
  kickoff_date date;
begin
  select starts_on, ends_on
  into target_starts_on, target_ends_on
  from app.matchdays
  where id = new.matchday_id;

  if target_starts_on is null or target_ends_on is null then
    raise exception using errcode = '23503', message = 'Matchday unavailable';
  end if;

  kickoff_date := (new.kickoff_at at time zone 'Europe/Berlin')::date;
  if kickoff_date < target_starts_on or kickoff_date > target_ends_on then
    raise exception using errcode = '23514', message = 'Kickoff must be inside the matchday period';
  end if;

  return new;
end
$function$;

create trigger matches_validate_matchday_period
before insert or update of matchday_id, kickoff_at on app.matches
for each row execute function private.validate_match_kickoff_in_matchday_period();

revoke all on function private.validate_match_kickoff_in_matchday_period()
from public, anon, authenticated;

drop function api.create_matchday_auto(uuid, app.matchday_phase);

create function api.create_matchday_auto(
  p_league_id uuid,
  p_phase app.matchday_phase,
  p_starts_on date,
  p_ends_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  next_number smallint;
  new_id uuid;
  league_status app.league_season_status;
begin
  perform private.require_app_admin();
  if p_starts_on is null or p_ends_on is null or p_starts_on > p_ends_on then
    raise exception using errcode = '23514', message = 'A valid matchday period is required';
  end if;

  select status into league_status
  from app.league_seasons
  where id = p_league_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'League unavailable';
  end if;

  select (coalesce(max(number), 0) + 1)::smallint into next_number
  from app.matchdays
  where league_season_id = p_league_id and phase = p_phase;

  insert into app.matchdays(
    league_season_id,
    phase,
    number,
    display_name,
    status,
    starts_on,
    ends_on
  )
  values (
    p_league_id,
    p_phase,
    next_number,
    case when p_phase = 'first_leg' then 'Hinrunde · Spieltag ' else 'Rückrunde · Spieltag ' end || next_number,
    case when league_status = 'published' then 'published'::app.matchday_status else 'draft'::app.matchday_status end,
    p_starts_on,
    p_ends_on
  )
  returning id into new_id;

  return new_id;
end
$function$;

create function api.update_matchday_period(
  p_id uuid,
  p_expected_version integer,
  p_starts_on date,
  p_ends_on date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_matchday app.matchdays%rowtype;
  new_version integer;
begin
  perform private.require_app_admin();
  if p_starts_on is null or p_ends_on is null or p_starts_on > p_ends_on then
    raise exception using errcode = '23514', message = 'A valid matchday period is required';
  end if;

  select * into current_matchday
  from app.matchdays
  where id = p_id
  for update;
  if not found or current_matchday.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'Version conflict';
  end if;

  if exists (
    select 1
    from app.matches m
    where m.matchday_id = p_id
      and (
        (m.kickoff_at at time zone 'Europe/Berlin')::date < p_starts_on
        or (m.kickoff_at at time zone 'Europe/Berlin')::date > p_ends_on
      )
  ) then
    raise exception using errcode = '23514', message = 'Matchday period must include every kickoff';
  end if;

  update app.matchdays
  set starts_on = p_starts_on,
      ends_on = p_ends_on,
      version = version + 1
  where id = p_id
  returning version into new_version;

  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('matchday', p_id, 'period_updated', auth.uid());

  return new_version;
end
$function$;

revoke all on function api.create_matchday_auto(uuid, app.matchday_phase, date, date),
  api.update_matchday_period(uuid, integer, date, date)
from public, anon;
grant execute on function api.create_matchday_auto(uuid, app.matchday_phase, date, date),
  api.update_matchday_period(uuid, integer, date, date)
to authenticated, service_role;

create or replace view api.admin_schedule with (security_invoker = true) as
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
  (m.id is not null and clock_timestamp() >= m.kickoff_at + interval '90 minutes') as can_enter_result,
  md.starts_on,
  md.ends_on
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
  (
    clock_timestamp() < mt.kickoff_at
    and mt.status in ('published', 'postponed')
    and md.status = 'published'
  ) as is_open,
  md.phase,
  hc.logo_url as home_logo_url,
  ac.logo_url as away_logo_url,
  mr.decision as result_decision,
  mr.home_goals as result_home_goals,
  mr.away_goals as result_away_goals,
  mr.revision_no as result_revision_no,
  coalesce(mr.revision_no, 0) > 1 as result_is_correction,
  ps.points as prediction_points,
  md.starts_on,
  md.ends_on
from app.prediction_rounds r
join app.round_memberships own_m
  on own_m.round_id = r.id
  and own_m.user_id = (select auth.uid())
  and own_m.status = 'active'
join app.matchdays md
  on md.league_season_id = r.league_season_id
  and md.status in ('published', 'completed')
join app.matches mt
  on mt.matchday_id = md.id
  and mt.status <> 'draft'
join app.clubs hc on hc.id = mt.home_club_id
join app.clubs ac on ac.id = mt.away_club_id
left join app.predictions p
  on p.round_id = r.id
  and p.membership_id = own_m.id
  and p.match_id = mt.id
left join app.match_results mr on mr.match_id = mt.id
left join app.prediction_scores ps
  on ps.prediction_id = p.id
  and ps.round_id = r.id
  and ps.membership_id = own_m.id
  and ps.match_id = mt.id;

create or replace view api.matchday_ranking with (security_invoker = true) as
with days as (
  select distinct
    m.round_id,
    md.id as matchday_id,
    md.number as matchday_number,
    md.display_name,
    md.starts_on,
    md.ends_on
  from app.round_memberships m
  join app.prediction_rounds r on r.id = m.round_id
  join app.round_memberships actor_m
    on actor_m.round_id = m.round_id
    and actor_m.user_id = (select auth.uid())
    and actor_m.status = 'active'
  join app.matchdays md on md.league_season_id = r.league_season_id
  where md.status in ('published', 'completed')
), totals as (
  select
    d.round_id,
    d.matchday_id,
    d.matchday_number,
    d.display_name,
    m.id as membership_id,
    m.user_id,
    m.nickname,
    m.status as membership_status,
    coalesce(sum(s.points), 0)::integer as points,
    count(s.prediction_id) filter (where s.points = 4)::integer as exact_scores,
    d.starts_on,
    d.ends_on
  from days d
  join app.round_memberships m on m.round_id = d.round_id
  left join app.prediction_scores s
    on s.membership_id = m.id and s.matchday_id = d.matchday_id
  group by
    d.round_id,
    d.matchday_id,
    d.matchday_number,
    d.display_name,
    m.id,
    d.starts_on,
    d.ends_on
)
select
  round_id,
  matchday_id,
  matchday_number,
  display_name,
  membership_id,
  nickname,
  membership_status,
  points,
  exact_scores,
  rank() over (partition by round_id, matchday_id order by points desc)::integer as rank,
  user_id = (select auth.uid()) as is_current_user,
  starts_on,
  ends_on
from totals;

revoke all on api.admin_schedule, api.matchday_prediction_sheet, api.matchday_ranking
from public, anon;
grant select on api.admin_schedule, api.matchday_prediction_sheet, api.matchday_ranking
to authenticated, service_role;
