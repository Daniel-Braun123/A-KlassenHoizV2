begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(24);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
set local role authenticated;

select lives_ok(
  $$select api.create_club_simple('FC Eindeutig', 'https://example.test/fc.png')$$,
  'admin creates a global club with a logo URL'
);
select lives_ok($$select api.create_club_simple('SV Nord', null)$$, 'second club is created');
select lives_ok($$select api.create_club_simple('TSV Süd', null)$$, 'third club is created');
select lives_ok($$select api.create_club_simple('DJK West', null)$$, 'fourth club is created');
select throws_ok(
  $$select api.create_club_simple('fc eindeutig', null)$$,
  '23505', null, 'club names are globally case-insensitively unique'
);
select throws_ok(
  $$select api.create_club_simple('Logo Fehler', 'ftp://example.test/logo.png')$$,
  '23514', null, 'club logo URL only accepts HTTP URLs'
);

select lives_ok(
  $$select api.create_admin_league(
    'A-Klasse Nord', '26/27',
    array(select id from app.clubs where name in ('FC Eindeutig', 'SV Nord', 'TSV Süd', 'DJK West') order by name)
  )$$,
  'league, year and club selection are created atomically'
);
select lives_ok(
  $$select api.create_admin_league(
    'A-Klasse Nord', '27/28',
    array(select id from app.clubs where name in ('FC Eindeutig', 'SV Nord') order by name)
  )$$,
  'same league name is allowed in a different year'
);
select throws_ok(
  $$select api.create_admin_league(
    'a-klasse nord', '26/27',
    array(select id from app.clubs where name in ('FC Eindeutig', 'SV Nord') order by name)
  )$$,
  '23505', null, 'same league name and year are rejected'
);
select throws_ok(
  $$select api.create_admin_league(
    'Fehlerhafte Liga', '26/29',
    array(select id from app.clubs where name in ('FC Eindeutig', 'SV Nord') order by name)
  )$$,
  '22023', null, 'league years must be consecutive'
);

select is(
  (select count(*) from api.admin_leagues where name = 'A-Klasse Nord'),
  2::bigint,
  'admin sees drafts'
);
select lives_ok(
  $$select api.publish_admin_league(
    (select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'), 1
  )$$,
  'league publication is an explicit action'
);
select is(
  (select status::text from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'),
  'published', 'published state is visible to admin'
);

select lives_ok(
  $$select api.create_matchday_auto(
    (select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'),
    'first_leg'
  )$$,
  'first first-leg matchday is created automatically'
);
select lives_ok(
  $$select api.create_matchday_auto(
    (select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'),
    'first_leg'
  )$$,
  'second first-leg matchday is created automatically'
);
select lives_ok(
  $$select api.create_matchday_auto(
    (select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'),
    'second_leg'
  )$$,
  'first second-leg matchday is created automatically'
);
select results_eq(
  $$select phase::text, number::integer
    from app.matchdays
    where league_season_id = (
      select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'
    )
    order by phase, number$$,
  $$values ('first_leg', 1), ('first_leg', 2), ('second_leg', 1)$$,
  'first and second leg number independently from one'
);

select lives_ok(
  $$select api.create_match_simple(
    (select id from app.matchdays where phase = 'first_leg' and number = 1 and league_season_id = (
      select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'
    )),
    (select id from app.clubs where name = 'FC Eindeutig'),
    (select id from app.clubs where name = 'SV Nord'),
    clock_timestamp() + interval '1 hour'
  )$$,
  'a match is created from league clubs'
);
select throws_ok(
  $$select api.create_match_simple(
    (select id from app.matchdays where phase = 'first_leg' and number = 1 and league_season_id = (
      select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'
    )),
    (select id from app.clubs where name = 'SV Nord'),
    (select id from app.clubs where name = 'TSV Süd'),
    clock_timestamp() + interval '2 hours'
  )$$,
  '23514', null, 'a club can only play once per matchday'
);
select lives_ok(
  $$select api.create_match_simple(
    (select id from app.matchdays where phase = 'first_leg' and number = 2 and league_season_id = (
      select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'
    )),
    (select id from app.clubs where name = 'FC Eindeutig'),
    (select id from app.clubs where name = 'TSV Süd'),
    clock_timestamp() - interval '30 minutes'
  )$$,
  'a currently live match is created for status testing'
);
select is(
  (select display_status from api.admin_schedule
    where league_id = (
      select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'
    )
      and match_id is not null
      and kickoff_at < clock_timestamp()
      and kickoff_at > clock_timestamp() - interval '90 minutes'),
  'live', 'live status is derived between kickoff and minute ninety'
);
select throws_ok(
  $$select api.set_match_result(
    (select match_id from api.admin_schedule where league_id = (
      select id from api.admin_leagues where name = 'A-Klasse Nord' and year_label = '26/27'
    ) and kickoff_at > clock_timestamp()), 1, 0,
    'official'::app.result_decision, 1::smallint, 0::smallint, null::text
  )$$,
  '22023', null, 'results remain locked until ninety minutes after kickoff'
);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is(
  (select count(*) from api.admin_leagues where name = 'A-Klasse Nord'),
  1::bigint,
  'normal users only see published leagues'
);
select throws_ok(
  $$select api.create_club_simple('Nicht erlaubt', null)$$,
  '42501', null, 'normal users cannot mutate the global catalog'
);
reset role;

select * from finish();
rollback;
