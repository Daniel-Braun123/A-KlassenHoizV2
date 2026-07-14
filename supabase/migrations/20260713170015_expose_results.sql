create view api.round_results with(security_invoker=true) as
select r.id as round_id,md.id as matchday_id,md.number as matchday_number,md.display_name,
  mt.id as match_id,mt.kickoff_at,mt.status as match_status,hc.name as home_club_name,ac.name as away_club_name,
  mr.decision,mr.home_goals,mr.away_goals,mr.revision_no,mr.updated_at,
  coalesce(mr.revision_no,0)>1 as is_correction
from app.prediction_rounds r
join app.round_memberships own_m on own_m.round_id=r.id and own_m.user_id=(select auth.uid()) and own_m.status='active'
join app.matchdays md on md.league_season_id=r.league_season_id and md.status in('published','completed')
join app.matches mt on mt.matchday_id=md.id and mt.status<>'draft'
join app.clubs hc on hc.id=mt.home_club_id join app.clubs ac on ac.id=mt.away_club_id
left join app.match_results mr on mr.match_id=mt.id;

revoke all on api.round_results from public,anon;
grant select on api.round_results to authenticated,service_role;
