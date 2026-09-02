create function api.create_club_with_media(
  p_id uuid,
  p_name text,
  p_logo_url text default null,
  p_logo_path text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  normalized_logo_url text := nullif(btrim(p_logo_url), '');
  normalized_logo_path text := nullif(btrim(p_logo_path), '');
begin
  perform private.require_app_admin();

  if num_nonnulls(normalized_logo_url, normalized_logo_path) > 1 then
    raise exception using errcode = '22023', message = 'Choose either a logo URL or a stored logo';
  end if;

  insert into app.clubs(id, name, short_name, logo_url, logo_path)
  values (p_id, btrim(p_name), null, normalized_logo_url, normalized_logo_path);

  return p_id;
end
$function$;

create function api.update_club_with_media(
  p_id uuid,
  p_expected_version integer,
  p_name text,
  p_logo_url text default null,
  p_logo_path text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  normalized_logo_url text := nullif(btrim(p_logo_url), '');
  normalized_logo_path text := nullif(btrim(p_logo_path), '');
  new_version integer;
begin
  perform private.require_app_admin();

  if num_nonnulls(normalized_logo_url, normalized_logo_path) > 1 then
    raise exception using errcode = '22023', message = 'Choose either a logo URL or a stored logo';
  end if;

  update app.clubs
  set
    name = btrim(p_name),
    logo_url = normalized_logo_url,
    logo_path = normalized_logo_path,
    version = version + 1
  where id = p_id and version = p_expected_version
  returning version into new_version;

  if new_version is null then
    raise exception using errcode = 'P0001', message = 'Version conflict';
  end if;

  return new_version;
end
$function$;

revoke all on function api.create_club_with_media(uuid, text, text, text) from public, anon;
revoke all on function api.update_club_with_media(uuid, integer, text, text, text) from public, anon;

grant execute on function api.create_club_with_media(uuid, text, text, text)
to authenticated, service_role;
grant execute on function api.update_club_with_media(uuid, integer, text, text, text)
to authenticated, service_role;
