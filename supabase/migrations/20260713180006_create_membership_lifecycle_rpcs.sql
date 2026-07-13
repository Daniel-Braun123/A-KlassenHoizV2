create function api.remove_round_member(p_round_id uuid,p_membership_id uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare target app.round_memberships%rowtype;
begin
  perform private.require_round_user();perform 1 from app.prediction_rounds where id=p_round_id for update;
  if not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner required';end if;
  select * into target from app.round_memberships where id=p_membership_id and round_id=p_round_id for update;
  if target.id is null or target.status<>'active' or target.role<>'member' then raise exception using errcode='22023',message='Active member required';end if;
  update app.round_memberships set status='removed',ended_at=clock_timestamp() where id=target.id;
end $function$;

create function api.leave_round(p_round_id uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare actor uuid; target app.round_memberships%rowtype;
begin
  actor:=private.require_round_user();perform 1 from app.prediction_rounds where id=p_round_id for update;
  select * into target from app.round_memberships where round_id=p_round_id and user_id=actor and status='active' for update;
  if target.id is null then raise exception using errcode='42501',message='Active membership required';end if;
  if target.role='owner' then raise exception using errcode='P0001',message='Owner must transfer ownership first';end if;
  update app.round_memberships set status='left',ended_at=clock_timestamp() where id=target.id;
end $function$;

revoke all on function api.remove_round_member(uuid,uuid),api.leave_round(uuid) from public,anon;
grant execute on function api.remove_round_member(uuid,uuid),api.leave_round(uuid) to authenticated,service_role;
