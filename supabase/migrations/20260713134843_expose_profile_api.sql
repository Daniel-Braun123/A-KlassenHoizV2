create view api.my_profile
with (security_invoker = true)
as
select
  profile.user_id,
  profile.display_name,
  profile.app_role,
  profile.status,
  profile.last_active_round_id,
  profile.created_at,
  profile.updated_at
from app.profiles as profile;

create function api.update_my_profile(new_display_name text)
returns api.my_profile
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
  normalized_display_name text := pg_catalog.btrim(new_display_name);
  updated_profile api.my_profile;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if pg_catalog.char_length(normalized_display_name) not between 1 and 80 then
    raise exception using errcode = '22023', message = 'invalid display name';
  end if;

  update app.profiles as profile
  set display_name = normalized_display_name
  where profile.user_id = caller_id
    and profile.status = 'active'
  returning
    profile.user_id,
    profile.display_name,
    profile.app_role,
    profile.status,
    profile.last_active_round_id,
    profile.created_at,
    profile.updated_at
  into updated_profile;

  if not found then
    raise exception using errcode = '42501', message = 'active profile required';
  end if;

  return updated_profile;
end
$function$;

revoke all on table api.my_profile from public, anon;
grant select on table api.my_profile to authenticated, service_role;
revoke all on function api.update_my_profile(text) from public, anon;
grant execute on function api.update_my_profile(text) to authenticated, service_role;
