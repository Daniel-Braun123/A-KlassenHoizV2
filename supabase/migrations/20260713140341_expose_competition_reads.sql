create view api.published_league_seasons with (security_invoker = true) as
select ls.id, l.name as league_name, l.short_name as league_short_name, s.label as season_label,
  s.starts_on, s.ends_on, ls.status, ls.version
from app.league_seasons ls
join app.leagues l on l.id = ls.league_id
join app.seasons s on s.id = ls.season_id
where ls.status = 'published';

create view api.competition_catalog with (security_invoker = true) as
select ls.id as league_season_id, ls.status as league_season_status, ls.version as league_season_version,
  l.id as league_id, l.name as league_name, l.short_name as league_short_name, l.status as league_status, l.version as league_version,
  s.id as season_id, s.label as season_label, s.starts_on, s.ends_on, s.status as season_status, s.version as season_version
from app.league_seasons ls join app.leagues l on l.id = ls.league_id join app.seasons s on s.id = ls.season_id;

create view api.league_catalog with (security_invoker = true) as
select id, name, short_name, status, version from app.leagues;

create view api.season_catalog with (security_invoker = true) as
select id, label, starts_on, ends_on, status, version from app.seasons;

create view api.club_catalog with (security_invoker = true) as
select c.id, c.name, c.short_name, c.logo_path, c.status, c.version from app.clubs c;

create view api.schedule with (security_invoker = true) as
select md.id as matchday_id, md.league_season_id, md.number as matchday_number, md.display_name, md.status as matchday_status, md.version as matchday_version,
  m.id as match_id, m.home_club_id, hc.name as home_club_name, m.away_club_id, ac.name as away_club_name,
  m.kickoff_at, m.status as match_status, m.version as match_version,
  r.decision, r.home_goals, r.away_goals, r.revision_no
from app.matchdays md
left join app.matches m on m.matchday_id = md.id
left join app.clubs hc on hc.id = m.home_club_id
left join app.clubs ac on ac.id = m.away_club_id
left join app.match_results r on r.match_id = m.id;

revoke all on api.published_league_seasons, api.competition_catalog, api.league_catalog, api.season_catalog, api.club_catalog, api.schedule from public, anon;
grant select on api.published_league_seasons, api.competition_catalog, api.league_catalog, api.season_catalog, api.club_catalog, api.schedule to authenticated, service_role;
