create function private.recalculate_match_scores(p_match_id uuid)
returns integer language plpgsql security definer set search_path='' as $function$
declare current_result app.match_results%rowtype; target_matchday uuid; affected integer:=0;
begin
  select * into current_result from app.match_results where match_id=p_match_id for update;
  if not found then raise exception using errcode='P0002',message='Result unavailable';end if;
  select matchday_id into target_matchday from app.matches where id=p_match_id;
  delete from app.prediction_scores where match_id=p_match_id;
  if current_result.decision='official' then
    insert into app.prediction_scores(prediction_id,round_id,membership_id,match_id,matchday_id,points,result_revision,calculation_version)
    select p.id,p.round_id,p.membership_id,p.match_id,target_matchday,
      private.calculate_prediction_points(p.home_goals,p.away_goals,current_result.home_goals,current_result.away_goals),
      current_result.revision_no,private.score_calculation_version()
    from app.predictions p where p.match_id=p_match_id order by p.round_id,p.membership_id,p.id;
    get diagnostics affected=row_count;
  end if;
  return affected;
end $function$;

create function private.rebuild_all_scores()
returns integer language plpgsql security definer set search_path='' as $function$
declare result_match uuid; total integer:=0;
begin
  for result_match in select match_id from app.match_results order by match_id for update loop
    total:=total+private.recalculate_match_scores(result_match);
  end loop;
  return total;
end $function$;

revoke all on function private.recalculate_match_scores(uuid),private.rebuild_all_scores() from public,anon,authenticated;
grant execute on function private.recalculate_match_scores(uuid),private.rebuild_all_scores() to service_role;
