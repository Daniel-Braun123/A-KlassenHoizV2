alter table app.profiles add column deletion_pending_at timestamptz;

create function api.prepare_account_deletion() returns uuid
language plpgsql security definer set search_path='' as $function$
declare actor uuid; membership record;
begin
  actor:=private.require_round_user();
  if exists(select 1 from app.round_memberships where user_id=actor and role='owner' and status='active') then raise exception using errcode='P0001',message='Transfer or delete owned rounds first';end if;
  for membership in select id from app.round_memberships where user_id=actor order by round_id,id for update loop
    update app.round_memberships set user_id=null,status='anonymized',ended_at=coalesce(ended_at,clock_timestamp()),anonymization_key=gen_random_uuid(),nickname='Gelöschtes Mitglied' where id=membership.id;
  end loop;
  update app.profiles set deletion_pending_at=coalesce(deletion_pending_at,clock_timestamp()),last_active_round_id=null where user_id=actor;
  return actor;
end $function$;
revoke all on function api.prepare_account_deletion() from public,anon;
grant execute on function api.prepare_account_deletion() to authenticated,service_role;
