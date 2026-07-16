begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(11);

select tests.authenticate_as('app_admin');
set local role authenticated;
select lives_ok($$select api.create_club_simple('RLS Heim', null)$$, 'app admin creates the first global club');
select lives_ok($$select api.create_club_simple('RLS Gast', null)$$, 'app admin creates the second global club');
select lives_ok(
  $$select api.create_admin_league('A-Klasse Test', '26/27', array(select id from app.clubs where name like 'RLS %'))$$,
  'app admin creates a complete league through the atomic RPC'
);
select is((select count(*) from api.admin_leagues where name='A-Klasse Test'), 1::bigint, 'app admin reads the created draft league');
reset role;

select tests.authenticate_as('member');
set local role authenticated;
select throws_ok($$select api.create_club_simple('Verboten', null)$$, '42501', null, 'member cannot mutate global catalog');
select is((select count(*) from app.leagues where name='A-Klasse Test'), 0::bigint, 'member cannot read the created draft catalog row');
select ok(not has_table_privilege('authenticated', 'app.leagues', 'INSERT'), 'no direct insert grant');
select ok(not has_table_privilege('authenticated', 'app.leagues', 'UPDATE'), 'no direct update grant');
select ok(not has_table_privilege('authenticated', 'app.leagues', 'DELETE'), 'no direct delete grant');
select ok(has_function_privilege('authenticated', 'api.create_admin_league(text,text,uuid[])', 'EXECUTE'), 'simplified RPC is the mutation boundary');
select ok(not has_function_privilege('authenticated', 'api.create_league(text,text)', 'EXECUTE'), 'obsolete multi-step RPC is retired');
reset role;

select * from finish();
rollback;
