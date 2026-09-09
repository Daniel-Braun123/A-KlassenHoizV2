-- A season closes explicitly, not merely because the last known match has a result.
create view api.admin_season_completion with (security_invoker = true) as
select ls.id, ls.status, ls.version,
  count(m.id)::integer as total_matches,
  count(m.id) filter (where r.match_id is null or r.decision not in ('official', 'excluded'))::integer as missing_results,
  count(m.id) filter (where m.kickoff_at + interval '90 minutes' > statement_timestamp())::integer as unfinished_matches,
  count(m.id) filter (where m.status <> 'completed' and coalesce(r.decision::text, '') <> 'excluded')::integer as unresolved_matches,
  count(distinct md.id) filter (where md.status not in ('published', 'completed'))::integer as unpublished_matchdays
from app.league_seasons ls
left join app.matchdays md on md.league_season_id = ls.id
left join app.matches m on m.matchday_id = md.id
left join app.match_results r on r.match_id = m.id
where (select private.is_app_admin())
group by ls.id;

create view api.round_season_state with (security_invoker = true) as
select r.id as round_id, ls.status, ls.completed_at
from app.prediction_rounds r
join app.league_seasons ls on ls.id = r.league_season_id
join app.round_memberships actor on actor.round_id = r.id
  and actor.user_id = (select auth.uid()) and actor.status = 'active';

revoke all on api.admin_season_completion, api.round_season_state from public, anon;
grant select on api.admin_season_completion, api.round_season_state to authenticated, service_role;

create function private.validate_season_completion() returns trigger
language plpgsql security definer set search_path = '' as $function$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    if not exists (select 1 from app.matches m join app.matchdays md on md.id = m.matchday_id where md.league_season_id = new.id)
      or exists (select 1 from app.matchdays md where md.league_season_id = new.id and md.status not in ('published','completed'))
      or exists (
        select 1 from app.matches m join app.matchdays md on md.id = m.matchday_id
        left join app.match_results r on r.match_id = m.id
        where md.league_season_id = new.id and (
          r.match_id is null or r.decision not in ('official','excluded')
          or m.kickoff_at + interval '90 minutes' > clock_timestamp()
          or (m.status <> 'completed' and r.decision <> 'excluded')
        )
      ) then
      raise exception using errcode = '23514', message = 'Season completion requirements not met';
    end if;
  end if;
  return new;
end
$function$;
revoke all on function private.validate_season_completion() from public, anon, authenticated;
create trigger validate_season_completion before update of status on app.league_seasons
for each row execute function private.validate_season_completion();

-- Serialize schedule/result writes with completion, and require reopening for corrections.
create or replace function private.guard_completed_season_write() returns trigger
language plpgsql security definer set search_path = '' as $function$
declare source_row jsonb; target_row jsonb; target_league_season_id uuid; season_status app.league_season_status;
begin
  if tg_op <> 'INSERT' then source_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then target_row := to_jsonb(new); end if;
  for target_league_season_id in
    select distinct ls_id from (
      select (j->>'league_season_id')::uuid as ls_id
        from (values (source_row), (target_row)) rows(j) where tg_table_name = 'matchdays'
      union all
      select md.league_season_id from app.matchdays md
        where tg_table_name = 'matches' and md.id in ((source_row->>'matchday_id')::uuid, (target_row->>'matchday_id')::uuid)
      union all
      select md.league_season_id from app.matches m join app.matchdays md on md.id = m.matchday_id
        where tg_table_name = 'match_results' and m.id in ((source_row->>'match_id')::uuid, (target_row->>'match_id')::uuid)
    ) targets where ls_id is not null order by ls_id
  loop
    select ls.status into season_status from app.league_seasons ls where ls.id = target_league_season_id for update;
    if season_status in ('completed', 'archived') then
      raise exception using errcode = '23514', message = 'Reopen season before changing schedule or results';
    end if;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;
revoke all on function private.guard_completed_season_write() from public, anon, authenticated;
create trigger guard_completed_season_write before insert or update or delete on app.matchdays
for each row execute function private.guard_completed_season_write();
create trigger guard_completed_season_write before insert or update or delete on app.matches
for each row execute function private.guard_completed_season_write();
create trigger guard_completed_season_write before insert or update or delete on app.match_results
for each row execute function private.guard_completed_season_write();

create or replace function api.transition_league_season(p_id uuid, p_expected_version integer, p_status app.league_season_status) returns integer
language plpgsql security definer set search_path = '' as $function$
declare target app.league_seasons%rowtype; new_version integer;
begin
  perform private.require_app_admin();
  select * into target from app.league_seasons where id = p_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'League season unavailable'; end if;
  if target.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'Version conflict'; end if;
  if not ((target.status = 'draft' and p_status = 'published')
    or (target.status = 'published' and p_status = 'completed')
    or (target.status = 'completed' and p_status in ('published','archived'))) then
    raise exception using errcode = '23514', message = 'Invalid league season transition';
  end if;
  update app.league_seasons set status = p_status,
    published_at = coalesce(published_at, clock_timestamp()),
    completed_at = case when p_status = 'completed' then clock_timestamp() when p_status = 'published' then null else completed_at end,
    archived_at = case when p_status = 'archived' then clock_timestamp() else archived_at end,
    version = version + 1
  where id = p_id returning version into new_version;
  return new_version;
end
$function$;
revoke all on function api.transition_league_season(uuid,integer,app.league_season_status) from public, anon;
grant execute on function api.transition_league_season(uuid,integer,app.league_season_status) to authenticated, service_role;
notify pgrst, 'reload schema';
