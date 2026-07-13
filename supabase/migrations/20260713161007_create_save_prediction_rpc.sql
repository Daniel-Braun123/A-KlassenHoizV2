create function private.prediction_is_open(p_kickoff_at timestamptz,p_now timestamptz)
returns boolean language sql immutable strict set search_path='' as $function$select p_now<p_kickoff_at$function$;
revoke all on function private.prediction_is_open(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function private.prediction_is_open(timestamptz,timestamptz) to service_role;

create function api.save_prediction(p_round_id uuid,p_match_id uuid,p_home_goals smallint,p_away_goals smallint,p_idempotency_key uuid)
returns table(prediction_id uuid,saved_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor uuid; actor_membership uuid; kickoff timestamptz; match_state app.match_status; day_state app.matchday_status; target_ls uuid; match_ls uuid; pred_id uuid; claimed uuid; saved timestamptz;
begin
  actor:=private.require_round_user();
  select mt.kickoff_at,mt.status,md.status,md.league_season_id into kickoff,match_state,day_state,match_ls from app.matches mt join app.matchdays md on md.id=mt.matchday_id where mt.id=p_match_id for update of mt;
  if kickoff is null then raise exception using errcode='P0002',message='Match unavailable';end if;
  if not private.prediction_is_open(kickoff,clock_timestamp()) or match_state not in ('published','postponed') or day_state<>'published' then raise exception using errcode='P0001',message='Deadline passed or match locked';end if;
  select r.league_season_id into target_ls from app.prediction_rounds r where r.id=p_round_id and r.status='active' for update;
  if target_ls is null or target_ls<>match_ls then raise exception using errcode='42501',message='Round and match mismatch';end if;
  select id into actor_membership from app.round_memberships where round_id=p_round_id and user_id=actor and status='active' for update;
  if actor_membership is null then raise exception using errcode='42501',message='Active membership required';end if;
  select id into pred_id from app.predictions where round_id=p_round_id and membership_id=actor_membership and match_id=p_match_id for update;
  pred_id:=coalesce(pred_id,gen_random_uuid());
  insert into private.mutation_idempotency(user_id,scope,idempotency_key,result_id) values(actor,'save_prediction',p_idempotency_key,pred_id) on conflict do nothing returning result_id into claimed;
  if claimed is null then select result_id into claimed from private.mutation_idempotency where user_id=actor and scope='save_prediction' and idempotency_key=p_idempotency_key;select updated_at into saved from app.predictions where id=claimed;return query select claimed,saved;return;end if;
  insert into app.predictions(id,round_id,membership_id,match_id,home_goals,away_goals) values(pred_id,p_round_id,actor_membership,p_match_id,p_home_goals,p_away_goals)
  on conflict(round_id,membership_id,match_id) do update set home_goals=excluded.home_goals,away_goals=excluded.away_goals returning id,updated_at into pred_id,saved;
  update app.prediction_rounds set has_predictions=true where id=p_round_id and not has_predictions;
  return query select pred_id,saved;
end $function$;
revoke all on function api.save_prediction(uuid,uuid,smallint,smallint,uuid) from public,anon;
grant execute on function api.save_prediction(uuid,uuid,smallint,smallint,uuid) to authenticated,service_role;
