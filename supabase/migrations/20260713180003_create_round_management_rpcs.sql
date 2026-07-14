create function api.update_my_round_nickname(p_round_id uuid,p_nickname text) returns void
language plpgsql security definer set search_path='' as $function$
declare actor uuid;
begin
  actor:=private.require_round_user();
  update app.round_memberships set nickname=btrim(p_nickname)
  where round_id=p_round_id and user_id=actor and status='active';
  if not found then raise exception using errcode='42501',message='Active membership required';end if;
end $function$;

create function api.transfer_round_ownership(p_round_id uuid,p_target_membership_id uuid,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $function$
declare actor uuid; old_owner uuid; target_id uuid; new_version integer;
begin
  actor:=private.require_round_user();
  select owner_membership_id into old_owner from app.prediction_rounds where id=p_round_id and version=p_expected_version for update;
  if old_owner is null or not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner and current version required';end if;
  select id into target_id from app.round_memberships where id=p_target_membership_id and round_id=p_round_id and status='active' and role='member' for update;
  if target_id is null then raise exception using errcode='22023',message='Active target member required';end if;
  perform 1 from app.round_memberships where id=old_owner for update;
  update app.round_memberships set role='member' where id=old_owner;
  update app.round_memberships set role='owner' where id=target_id;
  update app.prediction_rounds set owner_membership_id=target_id,version=version+1 where id=p_round_id returning version into new_version;
  return new_version;
end $function$;

revoke all on function api.update_my_round_nickname(uuid,text),api.transfer_round_ownership(uuid,uuid,integer) from public,anon;
grant execute on function api.update_my_round_nickname(uuid,text),api.transfer_round_ownership(uuid,uuid,integer) to authenticated,service_role;
