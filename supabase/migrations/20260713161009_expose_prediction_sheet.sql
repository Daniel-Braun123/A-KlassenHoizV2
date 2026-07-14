create view api.round_overview with(security_invoker=true) as
select r.id as round_id,r.name,r.league_season_id,r.status,r.version,
  min(mt.kickoff_at) filter(where mt.kickoff_at>clock_timestamp() and mt.status in('published','postponed')) as next_kickoff_at,
  count(mt.id) filter(where mt.status<>'draft')::integer as total_matches,
  count(p.id)::integer as predicted_matches
from app.prediction_rounds r
join app.round_memberships own_m on own_m.round_id=r.id and own_m.user_id=(select auth.uid()) and own_m.status='active'
left join app.matchdays md on md.league_season_id=r.league_season_id and md.status in('published','completed')
left join app.matches mt on mt.matchday_id=md.id
left join app.predictions p on p.round_id=r.id and p.membership_id=own_m.id and p.match_id=mt.id
group by r.id;

create view api.matchday_prediction_sheet with(security_invoker=true) as
select r.id as round_id,md.id as matchday_id,md.number as matchday_number,md.display_name,md.status as matchday_status,
  mt.id as match_id,mt.kickoff_at,mt.status as match_status,
  hc.id as home_club_id,hc.name as home_club_name,hc.short_name as home_club_short_name,hc.logo_path as home_logo_path,
  ac.id as away_club_id,ac.name as away_club_name,ac.short_name as away_club_short_name,ac.logo_path as away_logo_path,
  p.home_goals as predicted_home_goals,p.away_goals as predicted_away_goals,p.updated_at as prediction_saved_at,
  (clock_timestamp()<mt.kickoff_at and mt.status in('published','postponed') and md.status='published') as is_open
from app.prediction_rounds r
join app.round_memberships own_m on own_m.round_id=r.id and own_m.user_id=(select auth.uid()) and own_m.status='active'
join app.matchdays md on md.league_season_id=r.league_season_id and md.status in('published','completed')
join app.matches mt on mt.matchday_id=md.id and mt.status<>'draft'
join app.clubs hc on hc.id=mt.home_club_id join app.clubs ac on ac.id=mt.away_club_id
left join app.predictions p on p.round_id=r.id and p.membership_id=own_m.id and p.match_id=mt.id;

revoke all on api.round_overview,api.matchday_prediction_sheet from public,anon;
grant select on api.round_overview,api.matchday_prediction_sheet to authenticated,service_role;
