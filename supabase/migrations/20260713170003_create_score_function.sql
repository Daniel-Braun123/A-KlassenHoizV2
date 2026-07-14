create function private.calculate_prediction_points(
  p_predicted_home integer,
  p_predicted_away integer,
  p_actual_home integer,
  p_actual_away integer
) returns smallint
language sql immutable strict parallel safe set search_path='' as $function$
select case
  when p_predicted_home=p_actual_home and p_predicted_away=p_actual_away then 4
  when p_predicted_home-p_predicted_away=p_actual_home-p_actual_away then 3
  when sign(p_predicted_home-p_predicted_away)=sign(p_actual_home-p_actual_away) then 2
  else 0
end::smallint
$function$;

create function private.score_calculation_version() returns smallint
language sql immutable parallel safe set search_path='' as $function$select 1::smallint$function$;

revoke all on function private.calculate_prediction_points(integer,integer,integer,integer),private.score_calculation_version() from public,anon,authenticated;
grant execute on function private.calculate_prediction_points(integer,integer,integer,integer),private.score_calculation_version() to service_role;
