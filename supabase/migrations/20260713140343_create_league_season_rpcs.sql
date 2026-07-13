create function private.require_app_admin() returns void language plpgsql stable security definer set search_path = '' as $function$
begin
  if not private.is_app_admin() then raise exception using errcode = '42501', message = 'App admin required'; end if;
end $function$;
revoke all on function private.require_app_admin() from public, anon, authenticated;

create function api.create_league(p_name text, p_short_name text default null) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.leagues(name, short_name) values (btrim(p_name), nullif(btrim(p_short_name), '')) returning id into new_id;
  return new_id;
end $function$;

create function api.create_season(p_label text, p_starts_on date, p_ends_on date) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.seasons(label, starts_on, ends_on) values (btrim(p_label), p_starts_on, p_ends_on) returning id into new_id;
  return new_id;
end $function$;

create function api.create_league_season(p_league_id uuid, p_season_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare new_id uuid;
begin
  perform private.require_app_admin();
  insert into app.league_seasons(league_id, season_id) values (p_league_id, p_season_id) returning id into new_id;
  return new_id;
end $function$;

create function api.update_league(p_id uuid, p_expected_version integer, p_name text, p_short_name text, p_status app.catalog_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.leagues set name = btrim(p_name), short_name = nullif(btrim(p_short_name), ''), status = p_status, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

create function api.update_season(p_id uuid, p_expected_version integer, p_label text, p_starts_on date, p_ends_on date, p_status app.catalog_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare new_version integer;
begin
  perform private.require_app_admin();
  update app.seasons set label = btrim(p_label), starts_on = p_starts_on, ends_on = p_ends_on, status = p_status, version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

create function api.transition_league_season(p_id uuid, p_expected_version integer, p_status app.league_season_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare current_status app.league_season_status; new_version integer;
begin
  perform private.require_app_admin();
  select status into current_status from app.league_seasons where id = p_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'League season unavailable'; end if;
  if not ((current_status = 'draft' and p_status = 'published') or (current_status = 'published' and p_status = 'completed') or (current_status = 'completed' and p_status = 'archived')) then
    raise exception using errcode = '23514', message = 'Invalid league season transition';
  end if;
  update app.league_seasons set status = p_status,
    published_at = case when p_status = 'published' then clock_timestamp() else published_at end,
    completed_at = case when p_status = 'completed' then clock_timestamp() else completed_at end,
    archived_at = case when p_status = 'archived' then clock_timestamp() else archived_at end,
    version = version + 1
  where id = p_id and version = p_expected_version returning version into new_version;
  if new_version is null then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  return new_version;
end $function$;

revoke all on function api.create_league(text,text), api.create_season(text,date,date), api.create_league_season(uuid,uuid), api.update_league(uuid,integer,text,text,app.catalog_status), api.update_season(uuid,integer,text,date,date,app.catalog_status), api.transition_league_season(uuid,integer,app.league_season_status) from public, anon;
grant execute on function api.create_league(text,text), api.create_season(text,date,date), api.create_league_season(uuid,uuid), api.update_league(uuid,integer,text,text,app.catalog_status), api.update_season(uuid,integer,text,date,date,app.catalog_status), api.transition_league_season(uuid,integer,app.league_season_status) to authenticated, service_role;
