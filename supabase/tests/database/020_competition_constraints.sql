begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(12);

select has_table('app', 'leagues', 'leagues exist');
select has_table('app', 'seasons', 'seasons exist');
select has_table('app', 'league_seasons', 'league seasons exist');
select has_table('app', 'clubs', 'clubs exist');
select has_table('app', 'matchdays', 'matchdays exist');
select has_table('app', 'matches', 'matches exist');
select has_table('app', 'match_results', 'results exist');
select has_table('app', 'result_revisions', 'result revisions exist');
select col_is_pk('app', 'match_results', 'match_id', 'one result per match');
select is((select relrowsecurity from pg_class where oid = 'app.matches'::regclass), true, 'match RLS enabled');
select is((select relforcerowsecurity from pg_class where oid = 'app.matches'::regclass), true, 'match RLS forced');
select throws_ok(
  $$insert into app.seasons(label, starts_on, ends_on) values ('invalid', '2027-06-01', '2026-07-01')$$,
  '23514', null, 'season date order is enforced'
);
select * from finish();
rollback;
