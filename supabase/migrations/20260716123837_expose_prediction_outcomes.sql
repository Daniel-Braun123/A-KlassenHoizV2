create or replace view api.matchday_prediction_sheet with (security_invoker = true) as
select
  r.id as round_id,
  md.id as matchday_id,
  md.number as matchday_number,
  md.display_name,
  md.status as matchday_status,
  mt.id as match_id,
  mt.kickoff_at,
  mt.status as match_status,
  hc.id as home_club_id,
  hc.name as home_club_name,
  hc.short_name as home_club_short_name,
  hc.logo_path as home_logo_path,
  ac.id as away_club_id,
  ac.name as away_club_name,
  ac.short_name as away_club_short_name,
  ac.logo_path as away_logo_path,
  p.home_goals as predicted_home_goals,
  p.away_goals as predicted_away_goals,
  p.updated_at as prediction_saved_at,
  (
    clock_timestamp() < mt.kickoff_at
    and mt.status in ('published', 'postponed')
    and md.status = 'published'
  ) as is_open,
  md.phase,
  hc.logo_url as home_logo_url,
  ac.logo_url as away_logo_url,
  mr.decision as result_decision,
  mr.home_goals as result_home_goals,
  mr.away_goals as result_away_goals,
  mr.revision_no as result_revision_no,
  coalesce(mr.revision_no, 0) > 1 as result_is_correction,
  ps.points as prediction_points
from app.prediction_rounds r
join app.round_memberships own_m
  on own_m.round_id = r.id
  and own_m.user_id = (select auth.uid())
  and own_m.status = 'active'
join app.matchdays md
  on md.league_season_id = r.league_season_id
  and md.status in ('published', 'completed')
join app.matches mt
  on mt.matchday_id = md.id
  and mt.status <> 'draft'
join app.clubs hc on hc.id = mt.home_club_id
join app.clubs ac on ac.id = mt.away_club_id
left join app.predictions p
  on p.round_id = r.id
  and p.membership_id = own_m.id
  and p.match_id = mt.id
left join app.match_results mr on mr.match_id = mt.id
left join app.prediction_scores ps
  on ps.prediction_id = p.id
  and ps.round_id = r.id
  and ps.membership_id = own_m.id
  and ps.match_id = mt.id;

revoke all on api.matchday_prediction_sheet from public, anon;
grant select on api.matchday_prediction_sheet to authenticated, service_role;
