create function api.create_club(p_name text, p_short_name text) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.clubs(name, short_name) values (btrim(p_name), btrim(p_short_name)) returning id into new_id;
  return new_id;
end $function$;

create function api.update_club(p_id uuid, p_expected_version integer, p_name text, p_short_name text, p_status app.club_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.clubs set name = btrim(p_name), short_name = btrim(p_short_name), status = p_status, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

create function api.assign_club(p_league_season_id uuid, p_club_id uuid, p_status app.league_season_club_status default 'active') returns void
language plpgsql security definer set search_path = '' as $function$
begin
  perform private.require_app_admin();
  insert into app.league_season_clubs(league_season_id, club_id, status)
  values (p_league_season_id, p_club_id, p_status)
  on conflict (league_season_id, club_id) do update set status = excluded.status;
end $function$;

create function api.set_club_logo_path(p_id uuid, p_expected_version integer, p_logo_path text) returns integer
language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.clubs set logo_path = p_logo_path, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

revoke all on function api.create_club(text,text), api.update_club(uuid,integer,text,text,app.club_status), api.assign_club(uuid,uuid,app.league_season_club_status), api.set_club_logo_path(uuid,integer,text) from public, anon;
grant execute on function api.create_club(text,text), api.update_club(uuid,integer,text,text,app.club_status), api.assign_club(uuid,uuid,app.league_season_club_status), api.set_club_logo_path(uuid,integer,text) to authenticated, service_role;
