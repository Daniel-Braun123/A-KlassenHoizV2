select n.nspname as schema_name
from pg_catalog.pg_namespace as n
where n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by n.nspname;

select 'auth_users' as metric, count(*)::bigint as value from auth.users
union all
select 'auth_sessions', count(*)::bigint from auth.sessions
union all
select 'storage_buckets', count(*)::bigint from storage.buckets
union all
select 'storage_objects', count(*)::bigint from storage.objects
union all
select 'migration_rows', count(*)::bigint from supabase_migrations.schema_migrations
order by metric;

select n.nspname as schema_name,
       c.relname as object_name,
       case c.relkind
         when 'r' then 'table'
         when 'p' then 'partitioned_table'
         when 'v' then 'view'
         when 'm' then 'materialized_view'
         when 'S' then 'sequence'
         when 'f' then 'foreign_table'
         else c.relkind::text
       end as object_type
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
order by object_type, object_name;

select n.nspname as schema_name,
       p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'public'
order by function_name, arguments;

select n.nspname as schema_name,
       p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'private'
order by function_name, arguments;

select schemaname,
       tablename,
       policyname,
       cmd
from pg_catalog.pg_policies
where schemaname = 'public'
order by tablename, policyname;
