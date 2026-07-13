create function api.hard_delete_round(p_round_id uuid,p_expected_version integer,p_confirmation_name text) returns void
language plpgsql security definer set search_path='' as $function$
declare actor uuid; stored_name text;
begin
  actor:=private.require_round_user();
  select name into stored_name from app.prediction_rounds where id=p_round_id and version=p_expected_version for update;
  if stored_name is null or not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner and current version required';end if;
  if p_confirmation_name<>stored_name then raise exception using errcode='22023',message='Exact round name confirmation required';end if;
  insert into private.destructive_audit_events(action,actor_id,object_id)values('round_hard_deleted',actor,p_round_id);
  delete from app.prediction_rounds where id=p_round_id;
end $function$;
revoke all on function api.hard_delete_round(uuid,integer,text) from public,anon;
grant execute on function api.hard_delete_round(uuid,integer,text) to authenticated,service_role;
