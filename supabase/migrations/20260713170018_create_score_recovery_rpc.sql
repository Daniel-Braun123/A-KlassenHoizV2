create function api.rebuild_all_scores() returns integer
language plpgsql security definer set search_path='' as $function$
begin
  perform private.require_app_admin();
  return private.rebuild_all_scores();
end $function$;

revoke all on function api.rebuild_all_scores() from public,anon;
grant execute on function api.rebuild_all_scores() to authenticated,service_role;
