select jsonb_build_object(
  'database', current_database(),
  'public_relations', (
    select count(*)
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
  ),
  'public_functions', (
    select count(*)
    from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
  ),
  'public_enums', (
    select count(*)
    from pg_catalog.pg_type as t
    join pg_catalog.pg_namespace as n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  ),
  'public_policies', (select count(*) from pg_catalog.pg_policies where schemaname = 'public'),
  'private_schema_exists', exists(
    select 1 from pg_catalog.pg_namespace where nspname = 'private'
  ),
  'auth_users', (select count(*) from auth.users),
  'auth_sessions', (select count(*) from auth.sessions),
  'auth_identities', (select count(*) from auth.identities),
  'auth_refresh_tokens', (select count(*) from auth.refresh_tokens),
  'storage_buckets', (select count(*) from storage.buckets),
  'storage_objects', (select count(*) from storage.objects),
  'migration_rows', (select count(*) from supabase_migrations.schema_migrations),
  'protected_schemas', (
    select jsonb_agg(nspname order by nspname)
    from pg_catalog.pg_namespace
    where nspname in (
      'auth', 'extensions', 'graphql', 'graphql_public', 'pgbouncer',
      'realtime', 'storage', 'supabase_migrations', 'vault'
    )
  )
) as verification;
