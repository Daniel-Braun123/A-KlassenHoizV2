begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(8);

select tests.authenticate_as('app_admin');
set local role authenticated;
select lives_ok($$select api.create_league('A-Klasse Test', 'AKT')$$, 'app admin creates a league through RPC');
select is((select count(*) from app.leagues where name='A-Klasse Test'), 1::bigint, 'app admin reads the created draft catalog row');
reset role;

select tests.authenticate_as('member');
set local role authenticated;
select throws_ok($$select api.create_league('Verboten', null)$$, '42501', null, 'member cannot mutate global catalog');
select is((select count(*) from app.leagues where name='A-Klasse Test'), 0::bigint, 'member cannot read the created draft catalog row');
select ok(not has_table_privilege('authenticated', 'app.leagues', 'INSERT'), 'no direct insert grant');
select ok(not has_table_privilege('authenticated', 'app.leagues', 'UPDATE'), 'no direct update grant');
select ok(not has_table_privilege('authenticated', 'app.leagues', 'DELETE'), 'no direct delete grant');
select ok(has_function_privilege('authenticated', 'api.create_league(text,text)', 'EXECUTE'), 'RPC is the only mutation boundary');
reset role;

select * from finish();
rollback;
