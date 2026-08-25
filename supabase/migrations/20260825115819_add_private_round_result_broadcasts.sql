create index round_memberships_active_round_user_idx
on app.round_memberships(round_id, user_id)
where status = 'active' and user_id is not null;

create function private.can_receive_round_broadcast(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  target_round_id uuid;
begin
  if p_topic is null or p_topic !~* '^round:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  target_round_id := substring(p_topic from 7)::uuid;
  return private.is_round_member(target_round_id);
end
$function$;

revoke all on function private.can_receive_round_broadcast(text) from public, anon;
grant execute on function private.can_receive_round_broadcast(text) to authenticated, service_role;

create policy round_result_broadcast_member_receive
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select private.can_receive_round_broadcast((select realtime.topic())))
);

create function private.broadcast_match_result_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_match_id uuid;
  target_round record;
begin
  target_match_id := case when tg_op = 'DELETE' then old.match_id else new.match_id end;

  for target_round in
    select round.id
    from app.prediction_rounds as round
    join app.matchdays as matchday
      on matchday.league_season_id = round.league_season_id
    join app.matches as match
      on match.matchday_id = matchday.id
    where match.id = target_match_id
  loop
    perform realtime.send(
      pg_catalog.jsonb_build_object('matchId', target_match_id),
      'result_changed',
      'round:' || target_round.id::text,
      true
    );
  end loop;

  return null;
end
$function$;

revoke all on function private.broadcast_match_result_change()
from public, anon, authenticated, service_role;

create trigger match_results_broadcast_change
after insert or update or delete on app.match_results
for each row execute function private.broadcast_match_result_change();
