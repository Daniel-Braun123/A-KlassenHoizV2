create function private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $function$
  select (select auth.uid()) is not null and exists (
    select 1 from app.profiles p where p.user_id = (select auth.uid()) and p.status = 'active'
  )
$function$;
revoke all on function private.is_active_user() from public, anon;
grant execute on function private.is_active_user() to authenticated, service_role;

alter table app.leagues enable row level security; alter table app.leagues force row level security;
alter table app.seasons enable row level security; alter table app.seasons force row level security;
alter table app.league_seasons enable row level security; alter table app.league_seasons force row level security;
alter table app.clubs enable row level security; alter table app.clubs force row level security;
alter table app.league_season_clubs enable row level security; alter table app.league_season_clubs force row level security;
alter table app.matchdays enable row level security; alter table app.matchdays force row level security;
alter table app.matches enable row level security; alter table app.matches force row level security;
alter table app.match_results enable row level security; alter table app.match_results force row level security;
alter table app.result_revisions enable row level security; alter table app.result_revisions force row level security;

create policy leagues_read on app.leagues for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and exists (
    select 1 from app.league_seasons ls where ls.league_id = leagues.id and ls.status <> 'draft'
  ))
);
create policy seasons_read on app.seasons for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and exists (
    select 1 from app.league_seasons ls where ls.season_id = seasons.id and ls.status <> 'draft'
  ))
);
create policy league_seasons_read on app.league_seasons for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and status <> 'draft')
);
create policy clubs_read on app.clubs for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and exists (
    select 1 from app.league_season_clubs lsc join app.league_seasons ls on ls.id = lsc.league_season_id
    where lsc.club_id = clubs.id and ls.status <> 'draft'
  ))
);
create policy league_season_clubs_read on app.league_season_clubs for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and exists (
    select 1 from app.league_seasons ls where ls.id = league_season_clubs.league_season_id and ls.status <> 'draft'
  ))
);
create policy matchdays_read on app.matchdays for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and status <> 'draft' and exists (
    select 1 from app.league_seasons ls where ls.id = matchdays.league_season_id and ls.status <> 'draft'
  ))
);
create policy matches_read on app.matches for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and status <> 'draft' and exists (
    select 1 from app.matchdays md where md.id = matches.matchday_id and md.status <> 'draft'
  ))
);
create policy match_results_read on app.match_results for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and exists (
    select 1 from app.matches m where m.id = match_results.match_id and m.status <> 'draft'
  ))
);
create policy result_revisions_read on app.result_revisions for select to authenticated using (
  private.is_app_admin() or (private.is_active_user() and exists (
    select 1 from app.matches m where m.id = result_revisions.match_id and m.status <> 'draft'
  ))
);

revoke all on app.leagues, app.seasons, app.league_seasons, app.clubs, app.league_season_clubs,
  app.matchdays, app.matches, app.match_results, app.result_revisions from public, anon, authenticated;
grant select on app.leagues, app.seasons, app.league_seasons, app.clubs, app.league_season_clubs,
  app.matchdays, app.matches, app.match_results, app.result_revisions to authenticated;
grant all on app.leagues, app.seasons, app.league_seasons, app.clubs, app.league_season_clubs,
  app.matchdays, app.matches, app.match_results, app.result_revisions to service_role;
grant usage, select on sequence app.result_revisions_id_seq to service_role;
