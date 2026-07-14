create function api.join_round(p_token_hash bytea,p_nickname text,p_idempotency_key uuid) returns uuid
language plpgsql security definer set search_path='' as $function$
declare actor uuid; target_round uuid; membership_id uuid:=gen_random_uuid(); claimed uuid; existing_id uuid;
begin
  actor:=private.require_round_user();
  select i.round_id into target_round from private.invitations i join app.prediction_rounds r on r.id=i.round_id
  where i.token_hash=p_token_hash and i.revoked_at is null and i.expires_at>clock_timestamp() and r.status='active' for update of i;
  if target_round is null then raise exception using errcode='P0002',message='Invitation unavailable'; end if;
  select id into existing_id from app.round_memberships where round_id=target_round and user_id=actor and status='active';
  if existing_id is not null then update app.profiles set last_active_round_id=target_round where user_id=actor; return existing_id; end if;
  insert into private.mutation_idempotency(user_id,scope,idempotency_key,result_id) values(actor,'join_round',p_idempotency_key,membership_id)
  on conflict do nothing returning result_id into claimed;
  if claimed is null then select result_id into claimed from private.mutation_idempotency where user_id=actor and scope='join_round' and idempotency_key=p_idempotency_key; return claimed; end if;
  insert into app.round_memberships(id,round_id,user_id,role,nickname) values(membership_id,target_round,actor,'member',btrim(p_nickname));
  update app.profiles set last_active_round_id=target_round where user_id=actor;
  return membership_id;
end $function$;

revoke all on function api.join_round(bytea,text,uuid) from public,anon;
grant execute on function api.join_round(bytea,text,uuid) to authenticated,service_role;
