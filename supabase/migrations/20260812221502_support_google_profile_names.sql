create or replace function private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_display_name text := coalesce(
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), ''),
    ''
  );
begin
  if requested_display_name <> '' then
    requested_display_name := pg_catalog.left(requested_display_name, 80);
  else
    requested_display_name := 'Freund ' || pg_catalog.left(new.id::text, 8);
  end if;

  insert into app.profiles (user_id, display_name)
  values (new.id, requested_display_name)
  on conflict (user_id) do nothing;

  return new;
end
$function$;

comment on function private.create_profile_for_auth_user() is
  'Creates a profile from an explicit display name or a verified OAuth provider name.';

revoke all on function private.create_profile_for_auth_user() from public, anon, authenticated;
