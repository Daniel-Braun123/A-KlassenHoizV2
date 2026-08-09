create or replace view api.visible_predictions with (security_invoker = true) as
select
  p.round_id,
  p.match_id,
  p.membership_id,
  m.nickname,
  p.home_goals,
  p.away_goals,
  p.updated_at,
  mt.kickoff_at,
  ps.points
from app.predictions p
join app.round_memberships m on m.id = p.membership_id
join app.matches mt on mt.id = p.match_id
left join app.prediction_scores ps
  on ps.prediction_id = p.id
  and ps.round_id = p.round_id
  and ps.membership_id = p.membership_id
  and ps.match_id = p.match_id
where clock_timestamp() >= mt.kickoff_at;

revoke all on api.visible_predictions from public, anon;
grant select on api.visible_predictions to authenticated, service_role;
