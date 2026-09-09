begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
create temp table completion_fixture as
select api.create_admin_league('Saisonabschluss SQL Test','26/27',array[
  api.create_club_simple('Saisonabschluss Heim'),api.create_club_simple('Saisonabschluss Gast')
]) as id;
select api.publish_admin_league(id,1) from completion_fixture;
select throws_ok($$select api.transition_league_season(id,2,'completed') from completion_fixture$$,'23514',null,'empty season cannot complete');
select ok(not has_table_privilege('anon','api.admin_season_completion','SELECT'),'anonymous cannot read completion administration');
select ok(not has_function_privilege('anon','api.transition_league_season(uuid,integer,app.league_season_status)','EXECUTE'),'anonymous cannot complete a season');
select is((select reloptions @> array['security_invoker=true'] from pg_class where oid='api.round_season_state'::regclass),true,'round season view respects RLS');
alter table completion_fixture add column md uuid;
alter table completion_fixture add column match uuid;
update completion_fixture set md=api.create_matchday_auto(id,'first_leg',current_date-1,current_date+2);
update completion_fixture set match=api.create_match_simple(md,
  (select club_ids[1] from api.admin_leagues where id=completion_fixture.id),
  (select club_ids[2] from api.admin_leagues where id=completion_fixture.id),clock_timestamp()+interval '1 day');
select throws_ok($$select api.transition_league_season(id,2,'completed') from completion_fixture$$,'23514',null,'missing result blocks completion');
-- Deliberately construct a future result to prove the server validates time independently.
insert into app.match_results(match_id,decision,home_goals,away_goals,revision_no,updated_by)
select match,'official',2,1,1,'00000000-0000-4000-8000-000000000004' from completion_fixture;
update app.matches set status='completed' where id=(select match from completion_fixture);
select throws_ok($$select api.transition_league_season(id,2,'completed') from completion_fixture$$,'23514',null,'future match remains blocked even with a result');
update app.matches set kickoff_at=clock_timestamp()-interval '2 hours' where id=(select match from completion_fixture);
update app.matchdays set status='draft' where id=(select md from completion_fixture);
select throws_ok($$select api.transition_league_season(id,2,'completed') from completion_fixture$$,'23514',null,'unpublished matchday cannot disappear from final ranking');
update app.matchdays set status='published' where id=(select md from completion_fixture);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select throws_ok($$select api.transition_league_season(id,2,'completed') from completion_fixture$$,'42501',null,'round owner is not a global administrator');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select lives_ok($$select api.transition_league_season(id,2,'completed') from completion_fixture$$,'admin can close evaluated season');
select is((select status::text from app.league_seasons where id=(select id from completion_fixture)),'completed','season is complete');
select throws_ok($$update app.matches set kickoff_at=kickoff_at+interval '1 minute' where id=(select match from completion_fixture)$$,'23514',null,'schedule changes require reopening');
select throws_ok($$delete from app.match_results where match_id=(select match from completion_fixture)$$,'23514',null,'result deletion requires reopening');
select throws_ok($$select api.transition_league_season(id,2,'published') from completion_fixture$$,'P0001',null,'stale version rejected');
select lives_ok($$select api.transition_league_season(id,3,'published') from completion_fixture$$,'admin can reopen');
select is((select completed_at from app.league_seasons where id=(select id from completion_fixture)),null::timestamptz,'reopening clears completion timestamp');
select lives_ok($$update app.match_results set decision='excluded',home_goals=null,away_goals=null where match_id=(select match from completion_fixture)$$,'correction works after reopening');
select lives_ok($$select api.transition_league_season(id,4,'completed') from completion_fixture$$,'explicitly excluded past match permits re-completion');
select * from finish();
rollback;
