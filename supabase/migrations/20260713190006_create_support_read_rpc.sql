create function api.get_support_metadata(p_grant_id uuid)
returns table(object_id uuid,round_status app.round_status,league_season_id uuid,created_at timestamptz,member_count integer,active_member_count integer,active_invitation boolean,has_prediction_activity boolean,expires_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor uuid:=auth.uid();target private.support_access_grants%rowtype;
begin
  perform private.require_app_admin();
  select * into target from private.support_access_grants where id=p_grant_id and granted_to=actor for update;
  if target.id is null or target.revoked_at is not null or clock_timestamp()>=target.expires_at then raise exception using errcode='42501',message='Support grant expired, revoked or unavailable';end if;
  insert into app.admin_access_events(actor_id,action,grant_id,object_id)values(actor,'support_metadata_read',target.id,target.round_id);
  return query select r.id,r.status,r.league_season_id,r.created_at,
    (select count(*)::integer from app.round_memberships m where m.round_id=r.id),
    (select count(*)::integer from app.round_memberships m where m.round_id=r.id and m.status='active'),
    exists(select 1 from private.invitations i where i.round_id=r.id and i.revoked_at is null and clock_timestamp()<i.expires_at),
    r.has_predictions,target.expires_at
  from app.prediction_rounds r where r.id=target.round_id;
end $function$;

revoke all on function api.get_support_metadata(uuid) from public,anon;
grant execute on function api.get_support_metadata(uuid) to authenticated,service_role;
