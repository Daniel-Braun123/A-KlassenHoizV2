-- An existing fixture keeps its matchday and predictions when only its date changes.
-- New fixtures and moves to a different matchday still obey that matchday's period.
create or replace function private.validate_match_kickoff_in_matchday_period()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_starts_on date;
  target_ends_on date;
  kickoff_date date;
begin
  if tg_op = 'UPDATE' then
    if new.matchday_id = old.matchday_id
       and new.home_club_id = old.home_club_id
       and new.away_club_id = old.away_club_id
       and not exists (select 1 from app.match_results where match_id = old.id) then
      return new;
    end if;
  end if;

  select starts_on, ends_on
  into target_starts_on, target_ends_on
  from app.matchdays
  where id = new.matchday_id;
  if target_starts_on is null or target_ends_on is null then
    raise exception using errcode = '23503', message = 'Matchday unavailable';
  end if;

  kickoff_date := (new.kickoff_at at time zone 'Europe/Berlin')::date;
  if kickoff_date < target_starts_on or kickoff_date > target_ends_on then
    raise exception using errcode = '23514', message = 'Kickoff must be inside the matchday period';
  end if;
  return new;
end
$function$;

create function api.reschedule_match(
  p_id uuid,
  p_expected_version integer,
  p_kickoff_at timestamptz
) returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_match app.matches%rowtype;
  day_status app.matchday_status;
  new_version integer;
begin
  perform private.require_app_admin();
  select * into target_match from app.matches where id = p_id for update;
  if not found or target_match.version is distinct from p_expected_version then
    raise exception using errcode = 'P0001', message = 'Version conflict';
  end if;
  if exists (select 1 from app.match_results where match_id = p_id) then
    raise exception using errcode = '22023', message = 'Match cannot be rescheduled after results';
  end if;
  if p_kickoff_at is null or not isfinite(p_kickoff_at) then
    raise exception using errcode = '22023', message = 'A valid new kickoff is required';
  end if;

  select status into day_status from app.matchdays where id = target_match.matchday_id;
  update app.matches
  set kickoff_at = p_kickoff_at,
      status = case
        when day_status in ('published', 'completed') then 'published'::app.match_status
        else 'draft'::app.match_status
      end,
      version = version + 1
  where id = p_id
  returning version into new_version;

  insert into private.competition_change_audit(object_type, object_id, action, changed_by)
  values ('match', p_id, 'rescheduled', auth.uid());
  return new_version;
end
$function$;

revoke all on function api.reschedule_match(uuid, integer, timestamptz) from public, anon;
grant execute on function api.reschedule_match(uuid, integer, timestamptz)
to authenticated, service_role;
