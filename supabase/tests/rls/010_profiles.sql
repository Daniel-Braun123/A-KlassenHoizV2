begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(17);

select has_table('app', 'profiles', 'fresh V2 profile table exists');
select is(
  (select relrowsecurity from pg_class where oid = 'app.profiles'::regclass),
  true,
  'profile RLS is enabled'
);
select is(
  (select relforcerowsecurity from pg_class where oid = 'app.profiles'::regclass),
  true,
  'profile RLS is forced'
);
select policies_are(
  'app',
  'profiles',
  array['profiles_select_own', 'profiles_update_own'],
  'profiles expose only own-row select/update policies'
);
select has_view('api', 'my_profile', 'own-profile security-invoker read model exists');
select view_owner_is('api', 'my_profile', 'postgres', 'profile view has the reviewed owner');
select ok(
  (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'api.my_profile'::regclass),
  'profile view invokes caller security'
);
select function_privs_are(
  'api',
  'update_my_profile',
  array['text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated may execute only the profile update RPC'
);
select is(
  (select count(*) from app.profiles where user_id = '00000000-0000-4000-8000-000000000002'::uuid),
  1::bigint,
  'synthetic member receives a profile from the auth trigger backfill'
);
select is(
  (select app_role::text from app.profiles where user_id = '00000000-0000-4000-8000-000000000003'::uuid),
  'user',
  'untrusted seed metadata never self-provisions app admin'
);
select is(
  (select app_role::text from app.profiles where user_id = '00000000-0000-4000-8000-000000000004'::uuid),
  'app_admin',
  'local app admin is provisioned by the explicit trusted seed operation'
);
select ok(
  not has_table_privilege('anon', 'app.profiles', 'SELECT')
    and not has_table_privilege('authenticated', 'app.profiles', 'INSERT')
    and not has_table_privilege('authenticated', 'app.profiles', 'DELETE'),
  'browser roles have no direct profile table grants'
);
select ok(
  has_schema_privilege('authenticated', 'app', 'USAGE')
    and has_table_privilege('authenticated', 'app.profiles', 'SELECT')
    and not has_table_privilege('authenticated', 'app.profiles', 'INSERT')
    and not has_table_privilege('authenticated', 'app.profiles', 'UPDATE')
    and not has_table_privilege('authenticated', 'app.profiles', 'DELETE'),
  'security-invoker profile reads have minimal underlying grants and no direct mutation grant'
);

set local role authenticated;
select tests.authenticate_as('member');
select is(
  (select count(*) from app.profiles),
  1::bigint,
  'member sees exactly the own profile'
);
select is(
  (select count(*) from app.profiles where user_id = tests.actor_id('owner')),
  0::bigint,
  'member cannot read a foreign profile'
);

select tests.authenticate_as('app_admin');
select is(
  (select count(*) from app.profiles),
  1::bigint,
  'app admin receives no profile directory and sees only the own profile'
);

select tests.authenticate_as('disabled');
select is(
  (select count(*) from app.profiles),
  1::bigint,
  'disabled actor retains only the own minimal profile read'
);
reset role;

select * from finish();
rollback;
