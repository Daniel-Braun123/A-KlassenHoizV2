create function api.create_support_access(p_round_id uuid,p_case_reference text,p_reason text,p_duration_minutes smallint default 15)
returns table(grant_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor uuid:=auth.uid();new_id uuid:=gen_random_uuid();deadline timestamptz;
begin
  perform private.require_app_admin();
  if p_duration_minutes not between 1 and 15 then raise exception using errcode='22023',message='Duration must be 1 to 15 minutes';end if;
  if not exists(select 1 from app.prediction_rounds where id=p_round_id) then raise exception using errcode='P0002',message='Support object unavailable';end if;
  deadline:=clock_timestamp()+make_interval(mins=>p_duration_minutes);
  insert into private.support_access_grants(id,round_id,granted_to,case_reference,reason,expires_at)values(new_id,p_round_id,actor,btrim(p_case_reference),btrim(p_reason),deadline);
  insert into app.admin_access_events(actor_id,action,grant_id,object_id)values(actor,'support_grant_created',new_id,p_round_id);
  return query select new_id,deadline;
end $function$;

create function api.revoke_support_access(p_grant_id uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare actor uuid:=auth.uid();target_round uuid;
begin
  perform private.require_app_admin();
  update private.support_access_grants set revoked_at=clock_timestamp() where id=p_grant_id and granted_to=actor and revoked_at is null returning round_id into target_round;
  if target_round is null then raise exception using errcode='P0002',message='Active grant unavailable';end if;
  insert into app.admin_access_events(actor_id,action,grant_id,object_id)values(actor,'support_grant_revoked',p_grant_id,target_round);
end $function$;

revoke all on function api.create_support_access(uuid,text,text,smallint),api.revoke_support_access(uuid) from public,anon;
grant execute on function api.create_support_access(uuid,text,text,smallint),api.revoke_support_access(uuid) to authenticated,service_role;
