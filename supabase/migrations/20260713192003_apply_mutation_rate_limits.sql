create or replace function api.rotate_round_invitation(p_round_id uuid,p_token_hash bytea)
returns table(invitation_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor uuid; actor_membership uuid; new_id uuid:=gen_random_uuid(); expiry timestamptz:=clock_timestamp()+interval '7 days';
begin
  actor := private.require_round_user();
  perform private.enforce_rate_limit(actor, 'invitation:' || p_round_id::text, 5, interval '5 minutes');
  if octet_length(p_token_hash)<>32 then raise exception using errcode='22023',message='SHA-256 token hash required'; end if;
  select id into actor_membership from app.round_memberships where round_id=p_round_id and user_id=actor and role='owner' and status='active';
  if actor_membership is null then raise exception using errcode='42501',message='Round owner required'; end if;
  update private.invitations set revoked_at=clock_timestamp() where round_id=p_round_id and revoked_at is null;
  insert into private.invitations(id,round_id,token_hash,created_by_membership_id,expires_at) values(new_id,p_round_id,p_token_hash,actor_membership,expiry);
  return query select new_id,expiry;
end $function$;

create or replace function api.save_prediction(p_round_id uuid,p_match_id uuid,p_home_goals smallint,p_away_goals smallint,p_idempotency_key uuid)
returns table(prediction_id uuid,saved_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor uuid; actor_membership uuid; kickoff timestamptz; match_state app.match_status; day_state app.matchday_status; target_ls uuid; match_ls uuid; pred_id uuid; claimed uuid; saved timestamptz;
begin
  actor:=private.require_round_user();
  perform private.enforce_rate_limit(actor, 'prediction:' || p_round_id::text || ':' || p_match_id::text, 60, interval '1 minute');
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

create or replace function api.create_support_access(p_round_id uuid,p_case_reference text,p_reason text,p_duration_minutes smallint default 15)
returns table(grant_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $function$
declare actor uuid:=auth.uid();new_id uuid:=gen_random_uuid();deadline timestamptz;
begin
  perform private.require_app_admin();
  perform private.enforce_rate_limit(actor, 'support:' || p_round_id::text, 5, interval '15 minutes');
  if p_duration_minutes not between 1 and 15 then raise exception using errcode='22023',message='Duration must be 1 to 15 minutes';end if;
  if char_length(btrim(p_case_reference)) < 3 or char_length(btrim(p_reason)) < 10 then raise exception using errcode='22023',message='Case reference and reason required';end if;
  if not exists(select 1 from app.prediction_rounds where id=p_round_id) then raise exception using errcode='P0002',message='Support object unavailable';end if;
  deadline:=clock_timestamp()+make_interval(mins=>p_duration_minutes);
  insert into private.support_access_grants(id,round_id,granted_to,case_reference,reason,expires_at)values(new_id,p_round_id,actor,btrim(p_case_reference),btrim(p_reason),deadline);
  insert into app.admin_access_events(actor_id,action,grant_id,object_id)values(actor,'support_grant_created',new_id,p_round_id);
  return query select new_id,deadline;
end $function$;

