create function api.rotate_round_invitation(p_round_id uuid,p_token_hash bytea)
returns table(invitation_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor_membership uuid; new_id uuid:=gen_random_uuid(); expiry timestamptz:=clock_timestamp()+interval '7 days';
begin
  perform private.require_round_user();
  if octet_length(p_token_hash)<>32 then raise exception using errcode='22023',message='SHA-256 token hash required'; end if;
  select id into actor_membership from app.round_memberships where round_id=p_round_id and user_id=auth.uid() and role='owner' and status='active';
  if actor_membership is null then raise exception using errcode='42501',message='Round owner required'; end if;
  update private.invitations set revoked_at=clock_timestamp() where round_id=p_round_id and revoked_at is null;
  insert into private.invitations(id,round_id,token_hash,created_by_membership_id,expires_at) values(new_id,p_round_id,p_token_hash,actor_membership,expiry);
  return query select new_id,expiry;
end $function$;

create function api.revoke_round_invitation(p_round_id uuid) returns void
language plpgsql security definer set search_path='' as $function$
begin
  perform private.require_round_user();
  if not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner required'; end if;
  update private.invitations set revoked_at=clock_timestamp() where round_id=p_round_id and revoked_at is null;
end $function$;

revoke all on function api.rotate_round_invitation(uuid,bytea),api.revoke_round_invitation(uuid) from public;
revoke all on function api.rotate_round_invitation(uuid,bytea),api.revoke_round_invitation(uuid) from anon;
grant execute on function api.rotate_round_invitation(uuid,bytea),api.revoke_round_invitation(uuid) to authenticated,service_role;
