create function api.set_match_result(
  p_match_id uuid,
  p_expected_match_version integer,
  p_expected_revision integer,
  p_decision app.result_decision,
  p_home_goals smallint default null,
  p_away_goals smallint default null,
  p_reason text default null
) returns table(revision_no integer, match_version integer, recalculated_count integer)
language plpgsql security definer set search_path = '' as $function$
declare current_result app.match_results%rowtype; next_revision integer; next_match_version integer;
begin
  perform private.require_app_admin();
  perform 1 from app.matches where id = p_match_id and version = p_expected_match_version for update;
  if not found then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  select * into current_result from app.match_results where match_id = p_match_id for update;
  if coalesce(current_result.revision_no, 0) <> p_expected_revision then raise exception using errcode = 'P0001', message = 'Revision conflict'; end if;
  if (p_decision = 'official' and (p_home_goals is null or p_away_goals is null))
     or (p_decision = 'excluded' and (p_home_goals is not null or p_away_goals is not null)) then
    raise exception using errcode = '23514', message = 'Invalid result shape';
  end if;
  next_revision := p_expected_revision + 1;
  insert into app.result_revisions(match_id, revision_no, old_decision, old_home_goals, old_away_goals,
    new_decision, new_home_goals, new_away_goals, changed_by, reason)
  values (p_match_id, next_revision, current_result.decision, current_result.home_goals, current_result.away_goals,
    p_decision, p_home_goals, p_away_goals, auth.uid(), nullif(btrim(p_reason), ''));
  insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
  values (p_match_id, p_decision, p_home_goals, p_away_goals, next_revision, auth.uid())
  on conflict (match_id) do update set decision = excluded.decision, home_goals = excluded.home_goals,
    away_goals = excluded.away_goals, revision_no = excluded.revision_no, updated_by = excluded.updated_by, updated_at = clock_timestamp();
  update app.matches set status = case when p_decision = 'official' then 'completed'::app.match_status else status end,
    version = version + 1 where id = p_match_id returning version into next_match_version;
  return query select next_revision, next_match_version, 0;
end $function$;

revoke all on function api.set_match_result(uuid,integer,integer,app.result_decision,smallint,smallint,text) from public, anon;
grant execute on function api.set_match_result(uuid,integer,integer,app.result_decision,smallint,smallint,text) to authenticated, service_role;
