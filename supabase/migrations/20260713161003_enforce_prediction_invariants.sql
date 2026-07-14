create unique index predictions_round_membership_match_unique on app.predictions(round_id,membership_id,match_id);
create index predictions_membership_id_idx on app.predictions(membership_id);
create index predictions_match_id_idx on app.predictions(match_id);
create index predictions_round_match_idx on app.predictions(round_id,match_id);

create function private.validate_prediction_links()
returns trigger language plpgsql security definer set search_path='' as $function$
declare target_league_season uuid; match_league_season uuid;
begin
  if not exists(select 1 from app.round_memberships m where m.id=new.membership_id and m.round_id=new.round_id and m.status='active') then raise exception using errcode='23514',message='Active membership must belong to round';end if;
  select league_season_id into target_league_season from app.prediction_rounds where id=new.round_id and status='active';
  select md.league_season_id into match_league_season from app.matches mt join app.matchdays md on md.id=mt.matchday_id where mt.id=new.match_id;
  if target_league_season is null or target_league_season<>match_league_season then raise exception using errcode='23514',message='Match must belong to round league season';end if;
  return new;
end $function$;
create trigger predictions_validate_links before insert or update of round_id,membership_id,match_id on app.predictions for each row execute function private.validate_prediction_links();
revoke all on function private.validate_prediction_links() from public,anon,authenticated;
