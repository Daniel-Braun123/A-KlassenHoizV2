create or replace function api.save_predictions_batch(
  p_round_id uuid,
  p_predictions jsonb
)
returns table(saved_count integer, saved_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  item jsonb;
  item_match_id uuid;
  item_home_goals smallint;
  item_away_goals smallint;
  item_idempotency_key uuid;
  saved_total integer := 0;
begin
  perform private.require_round_user();

  if p_predictions is null
    or jsonb_typeof(p_predictions) <> 'array'
    or jsonb_array_length(p_predictions) < 1
    or jsonb_array_length(p_predictions) > 100 then
    raise exception using
      errcode = '22023',
      message = 'Predictions must be an array containing between 1 and 100 entries';
  end if;

  if (
    select count(distinct value ->> 'matchId') <> count(*)
    from jsonb_array_elements(p_predictions)
  ) then
    raise exception using
      errcode = '22023',
      message = 'Each match may occur only once per batch';
  end if;

  for item in select value from jsonb_array_elements(p_predictions)
  loop
    begin
      item_match_id := (item ->> 'matchId')::uuid;
      item_home_goals := (item ->> 'homeGoals')::smallint;
      item_away_goals := (item ->> 'awayGoals')::smallint;
      item_idempotency_key := (item ->> 'idempotencyKey')::uuid;
    exception
      when invalid_text_representation or numeric_value_out_of_range then
        raise exception using
          errcode = '22023',
          message = 'Invalid prediction entry';
    end;

    if item_match_id is null
      or item_idempotency_key is null
      or item_home_goals not between 0 and 99
      or item_away_goals not between 0 and 99 then
      raise exception using
        errcode = '22023',
        message = 'Invalid prediction entry';
    end if;

    perform prediction_id
    from api.save_prediction(
      p_round_id,
      item_match_id,
      item_home_goals,
      item_away_goals,
      item_idempotency_key
    );
    saved_total := saved_total + 1;
  end loop;

  return query select saved_total, clock_timestamp();
end
$function$;

create or replace function api.transfer_round_ownership(
  p_round_id uuid,
  p_target_membership_id uuid,
  p_expected_version integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  old_owner uuid;
  target_id uuid;
  new_version integer;
begin
  perform private.require_round_user();
  select owner_membership_id
  into old_owner
  from app.prediction_rounds
  where id = p_round_id and version = p_expected_version
  for update;

  if old_owner is null or not private.is_round_owner(p_round_id) then
    raise exception using errcode = '42501', message = 'Round owner and current version required';
  end if;

  select id
  into target_id
  from app.round_memberships
  where id = p_target_membership_id
    and round_id = p_round_id
    and status = 'active'
    and role = 'member'
  for update;

  if target_id is null then
    raise exception using errcode = '22023', message = 'Active target member required';
  end if;

  perform 1 from app.round_memberships where id = old_owner for update;
  update app.round_memberships set role = 'member' where id = old_owner;
  update app.round_memberships set role = 'owner' where id = target_id;
  update app.prediction_rounds
  set owner_membership_id = target_id, version = version + 1
  where id = p_round_id
  returning version into new_version;

  return new_version;
end
$function$;
