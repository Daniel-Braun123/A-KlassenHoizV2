create function private.is_round_member(p_round_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select private.is_active_user() and not private.is_app_admin() and exists(
    select 1 from app.round_memberships m where m.round_id = p_round_id and m.user_id = (select auth.uid()) and m.status = 'active'
  )
$function$;
create function private.is_round_owner(p_round_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select private.is_active_user() and not private.is_app_admin() and exists(
    select 1 from app.round_memberships m where m.round_id = p_round_id and m.user_id = (select auth.uid()) and m.role = 'owner' and m.status = 'active'
  )
$function$;
revoke all on function private.is_round_member(uuid), private.is_round_owner(uuid) from public, anon;
grant execute on function private.is_round_member(uuid), private.is_round_owner(uuid) to authenticated, service_role;

alter table app.prediction_rounds enable row level security; alter table app.prediction_rounds force row level security;
alter table app.round_memberships enable row level security; alter table app.round_memberships force row level security;
create policy prediction_rounds_member_read on app.prediction_rounds for select to authenticated using (private.is_round_member(id));
create policy round_memberships_member_read on app.round_memberships for select to authenticated using (private.is_round_member(round_id));

revoke all on app.prediction_rounds, app.round_memberships from public, anon, authenticated;
grant select on app.prediction_rounds, app.round_memberships to authenticated;
grant all on app.prediction_rounds, app.round_memberships to service_role;
