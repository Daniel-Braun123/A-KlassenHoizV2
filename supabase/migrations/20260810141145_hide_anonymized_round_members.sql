create or replace view api.round_members with (security_invoker = true) as
select
  m.id,
  m.round_id,
  m.nickname,
  m.role,
  m.status,
  m.joined_at,
  m.ended_at
from app.round_memberships m
where m.status not in ('removed', 'anonymized');

create or replace view api.overall_ranking with (security_invoker = true) as
with totals as (
  select
    m.round_id,
    m.id as membership_id,
    m.user_id,
    m.nickname,
    m.status as membership_status,
    coalesce(sum(s.points), 0)::integer as points,
    count(s.prediction_id) filter (where s.points = 4)::integer as exact_scores,
    count(s.prediction_id)::integer as scored_tips
  from app.round_memberships m
  join app.prediction_rounds r on r.id = m.round_id
  join app.round_memberships actor_m
    on actor_m.round_id = m.round_id
    and actor_m.user_id = (select auth.uid())
    and actor_m.status = 'active'
  left join app.prediction_scores s
    on s.membership_id = m.id
    and s.round_id = m.round_id
  where m.status not in ('removed', 'anonymized')
  group by m.round_id, m.id
)
select
  round_id,
  membership_id,
  nickname,
  membership_status,
  points,
  exact_scores,
  rank() over (partition by round_id order by points desc)::integer as rank,
  user_id = (select auth.uid()) as is_current_user,
  scored_tips
from totals;

create or replace view api.matchday_ranking with (security_invoker = true) as
with days as (
  select distinct
    m.round_id,
    md.id as matchday_id,
    md.number as matchday_number,
    md.display_name,
    md.starts_on,
    md.ends_on
  from app.round_memberships m
  join app.prediction_rounds r on r.id = m.round_id
  join app.round_memberships actor_m
    on actor_m.round_id = m.round_id
    and actor_m.user_id = (select auth.uid())
    and actor_m.status = 'active'
  join app.matchdays md on md.league_season_id = r.league_season_id
  where
    m.status not in ('removed', 'anonymized')
    and md.status in ('published', 'completed')
), totals as (
  select
    d.round_id,
    d.matchday_id,
    d.matchday_number,
    d.display_name,
    m.id as membership_id,
    m.user_id,
    m.nickname,
    m.status as membership_status,
    coalesce(sum(s.points), 0)::integer as points,
    count(s.prediction_id) filter (where s.points = 4)::integer as exact_scores,
    count(s.prediction_id)::integer as scored_tips,
    d.starts_on,
    d.ends_on
  from days d
  join app.round_memberships m
    on m.round_id = d.round_id
    and m.status not in ('removed', 'anonymized')
  left join app.prediction_scores s
    on s.membership_id = m.id
    and s.matchday_id = d.matchday_id
  group by
    d.round_id,
    d.matchday_id,
    d.matchday_number,
    d.display_name,
    m.id,
    d.starts_on,
    d.ends_on
)
select
  round_id,
  matchday_id,
  matchday_number,
  display_name,
  membership_id,
  nickname,
  membership_status,
  points,
  exact_scores,
  rank() over (partition by round_id, matchday_id order by points desc)::integer as rank,
  user_id = (select auth.uid()) as is_current_user,
  starts_on,
  ends_on,
  scored_tips
from totals;

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
where
  clock_timestamp() >= mt.kickoff_at
  and m.status not in ('removed', 'anonymized');

revoke all on api.round_members, api.overall_ranking, api.matchday_ranking, api.visible_predictions
from public, anon;
grant select on api.round_members, api.overall_ranking, api.matchday_ranking, api.visible_predictions
to authenticated, service_role;
