begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(17);

insert into app.leagues(id, name, short_name)
values ('56000000-0000-4000-8000-000000000001', 'Reschedule Liga', 'RSL');
insert into app.seasons(id, label, starts_on, ends_on)
values ('56000000-0000-4000-8000-000000000002', '26/27', '2026-07-01', '2027-06-30');
insert into app.league_seasons(id, league_id, season_id, status, published_at)
values ('56000000-0000-4000-8000-000000000003', '56000000-0000-4000-8000-000000000001',
  '56000000-0000-4000-8000-000000000002', 'published', clock_timestamp());
insert into app.clubs(id, name, short_name) values
  ('56000000-0000-4000-8000-000000000004', 'Reschedule Heim', 'RSH'),
  ('56000000-0000-4000-8000-000000000005', 'Reschedule Gast', 'RSG');
insert into app.league_season_clubs(league_season_id, club_id) values
  ('56000000-0000-4000-8000-000000000003', '56000000-0000-4000-8000-000000000004'),
  ('56000000-0000-4000-8000-000000000003', '56000000-0000-4000-8000-000000000005');
insert into app.matchdays(id, league_season_id, number, status, starts_on, ends_on)
values
  ('56000000-0000-4000-8000-000000000006', '56000000-0000-4000-8000-000000000003',
    1, 'published', '2026-07-01', '2026-07-02'),
  ('56000000-0000-4000-8000-000000000011', '56000000-0000-4000-8000-000000000003',
    2, 'published', '2026-07-01', '2026-07-02');
insert into app.matches(id, matchday_id, home_club_id, away_club_id, kickoff_at, status)
values ('56000000-0000-4000-8000-000000000007', '56000000-0000-4000-8000-000000000006',
  '56000000-0000-4000-8000-000000000004', '56000000-0000-4000-8000-000000000005',
  '2026-07-01T13:00:00Z', 'published');
set constraints all deferred;
insert into app.prediction_rounds(id, name, league_season_id, owner_membership_id, has_predictions)
values ('56000000-0000-4000-8000-000000000008', 'Reschedule Runde',
  '56000000-0000-4000-8000-000000000003', '56000000-0000-4000-8000-000000000009', true);
insert into app.round_memberships(id, round_id, user_id, nickname, role)
values ('56000000-0000-4000-8000-000000000009', '56000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000003', 'Reschedule Owner', 'owner');
insert into app.predictions(id, round_id, membership_id, match_id, home_goals, away_goals)
values ('56000000-0000-4000-8000-000000000010', '56000000-0000-4000-8000-000000000008',
  '56000000-0000-4000-8000-000000000009', '56000000-0000-4000-8000-000000000007', 2, 1);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select is(api.reschedule_match('56000000-0000-4000-8000-000000000007', 1, '2099-08-15T14:00:00Z'),
  2, 'admin reschedules a predicted fixture outside its original matchday period');
select is((select kickoff_at from app.matches where id = '56000000-0000-4000-8000-000000000007'),
  '2099-08-15T14:00:00Z'::timestamptz, 'new kickoff is stored');
select is((select matchday_id from app.matches where id = '56000000-0000-4000-8000-000000000007'),
  '56000000-0000-4000-8000-000000000006'::uuid, 'matchday assignment remains unchanged');
select is((select status::text from app.matches where id = '56000000-0000-4000-8000-000000000007'),
  'published', 'a confirmed new date remains playable and open for predictions');
select throws_ok($$select api.reschedule_match('56000000-0000-4000-8000-000000000007', 1, '2099-09-01T14:00:00Z')$$,
  'P0001', null, 'stale versions cannot overwrite the new kickoff');
select throws_ok($$select api.reschedule_match('56000000-0000-4000-8000-000000000007', 2, null)$$,
  '22023', null, 'missing kickoff is rejected');
select throws_ok($$select api.reschedule_match('56000000-0000-4000-8000-000000000007', 2, 'infinity')$$,
  '22023', null, 'infinite kickoff is rejected');
reset role;

select is((select home_goals::integer from app.predictions where id = '56000000-0000-4000-8000-000000000010'),
  2, 'existing home prediction is preserved');
select is((select away_goals::integer from app.predictions where id = '56000000-0000-4000-8000-000000000010'),
  1, 'existing away prediction is preserved');
select is((select count(*) from app.predictions where match_id = '56000000-0000-4000-8000-000000000007'),
  1::bigint, 'rescheduling keeps the existing prediction row');
select is((select count(*) from private.competition_change_audit
  where object_id = '56000000-0000-4000-8000-000000000007' and action = 'rescheduled'),
  1::bigint, 'rescheduling is audited exactly once');
select throws_ok($$insert into app.matches(matchday_id, home_club_id, away_club_id, kickoff_at)
  values ('56000000-0000-4000-8000-000000000011', '56000000-0000-4000-8000-000000000004',
    '56000000-0000-4000-8000-000000000005', '2099-08-15T14:00:00Z')$$,
  '23514', 'Kickoff must be inside the matchday period', 'new fixtures still obey the matchday period');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select throws_ok($$select api.reschedule_match('56000000-0000-4000-8000-000000000007', 2, '2099-09-01T14:00:00Z')$$,
  '42501', null, 'a round owner cannot reschedule global matches');
reset role;
select ok(not has_function_privilege('anon', 'api.reschedule_match(uuid,integer,timestamptz)', 'EXECUTE'),
  'anonymous users cannot call the rescheduling RPC');

insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
values ('56000000-0000-4000-8000-000000000007', 'official', 2, 1, 1,
  '00000000-0000-4000-8000-000000000004');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select throws_ok($$select api.reschedule_match('56000000-0000-4000-8000-000000000007', 2, '2099-09-01T14:00:00Z')$$,
  '22023', null, 'an official result prevents rescheduling');
reset role;
update app.match_results set decision = 'excluded', home_goals = null, away_goals = null
where match_id = '56000000-0000-4000-8000-000000000007';
set local role authenticated;
select throws_ok($$select api.reschedule_match('56000000-0000-4000-8000-000000000007', 2, '2099-09-01T14:00:00Z')$$,
  '22023', null, 'an excluded result also prevents rescheduling');
reset role;
select is((select version from app.matches where id = '56000000-0000-4000-8000-000000000007'),
  2, 'all rejected changes preserve the fixture version');

select * from finish();
rollback;
