create function api.archive_round(p_round_id uuid,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $function$
declare new_version integer;
begin
  perform private.require_round_user();if not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner required';end if;
  update app.prediction_rounds set status='archived',version=version+1 where id=p_round_id and version=p_expected_version and status='active' returning version into new_version;
  if new_version is null then raise exception using errcode='P0001',message='Version conflict';end if;return new_version;
end $function$;
create function api.reactivate_round(p_round_id uuid,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $function$
declare new_version integer;
begin
  perform private.require_round_user();if not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner required';end if;
  update app.prediction_rounds set status='active',version=version+1 where id=p_round_id and version=p_expected_version and status='archived' returning version into new_version;
  if new_version is null then raise exception using errcode='P0001',message='Version conflict';end if;return new_version;
end $function$;
revoke all on function api.archive_round(uuid,integer),api.reactivate_round(uuid,integer) from public,anon;
grant execute on function api.archive_round(uuid,integer),api.reactivate_round(uuid,integer) to authenticated,service_role;
