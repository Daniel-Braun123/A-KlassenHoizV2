alter table app.league_seasons
  add column external_source text,
  add column external_competition_id text,
  add column external_season_label text,
  add column external_document_date date,
  add column external_synced_at timestamptz;

alter table app.league_seasons
  add constraint league_seasons_external_source_valid check (
    (external_source is null and external_competition_id is null and external_season_label is null)
    or (
      external_source = 'bfv'
      and external_competition_id ~ '^[0-9]+$'
      and external_season_label ~ '^[0-9]{2}/[0-9]{2}$'
    )
  );

create unique index league_seasons_external_competition_unique
  on app.league_seasons (external_source, external_competition_id, external_season_label)
  where external_source is not null;

alter table app.matchdays
  add column external_source text,
  add column external_matchday_id text;

alter table app.matchdays
  add constraint matchdays_external_source_valid check (
    (external_source is null and external_matchday_id is null)
    or (
      external_source = 'bfv'
      and external_matchday_id = btrim(external_matchday_id)
      and char_length(external_matchday_id) between 8 and 100
    )
  );

create unique index matchdays_external_id_unique
  on app.matchdays (external_source, external_matchday_id)
  where external_source is not null;

alter table app.matches
  add column external_source text,
  add column external_match_id text,
  add column source_marked_changed boolean not null default false;

alter table app.matches
  add constraint matches_external_source_valid check (
    (external_source is null and external_match_id is null)
    or (
      external_source = 'bfv'
      and external_match_id = btrim(external_match_id)
      and char_length(external_match_id) between 8 and 100
    )
  );

create unique index matches_external_id_unique
  on app.matches (external_source, external_match_id)
  where external_source is not null;

create or replace function private.queue_published_matchday_from_matchday()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if coalesce(current_setting('app.suppress_matchday_push', true), '') <> 'on'
    and new.status = 'published'
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

create or replace function private.queue_published_matchday_from_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if coalesce(current_setting('app.suppress_matchday_push', true), '') <> 'on'
    and new.status in ('published', 'postponed')
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

