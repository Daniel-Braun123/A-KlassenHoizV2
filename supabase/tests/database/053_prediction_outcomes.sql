begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(9);

select has_column('api', 'matchday_prediction_sheet', 'prediction_points', 'prediction sheet exposes personal points');
select has_column('api', 'matchday_prediction_sheet', 'result_decision', 'prediction sheet exposes the official decision');
select is(
  (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'api.matchday_prediction_sheet'::regclass),
  true,
  'prediction sheet keeps invoker security'
);

insert into app.leagues(id, name, short_name)
values ('53000000-0000-4000-8000-000000000001', 'Outcome Liga', 'OL');
insert into app.seasons(id, label, starts_on, ends_on)
values ('53000000-0000-4000-8000-000000000002', '26/27', '2026-07-01', '2027-06-30');
insert into app.league_seasons(id, league_id, season_id, status, published_at)
values (
  '53000000-0000-4000-8000-000000000003',
  '53000000-0000-4000-8000-000000000001',
  '53000000-0000-4000-8000-000000000002',
  'published',
  clock_timestamp()
);
insert into app.clubs(id, name, short_name)
values
  ('53000000-0000-4000-8000-000000000004', 'Outcome Heim', 'OH'),
  ('53000000-0000-4000-8000-000000000005', 'Outcome Gast', 'OG');
insert into app.league_season_clubs(league_season_id, club_id)
values
  ('53000000-0000-4000-8000-000000000003', '53000000-0000-4000-8000-000000000004'),
  ('53000000-0000-4000-8000-000000000003', '53000000-0000-4000-8000-000000000005');
insert into app.matchdays(id, league_season_id, number, status)
values ('53000000-0000-4000-8000-000000000006', '53000000-0000-4000-8000-000000000003', 1, 'completed');
insert into app.matches(id, matchday_id, home_club_id, away_club_id, kickoff_at, status)
values (
  '53000000-0000-4000-8000-000000000007',
  '53000000-0000-4000-8000-000000000006',
  '53000000-0000-4000-8000-000000000004',
  '53000000-0000-4000-8000-000000000005',
  '2026-07-01 12:00+00',
  'completed'
);
set constraints all deferred;
insert into app.prediction_rounds(id, name, league_season_id, owner_membership_id, has_predictions)
values (
  '53000000-0000-4000-8000-000000000008',
  'Outcome Runde',
  '53000000-0000-4000-8000-000000000003',
  '53000000-0000-4000-8000-000000000009',
  true
);
insert into app.round_memberships(id, round_id, user_id, nickname, role)
values
  (
    '53000000-0000-4000-8000-000000000009',
    '53000000-0000-4000-8000-000000000008',
    '00000000-0000-4000-8000-000000000003',
    'Outcome Owner',
    'owner'
  ),
  (
    '53000000-0000-4000-8000-000000000010',
    '53000000-0000-4000-8000-000000000008',
    '00000000-0000-4000-8000-000000000002',
    'Outcome Member',
    'member'
  );
insert into app.predictions(id, round_id, membership_id, match_id, home_goals, away_goals)
values
  (
    '53000000-0000-4000-8000-000000000011',
    '53000000-0000-4000-8000-000000000008',
    '53000000-0000-4000-8000-000000000009',
    '53000000-0000-4000-8000-000000000007',
    2,
    1
  ),
  (
    '53000000-0000-4000-8000-000000000012',
    '53000000-0000-4000-8000-000000000008',
    '53000000-0000-4000-8000-000000000010',
    '53000000-0000-4000-8000-000000000007',
    3,
    1
  );
insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
values (
  '53000000-0000-4000-8000-000000000007',
  'official',
  2,
  1,
  1,
  '00000000-0000-4000-8000-000000000004'
);
insert into app.prediction_scores(
  prediction_id,
  round_id,
  membership_id,
  match_id,
  matchday_id,
  points,
  result_revision,
  calculation_version
)
values
  (
    '53000000-0000-4000-8000-000000000011',
    '53000000-0000-4000-8000-000000000008',
    '53000000-0000-4000-8000-000000000009',
    '53000000-0000-4000-8000-000000000007',
    '53000000-0000-4000-8000-000000000006',
    4,
    1,
    1
  ),
  (
    '53000000-0000-4000-8000-000000000012',
    '53000000-0000-4000-8000-000000000008',
    '53000000-0000-4000-8000-000000000010',
    '53000000-0000-4000-8000-000000000007',
    '53000000-0000-4000-8000-000000000006',
    2,
    1,
    1
  );

select tests.authenticate_as('owner');
set local role authenticated;
select is(
  (select prediction_points from api.matchday_prediction_sheet where round_id = '53000000-0000-4000-8000-000000000008'),
  4::smallint,
  'owner sees only the own points'
);
select is(
  (select result_home_goals from api.matchday_prediction_sheet where round_id = '53000000-0000-4000-8000-000000000008'),
  2::smallint,
  'owner sees the official result'
);
select is(
  (select result_revision_no from api.matchday_prediction_sheet where round_id = '53000000-0000-4000-8000-000000000008'),
  1,
  'owner sees the result revision'
);
select is(
  (select result_is_correction from api.matchday_prediction_sheet where round_id = '53000000-0000-4000-8000-000000000008'),
  false,
  'first result is not marked as a correction'
);
reset role;

select tests.authenticate_as('member');
set local role authenticated;
select is(
  (select prediction_points from api.matchday_prediction_sheet where round_id = '53000000-0000-4000-8000-000000000008'),
  2::smallint,
  'member sees only the own points'
);
reset role;

select tests.authenticate_as('nonmember');
set local role authenticated;
select is(
  (select count(*) from api.matchday_prediction_sheet where round_id = '53000000-0000-4000-8000-000000000008'),
  0::bigint,
  'nonmember sees no private prediction outcome'
);
reset role;

select * from finish();
rollback;
