begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(16);

select has_schema('app', 'app schema exists');
select has_schema('private', 'private schema exists');
select has_schema('api', 'api schema exists');
select has_type('app', 'app_role', 'V2 app role enum exists');
select has_type('app', 'profile_status', 'V2 profile status enum exists');
select has_type('app', 'match_status', 'V2 match status enum exists');
select has_type('app', 'round_role', 'V2 owner/member-only enum exists');

select ok(
  has_schema_privilege('anon', 'api', 'usage'),
  'anon receives API schema usage only through an explicit grant'
);
select ok(
  has_schema_privilege('authenticated', 'api', 'usage'),
  'authenticated receives API schema usage only through an explicit grant'
);
select ok(
  not has_schema_privilege('anon', 'app', 'usage')
    and has_schema_privilege('authenticated', 'app', 'usage'),
  'anon cannot use app; authenticated has only the usage required by security-invoker read models'
);
select ok(
  not has_schema_privilege('anon', 'private', 'usage')
    and not has_schema_privilege('authenticated', 'private', 'usage'),
  'browser roles cannot use the private schema'
);
select is(
  (
    select count(*)::bigint
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'api'
      and relation.relkind in ('r', 'p', 'f')
  ),
  0::bigint,
  'api contains no base tables'
);
select ok(
  not exists (
    select 1
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'app'
      and relation.relkind in ('r', 'p')
      and (not relation.relrowsecurity or not relation.relforcerowsecurity)
  ),
  'every app table enables and forces RLS'
);
select ok(
  not exists (
    select 1
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'api'
      and relation.relkind in ('v', 'm')
      and not coalesce(relation.reloptions, array[]::text[]) @> array['security_invoker=true']
  ),
  'every API view is security_invoker'
);
select ok(
  not exists (
    select 1
    from pg_proc as function
    join pg_namespace as namespace on namespace.oid = function.pronamespace
    cross join lateral aclexplode(
      coalesce(function.proacl, acldefault('f', function.proowner))
    ) as privilege
    where namespace.nspname = 'private'
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute private functions'
);
select ok(
  not exists (
    select 1
    from pg_default_acl as defaults
    cross join lateral aclexplode(defaults.defaclacl) as privilege
    join pg_namespace as namespace on namespace.oid = defaults.defaclnamespace
    where namespace.nspname in ('app', 'private', 'api')
      and privilege.grantee = 0
      and privilege.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXECUTE', 'USAGE')
  ),
  'new V2 objects do not inherit PUBLIC data or execute privileges'
);

select * from finish();
rollback;