create function api.import_bfv_schedule(
  p_league_id uuid,
  p_league_number text,
  p_season_label text,
  p_document_date date,
  p_matchdays jsonb,
  p_matches jsonb
) returns table (
  created_matchdays integer,
  updated_matchdays integer,
  created_matches integer,
  updated_matches integer,
  unchanged_matches integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  league app.league_seasons%rowtype;
  matchday_item jsonb;
  match_item jsonb;
  target_matchday app.matchdays%rowtype;
  target_match app.matches%rowtype;
  v_source_matchday_id text;
  v_source_match_id text;
  v_source_number smallint;
  v_source_phase app.matchday_phase;
  v_phase_number smallint;
  v_starts_on date;
  v_ends_on date;
  v_home_club_id uuid;
  v_away_club_id uuid;
  v_kickoff_at timestamptz;
  v_requested_match_id uuid;
  v_expected_version integer;
  v_visible_match_changed boolean;
  v_source_marked_changed boolean;
  original_periods jsonb := '{}'::jsonb;
  final_starts_on date;
  final_ends_on date;
  original_starts_on date;
  original_ends_on date;
begin
  perform private.require_app_admin();
  perform set_config('app.suppress_matchday_push', 'on', true);

  created_matchdays := 0;
  updated_matchdays := 0;
  created_matches := 0;
  updated_matches := 0;
  unchanged_matches := 0;

  if coalesce(p_league_number, '') !~ '^[0-9]+$'
    or coalesce(p_season_label, '') !~ '^[0-9]{2}/[0-9]{2}$' then
    raise exception using errcode = '22023', message = 'Invalid BFV competition metadata';
  end if;
  if jsonb_typeof(p_matchdays) <> 'array'
    or jsonb_array_length(p_matchdays) not between 1 and 80
    or jsonb_typeof(p_matches) <> 'array'
    or jsonb_array_length(p_matches) not between 1 and 800 then
    raise exception using errcode = '22023', message = 'Invalid BFV schedule size';
  end if;
  if (
    select count(*) <> count(distinct item ->> 'externalId')
    from jsonb_array_elements(p_matchdays) item
  ) or (
    select count(*) <> count(distinct item ->> 'externalId')
    from jsonb_array_elements(p_matches) item
  ) then
    raise exception using errcode = '22023', message = 'Duplicate BFV identifiers';
  end if;

  select * into league
  from app.league_seasons
  where id = p_league_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'League unavailable';
  end if;
  if league.external_source is not null and (
    league.external_source <> 'bfv'
    or league.external_competition_id <> p_league_number
    or league.external_season_label <> p_season_label
  ) then
    raise exception using errcode = '22023', message = 'League is linked to another external schedule';
  end if;

  update app.league_seasons
  set external_source = 'bfv',
      external_competition_id = p_league_number,
      external_season_label = p_season_label,
      external_document_date = p_document_date,
      external_synced_at = clock_timestamp()
  where id = p_league_id;

  for matchday_item in select value from jsonb_array_elements(p_matchdays)
  loop
    v_source_matchday_id := nullif(btrim(matchday_item ->> 'externalId'), '');
    v_source_number := nullif(matchday_item ->> 'sourceNumber', '')::smallint;
    v_source_phase := nullif(matchday_item ->> 'phase', '')::app.matchday_phase;
    v_phase_number := nullif(matchday_item ->> 'phaseNumber', '')::smallint;
    v_starts_on := nullif(matchday_item ->> 'startsOn', '')::date;
    v_ends_on := nullif(matchday_item ->> 'endsOn', '')::date;
    if v_source_matchday_id is null
      or v_source_number is null or v_source_number < 1
      or v_phase_number is null or v_phase_number < 1
      or v_starts_on is null or v_ends_on is null or v_starts_on > v_ends_on then
      raise exception using errcode = '22023', message = 'Invalid BFV matchday';
    end if;

    select md.* into target_matchday
    from app.matchdays md
    where md.league_season_id = p_league_id
      and (
        (md.external_source = 'bfv' and md.external_matchday_id = v_source_matchday_id)
        or (md.phase = v_source_phase and md.number = v_phase_number)
      )
    order by (md.external_source = 'bfv' and md.external_matchday_id = v_source_matchday_id) desc
    limit 1
    for update;

    if not found then
      insert into app.matchdays(
        league_season_id,
        phase,
        number,
        display_name,
        status,
        starts_on,
        ends_on,
        external_source,
        external_matchday_id
      ) values (
        p_league_id,
        v_source_phase,
        v_phase_number,
        (case when v_source_phase = 'first_leg' then 'Hinrunde · Spieltag ' else 'Rückrunde · Spieltag ' end) || v_phase_number,
        case when league.status = 'published' then 'published'::app.matchday_status else 'draft'::app.matchday_status end,
        v_starts_on,
        v_ends_on,
        'bfv',
        v_source_matchday_id
      ) returning * into target_matchday;
      created_matchdays := created_matchdays + 1;
      insert into private.competition_change_audit(object_type, object_id, action, changed_by)
      values ('matchday', target_matchday.id, 'bfv_import_created', auth.uid());
    else
      if target_matchday.external_source is not null and (
        target_matchday.external_source <> 'bfv'
        or target_matchday.external_matchday_id <> v_source_matchday_id
      ) then
        raise exception using errcode = '22023', message = 'Matchday is linked to another external schedule';
      end if;
      original_periods := original_periods || jsonb_build_object(
        v_source_matchday_id,
        jsonb_build_object('startsOn', target_matchday.starts_on, 'endsOn', target_matchday.ends_on)
      );
      update app.matchdays
      set external_source = 'bfv',
          external_matchday_id = v_source_matchday_id,
          starts_on = least(target_matchday.starts_on, v_starts_on),
          ends_on = greatest(target_matchday.ends_on, v_ends_on)
      where id = target_matchday.id;
    end if;
  end loop;

  for match_item in select value from jsonb_array_elements(p_matches)
  loop
    v_source_match_id := nullif(btrim(match_item ->> 'externalId'), '');
    v_source_matchday_id := nullif(btrim(match_item ->> 'externalMatchdayId'), '');
    v_home_club_id := nullif(match_item ->> 'homeClubId', '')::uuid;
    v_away_club_id := nullif(match_item ->> 'awayClubId', '')::uuid;
    v_kickoff_at := nullif(match_item ->> 'kickoffAt', '')::timestamptz;
    v_requested_match_id := nullif(match_item ->> 'existingMatchId', '')::uuid;
    v_expected_version := nullif(match_item ->> 'expectedVersion', '')::integer;
    v_source_marked_changed := coalesce((match_item ->> 'sourceMarkedChanged')::boolean, false);
    if v_source_match_id is null or v_source_matchday_id is null
      or v_home_club_id is null or v_away_club_id is null or v_home_club_id = v_away_club_id
      or v_kickoff_at is null then
      raise exception using errcode = '22023', message = 'Invalid BFV match';
    end if;

    select md.* into target_matchday
    from app.matchdays md
    where md.league_season_id = p_league_id
      and md.external_source = 'bfv'
      and md.external_matchday_id = v_source_matchday_id
    for update;
    if not found then
      raise exception using errcode = '22023', message = 'BFV matchday mapping unavailable';
    end if;

    target_match := null;
    if v_requested_match_id is not null then
      select m.* into target_match
      from app.matches m
      join app.matchdays md on md.id = m.matchday_id
      where m.id = v_requested_match_id
        and md.league_season_id = p_league_id
      for update of m;
    end if;
    if target_match.id is null then
      select m.* into target_match
      from app.matches m
      join app.matchdays md on md.id = m.matchday_id
      where md.league_season_id = p_league_id
        and m.external_source = 'bfv'
        and m.external_match_id = v_source_match_id
      for update of m;
    end if;
    if target_match.id is null then
      select m.* into target_match
      from app.matches m
      where m.matchday_id = target_matchday.id
        and m.home_club_id = v_home_club_id
        and m.away_club_id = v_away_club_id
      order by (m.kickoff_at = v_kickoff_at) desc, m.created_at
      limit 1
      for update;
    end if;

    if target_match.id is null then
      insert into app.matches(
        matchday_id,
        home_club_id,
        away_club_id,
        kickoff_at,
        status,
        external_source,
        external_match_id,
        source_marked_changed
      ) values (
        target_matchday.id,
        v_home_club_id,
        v_away_club_id,
        v_kickoff_at,
        case when target_matchday.status = 'published' then 'published'::app.match_status else 'draft'::app.match_status end,
        'bfv',
        v_source_match_id,
        v_source_marked_changed
      ) returning * into target_match;
      created_matches := created_matches + 1;
      insert into private.competition_change_audit(object_type, object_id, action, changed_by)
      values ('match', target_match.id, 'bfv_import_created', auth.uid());
      continue;
    end if;

    if target_match.external_source is not null and (
      target_match.external_source <> 'bfv'
      or target_match.external_match_id <> v_source_match_id
    ) then
      raise exception using errcode = '22023', message = 'Match is linked to another external schedule';
    end if;
    if v_expected_version is not null and target_match.version <> v_expected_version then
      raise exception using errcode = 'P0001', message = 'Version conflict';
    end if;

    v_visible_match_changed := target_match.matchday_id <> target_matchday.id
      or target_match.home_club_id <> v_home_club_id
      or target_match.away_club_id <> v_away_club_id
      or target_match.kickoff_at <> v_kickoff_at;
    if v_visible_match_changed and (
      private.match_has_predictions(target_match.id)
      or exists (select 1 from app.match_results result where result.match_id = target_match.id)
    ) then
      raise exception using errcode = '22023', message = 'BFV change is blocked by existing predictions or results';
    end if;

    update app.matches
    set matchday_id = target_matchday.id,
        home_club_id = v_home_club_id,
        away_club_id = v_away_club_id,
        kickoff_at = v_kickoff_at,
        external_source = 'bfv',
        external_match_id = v_source_match_id,
        source_marked_changed = v_source_marked_changed,
        version = version + case when v_visible_match_changed then 1 else 0 end
    where id = target_match.id;

    if v_visible_match_changed then
      updated_matches := updated_matches + 1;
      insert into private.competition_change_audit(object_type, object_id, action, changed_by)
      values ('match', target_match.id, 'bfv_import_updated', auth.uid());
    else
      unchanged_matches := unchanged_matches + 1;
    end if;
  end loop;

  for matchday_item in select value from jsonb_array_elements(p_matchdays)
  loop
    v_source_matchday_id := nullif(btrim(matchday_item ->> 'externalId'), '');
    v_starts_on := nullif(matchday_item ->> 'startsOn', '')::date;
    v_ends_on := nullif(matchday_item ->> 'endsOn', '')::date;
    select md.* into target_matchday
    from app.matchdays md
    where md.league_season_id = p_league_id
      and md.external_source = 'bfv'
      and md.external_matchday_id = v_source_matchday_id
    for update;

    select
      coalesce(min((m.kickoff_at at time zone 'Europe/Berlin')::date), v_starts_on),
      coalesce(max((m.kickoff_at at time zone 'Europe/Berlin')::date), v_ends_on)
    into final_starts_on, final_ends_on
    from app.matches m
    where m.matchday_id = target_matchday.id;

    if original_periods ? v_source_matchday_id then
      original_starts_on := (original_periods -> v_source_matchday_id ->> 'startsOn')::date;
      original_ends_on := (original_periods -> v_source_matchday_id ->> 'endsOn')::date;
      if original_starts_on is distinct from final_starts_on
        or original_ends_on is distinct from final_ends_on then
        updated_matchdays := updated_matchdays + 1;
        update app.matchdays
        set starts_on = final_starts_on,
            ends_on = final_ends_on,
            version = version + 1
        where id = target_matchday.id;
        insert into private.competition_change_audit(object_type, object_id, action, changed_by)
        values ('matchday', target_matchday.id, 'bfv_import_period_updated', auth.uid());
      else
        update app.matchdays
        set starts_on = final_starts_on,
            ends_on = final_ends_on
        where id = target_matchday.id
          and (starts_on is distinct from final_starts_on or ends_on is distinct from final_ends_on);
      end if;
    else
      update app.matchdays
      set starts_on = final_starts_on,
          ends_on = final_ends_on
      where id = target_matchday.id
        and (starts_on is distinct from final_starts_on or ends_on is distinct from final_ends_on);
    end if;
  end loop;

  return next;
end
$function$;

revoke all on function api.import_bfv_schedule(uuid, text, text, date, jsonb, jsonb)
from public, anon;
grant execute on function api.import_bfv_schedule(uuid, text, text, date, jsonb, jsonb)
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
  md.ends_on,
  m.external_source,
  m.external_match_id,
  m.source_marked_changed
from app.matchdays md
join app.league_seasons ls on ls.id = md.league_season_id
join app.leagues l on l.id = ls.league_id
join app.seasons s on s.id = ls.season_id
left join app.matches m on m.matchday_id = md.id
left join app.clubs hc on hc.id = m.home_club_id
left join app.clubs ac on ac.id = m.away_club_id
left join app.match_results r on r.match_id = m.id;

revoke all on api.admin_schedule from public, anon;
grant select on api.admin_schedule to authenticated, service_role;
