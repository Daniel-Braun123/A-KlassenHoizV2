create function private.can_read_prediction(p_round_id uuid,p_membership_id uuid,p_match_id uuid)
returns boolean language sql stable security definer set search_path='' as $function$
  select private.is_round_member(p_round_id) and (
    exists(select 1 from app.round_memberships m where m.id=p_membership_id and m.user_id=(select auth.uid()) and m.status='active')
    or exists(select 1 from app.matches mt where mt.id=p_match_id and clock_timestamp()>=mt.kickoff_at)
  )
$function$;
revoke all on function private.can_read_prediction(uuid,uuid,uuid) from public,anon;
grant execute on function private.can_read_prediction(uuid,uuid,uuid) to authenticated,service_role;
alter table app.predictions enable row level security;alter table app.predictions force row level security;
create policy predictions_deadline_read on app.predictions for select to authenticated using(private.can_read_prediction(round_id,membership_id,match_id));
revoke all on app.predictions from public,anon,authenticated;grant select on app.predictions to authenticated;grant all on app.predictions to service_role;
