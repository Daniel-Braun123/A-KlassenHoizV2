create function api.create_matchday(p_league_season_id uuid, p_number smallint, p_display_name text default null) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.matchdays(league_season_id, number, display_name)
  values (p_league_season_id, p_number, nullif(btrim(p_display_name), '')) returning id into new_id;
  return new_id;
end $function$;

create function api.update_matchday(p_id uuid, p_expected_version integer, p_number smallint, p_display_name text, p_status app.matchday_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.matchdays set number = p_number, display_name = nullif(btrim(p_display_name), ''), status = p_status, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

create function api.create_match(p_matchday_id uuid, p_home_club_id uuid, p_away_club_id uuid, p_kickoff_at timestamptz) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.matches(matchday_id, home_club_id, away_club_id, kickoff_at)
  values (p_matchday_id, p_home_club_id, p_away_club_id, p_kickoff_at) returning id into new_id;
  return new_id;
end $function$;

create function api.update_match(p_id uuid, p_expected_version integer, p_matchday_id uuid, p_home_club_id uuid, p_away_club_id uuid, p_kickoff_at timestamptz, p_status app.match_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.matches set matchday_id = p_matchday_id, home_club_id = p_home_club_id, away_club_id = p_away_club_id,
    kickoff_at = p_kickoff_at, status = p_status, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

revoke all on function api.create_matchday(uuid,smallint,text), api.update_matchday(uuid,integer,smallint,text,app.matchday_status), api.create_match(uuid,uuid,uuid,timestamptz), api.update_match(uuid,integer,uuid,uuid,uuid,timestamptz,app.match_status) from public, anon;
grant execute on function api.create_matchday(uuid,smallint,text), api.update_matchday(uuid,integer,smallint,text,app.matchday_status), api.create_match(uuid,uuid,uuid,timestamptz), api.update_match(uuid,integer,uuid,uuid,uuid,timestamptz,app.match_status) to authenticated, service_role;
