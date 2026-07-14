begin;create extension if not exists pgtap with schema extensions;set local search_path=extensions,public,pg_catalog;select plan(9);
select has_view('api','overall_ranking','overall ranking exists');
select has_view('api','matchday_ranking','matchday ranking exists');
select view_owner_is('api','overall_ranking','postgres','overall ranking has controlled owner');
select is((select reloptions @> array['security_invoker=true'] from pg_class where oid='api.overall_ranking'::regclass),true,'overall ranking uses invoker security');
select is((select reloptions @> array['security_invoker=true'] from pg_class where oid='api.matchday_ranking'::regclass),true,'matchday ranking uses invoker security');
insert into app.leagues(id,name,short_name)values('52000000-0000-4000-8000-000000000001','Ranking Liga','RKL');
insert into app.seasons(id,label,starts_on,ends_on)values('52000000-0000-4000-8000-000000000002','Ranking 26/27','2026-07-01','2027-06-30');
insert into app.league_seasons(id,league_id,season_id,status,published_at)values('52000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000002','published',clock_timestamp());
insert into app.clubs(id,name,short_name)values('52000000-0000-4000-8000-000000000004','Ranking Heim','RKH'),('52000000-0000-4000-8000-000000000005','Ranking Gast','RKG');
insert into app.league_season_clubs(league_season_id,club_id)values('52000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000004'),('52000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000005');
insert into app.matchdays(id,league_season_id,number,status)values('52000000-0000-4000-8000-000000000006','52000000-0000-4000-8000-000000000003',1,'completed');
insert into app.matches(id,matchday_id,home_club_id,away_club_id,kickoff_at,status)values('52000000-0000-4000-8000-000000000007','52000000-0000-4000-8000-000000000006','52000000-0000-4000-8000-000000000004','52000000-0000-4000-8000-000000000005','2026-07-01 12:00+00','completed');
set constraints all deferred;
insert into app.prediction_rounds(id,name,league_season_id,owner_membership_id,has_predictions)values('52000000-0000-4000-8000-000000000008','Ranking Runde','52000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000009',true);
insert into app.round_memberships(id,round_id,user_id,nickname,role)values
('52000000-0000-4000-8000-000000000009','52000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000003','Alpha','owner'),
('52000000-0000-4000-8000-000000000010','52000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000002','Beta','member'),
('52000000-0000-4000-8000-000000000011','52000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000001','Zeta','member');
insert into app.predictions(id,round_id,membership_id,match_id,home_goals,away_goals)values
('52000000-0000-4000-8000-000000000012','52000000-0000-4000-8000-000000000008','52000000-0000-4000-8000-000000000009','52000000-0000-4000-8000-000000000007',1,0),
('52000000-0000-4000-8000-000000000013','52000000-0000-4000-8000-000000000008','52000000-0000-4000-8000-000000000010','52000000-0000-4000-8000-000000000007',2,0),
('52000000-0000-4000-8000-000000000014','52000000-0000-4000-8000-000000000008','52000000-0000-4000-8000-000000000011','52000000-0000-4000-8000-000000000007',3,0);
insert into app.prediction_scores(prediction_id,round_id,membership_id,match_id,matchday_id,points,result_revision,calculation_version)values
('52000000-0000-4000-8000-000000000012','52000000-0000-4000-8000-000000000008','52000000-0000-4000-8000-000000000009','52000000-0000-4000-8000-000000000007','52000000-0000-4000-8000-000000000006',4,1,1),
('52000000-0000-4000-8000-000000000013','52000000-0000-4000-8000-000000000008','52000000-0000-4000-8000-000000000010','52000000-0000-4000-8000-000000000007','52000000-0000-4000-8000-000000000006',2,1,1),
('52000000-0000-4000-8000-000000000014','52000000-0000-4000-8000-000000000008','52000000-0000-4000-8000-000000000011','52000000-0000-4000-8000-000000000007','52000000-0000-4000-8000-000000000006',2,1,1);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);set local role authenticated;
select is((select array_agg(rank order by rank,nickname) from api.overall_ranking where round_id='52000000-0000-4000-8000-000000000008'),array[1,2,2],'overall ranking shares rank for equal points');
select is((select array_agg(nickname order by rank,nickname) from api.overall_ranking where round_id='52000000-0000-4000-8000-000000000008'),array['Alpha','Beta','Zeta']::text[],'ties display alphabetically');
select is((select array_agg(rank order by rank,nickname) from api.matchday_ranking where round_id='52000000-0000-4000-8000-000000000008'),array[1,2,2],'matchday ranking shares rank');
select is((select count(*) from api.overall_ranking where round_id='52000000-0000-4000-8000-000000000008' and is_current_user),1::bigint,'current member is marked once');reset role;
select * from finish();rollback;
