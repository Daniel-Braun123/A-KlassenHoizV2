create or replace view api.round_overview with (security_invoker = true) as
select
  r.id as round_id,
  r.name,
  r.league_season_id,
  r.status,
  r.version,
  min(mt.kickoff_at) as next_kickoff_at,
  count(mt.id)::integer as total_matches,
  count(p.id)::integer as predicted_matches
from app.prediction_rounds r
join app.round_memberships own_m
  on own_m.round_id = r.id
  and own_m.user_id = (select auth.uid())
  and own_m.status = 'active'
left join app.matchdays md
  on md.league_season_id = r.league_season_id
  and md.status = 'published'
left join app.matches mt
  on mt.matchday_id = md.id
  and mt.status in ('published', 'postponed')
  and mt.kickoff_at > clock_timestamp()
left join app.predictions p
  on p.round_id = r.id
  and p.membership_id = own_m.id
  and p.match_id = mt.id
group by r.id;

revoke all on api.round_overview from public, anon;
grant select on api.round_overview to authenticated, service_role;
