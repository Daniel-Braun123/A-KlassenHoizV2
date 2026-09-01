begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(18);

select has_column('app', 'league_seasons', 'external_competition_id', 'league stores the BFV competition id');
select has_column('app', 'league_seasons', 'external_document_date', 'league stores the BFV document date');
select has_column('app', 'matchdays', 'external_matchday_id', 'matchdays store stable BFV ids');
select has_column('app', 'matches', 'external_match_id', 'matches store stable BFV ids');
select has_column('app', 'matches', 'source_marked_changed', 'source changes are retained for admin review');
select has_column('api', 'admin_schedule', 'external_match_id', 'admin schedule exposes BFV ids');
select has_column('api', 'admin_schedule', 'source_marked_changed', 'admin schedule exposes source change markers');
select has_function(
  'api',
  'import_bfv_schedule',
  array['uuid', 'text', 'text', 'date', 'jsonb', 'jsonb'],
  'secured BFV schedule import RPC exists'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
set local role authenticated;

select lives_ok($$select api.create_club_simple('BFV Test Heim', null)$$, 'admin creates home club');
select lives_ok($$select api.create_club_simple('BFV Test Gast', null)$$, 'admin creates away club');
select lives_ok(
  $$select api.create_admin_league(
    'BFV Import Test',
    '26/27',
    array(select id from app.clubs where name in ('BFV Test Heim', 'BFV Test Gast') order by name)
  )$$,
  'admin creates the target league'
);

select results_eq(
  $$select * from api.import_bfv_schedule(
    (select id from api.admin_leagues where name = 'BFV Import Test' and year_label = '26/27'),
    '312541',
    '26/27',
    '2026-08-31',
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:ST1',
      'sourceNumber', 1,
      'phase', 'first_leg',
      'phaseNumber', 1,
      'startsOn', '2026-07-24',
      'endsOn', '2026-07-24'
    )),
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:312540001',
      'externalMatchdayId', '312541:26/27:ST1',
      'homeClubId', (select id from app.clubs where name = 'BFV Test Heim'),
      'awayClubId', (select id from app.clubs where name = 'BFV Test Gast'),
      'kickoffAt', '2026-07-24T17:00:00.000Z',
      'existingMatchId', null,
      'expectedVersion', null,
      'sourceMarkedChanged', false
    ))
  )$$,
  $$values (1, 0, 1, 0, 0)$$,
  'first import creates one matchday and one match'
);
select is(
  (select count(*) from app.matches m join app.matchdays md on md.id = m.matchday_id
    where md.league_season_id = (select id from api.admin_leagues where name = 'BFV Import Test')),
  1::bigint,
  'the imported schedule contains exactly one match'
);
select is(
  (select external_source || ':' || external_competition_id from app.league_seasons
    where id = (select id from api.admin_leagues where name = 'BFV Import Test')),
  'bfv:312541',
  'the league is linked to the BFV source'
);

select results_eq(
  $$select * from api.import_bfv_schedule(
    (select id from api.admin_leagues where name = 'BFV Import Test' and year_label = '26/27'),
    '312541', '26/27', '2026-08-31',
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:ST1', 'sourceNumber', 1, 'phase', 'first_leg',
      'phaseNumber', 1, 'startsOn', '2026-07-24', 'endsOn', '2026-07-24'
    )),
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:312540001', 'externalMatchdayId', '312541:26/27:ST1',
      'homeClubId', (select id from app.clubs where name = 'BFV Test Heim'),
      'awayClubId', (select id from app.clubs where name = 'BFV Test Gast'),
      'kickoffAt', '2026-07-24T17:00:00.000Z', 'existingMatchId', null,
      'expectedVersion', null, 'sourceMarkedChanged', false
    ))
  )$$,
  $$values (0, 0, 0, 0, 1)$$,
  'repeating the same import is idempotent'
);

select results_eq(
  $$select * from api.import_bfv_schedule(
    (select id from api.admin_leagues where name = 'BFV Import Test' and year_label = '26/27'),
    '312541', '26/27', '2026-09-01',
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:ST1', 'sourceNumber', 1, 'phase', 'first_leg',
      'phaseNumber', 1, 'startsOn', '2026-07-24', 'endsOn', '2026-07-24'
    )),
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:312540001', 'externalMatchdayId', '312541:26/27:ST1',
      'homeClubId', (select id from app.clubs where name = 'BFV Test Heim'),
      'awayClubId', (select id from app.clubs where name = 'BFV Test Gast'),
      'kickoffAt', '2026-07-24T18:00:00.000Z', 'existingMatchId', null,
      'expectedVersion', null, 'sourceMarkedChanged', true
    ))
  )$$,
  $$values (0, 0, 0, 1, 0)$$,
  'a changed kickoff updates the existing match'
);

reset role;
insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
select m.id, 'official', 1, 0, 1, '00000000-0000-4000-8000-000000000004'
from app.matches m
where m.external_match_id = '312541:26/27:312540001';
set local role authenticated;

select throws_ok(
  $$select * from api.import_bfv_schedule(
    (select id from api.admin_leagues where name = 'BFV Import Test' and year_label = '26/27'),
    '312541', '26/27', '2026-09-01',
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:ST1', 'sourceNumber', 1, 'phase', 'first_leg',
      'phaseNumber', 1, 'startsOn', '2026-07-24', 'endsOn', '2026-07-24'
    )),
    jsonb_build_array(jsonb_build_object(
      'externalId', '312541:26/27:312540001', 'externalMatchdayId', '312541:26/27:ST1',
      'homeClubId', (select id from app.clubs where name = 'BFV Test Heim'),
      'awayClubId', (select id from app.clubs where name = 'BFV Test Gast'),
      'kickoffAt', '2026-07-24T19:00:00.000Z', 'existingMatchId', null,
      'expectedVersion', null, 'sourceMarkedChanged', true
    ))
  )$$,
  '22023',
  'BFV change is blocked by existing predictions or results',
  'results protect visible match data from later source changes'
);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select throws_ok(
  $$select * from api.import_bfv_schedule(
    (select id from app.league_seasons where external_competition_id = '312541'),
    '312541', '26/27', '2026-09-01', '[]'::jsonb, '[]'::jsonb
  )$$,
  '42501',
  'App admin required',
  'normal users cannot import a BFV schedule'
);
reset role;

select * from finish();
rollback;
