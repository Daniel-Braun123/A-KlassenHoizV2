create function api.save_predictions_batch(
  p_round_id uuid,
  p_predictions jsonb
)
returns table(saved_count integer, saved_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid;
  item jsonb;
  item_match_id uuid;
  item_home_goals smallint;
  item_away_goals smallint;
  item_idempotency_key uuid;
  saved_total integer := 0;
begin
  actor := private.require_round_user();

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

revoke all on function api.save_predictions_batch(uuid, jsonb) from public, anon;
grant execute on function api.save_predictions_batch(uuid, jsonb) to authenticated, service_role;
