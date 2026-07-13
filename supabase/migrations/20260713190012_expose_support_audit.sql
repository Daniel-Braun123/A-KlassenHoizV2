create view api.my_support_audit with(security_invoker=true) as
select id,action,occurred_at from app.admin_access_events where actor_id=(select auth.uid());
revoke all on api.my_support_audit from public,anon;
grant select on api.my_support_audit to authenticated,service_role;
