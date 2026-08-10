begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(5);

select has_view('api', 'round_overview', 'round overview is exposed');
select is(
  (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'api.round_overview'::regclass),
  true,
  'round overview keeps invoker security'
);

insert into app.leagues(id, name, short_name)
values ('54000000-0000-4000-8000-000000000001', 'Overview Liga', 'OVL');
insert into app.seasons(id, label, starts_on, ends_on)
values (
  '54000000-0000-4000-8000-000000000002',
  'Testjahr',
  current_date - 365,
  current_date + 365
);
insert into app.league_seasons(id, league_id, season_id, status, published_at)
values (
  '54000000-0000-4000-8000-000000000003',
  '54000000-0000-4000-8000-000000000001',
  '54000000-0000-4000-8000-000000000002',
  'published',
  clock_timestamp()
);
insert into app.clubs(id, name, short_name)
values
  ('54000000-0000-4000-8000-000000000004', 'Overview Heim', 'OVH'),
  ('54000000-0000-4000-8000-000000000005', 'Overview Gast', 'OVG');
insert into app.league_season_clubs(league_season_id, club_id)
values
  ('54000000-0000-4000-8000-000000000003', '54000000-0000-4000-8000-000000000004'),
  ('54000000-0000-4000-8000-000000000003', '54000000-0000-4000-8000-000000000005');
insert into app.matchdays(id, league_season_id, number, status, starts_on, ends_on)
values
  (
    '54000000-0000-4000-8000-000000000006',
    '54000000-0000-4000-8000-000000000003',
    1,
    'completed',
    current_date - 1,
    current_date
  ),
  (
    '54000000-0000-4000-8000-000000000012',
    '54000000-0000-4000-8000-000000000003',
    2,
    'published',
    current_date,
    current_date + 1
  );
insert into app.matches(id, matchday_id, home_club_id, away_club_id, kickoff_at, status)
values
  (
    '54000000-0000-4000-8000-000000000007',
    '54000000-0000-4000-8000-000000000006',
    '54000000-0000-4000-8000-000000000004',
    '54000000-0000-4000-8000-000000000005',
    clock_timestamp() - interval '2 hours',
    'completed'
  ),
  (
    '54000000-0000-4000-8000-000000000008',
    '54000000-0000-4000-8000-000000000012',
    '54000000-0000-4000-8000-000000000005',
    '54000000-0000-4000-8000-000000000004',
    clock_timestamp() + interval '2 hours',
    'published'
  );

set constraints all deferred;
insert into app.prediction_rounds(id, name, league_season_id, owner_membership_id, has_predictions)
values (
  '54000000-0000-4000-8000-000000000009',
  'Overview Runde',
  '54000000-0000-4000-8000-000000000003',
  '54000000-0000-4000-8000-000000000010',
  true
);
insert into app.round_memberships(id, round_id, user_id, nickname, role)
values (
  '54000000-0000-4000-8000-000000000010',
  '54000000-0000-4000-8000-000000000009',
  '00000000-0000-4000-8000-000000000003',
  'Overview Owner',
  'owner'
);
insert into app.predictions(id, round_id, membership_id, match_id, home_goals, away_goals)
values (
  '54000000-0000-4000-8000-000000000011',
  '54000000-0000-4000-8000-000000000009',
  '54000000-0000-4000-8000-000000000010',
  '54000000-0000-4000-8000-000000000007',
  1,
  0
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000003',
  true
);
set local role authenticated;
select is(
  (select total_matches from api.round_overview where round_id = '54000000-0000-4000-8000-000000000009'),
  1,
  'only a future published match counts toward the next tip action'
);
select is(
  (select predicted_matches from api.round_overview where round_id = '54000000-0000-4000-8000-000000000009'),
  0,
  'a prediction for a past match does not reduce the open prediction count'
);
select is(
  (
    select next_kickoff_at > clock_timestamp()
    from api.round_overview
    where round_id = '54000000-0000-4000-8000-000000000009'
  ),
  true,
  'next kickoff remains the next future match'
);
reset role;

select * from finish();
rollback;
