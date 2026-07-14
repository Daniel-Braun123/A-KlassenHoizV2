begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';

do $reset_preconditions$
declare
  actual text[];
  actual_count bigint;
begin
  if current_database() <> 'postgres' then
    raise exception 'Abort: unexpected database %', current_database();
  end if;

  select array_agg(c.relname order by c.relname)
    into actual
  from pg_catalog.pg_class as c
  join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S');

  if actual is distinct from array[
    'einladungen', 'ergebnis_aenderungen', 'ergebnisse', 'ligen',
    'mitgliedschaften', 'profiles', 'punktewertungen', 'spiele',
    'spieltage', 'teams', 'tipprunden', 'tipps'
  ]::text[] then
    raise exception 'Abort: public relation inventory changed: %', actual;
  end if;

  select array_agg(
           format('%I(%s)', p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
           order by p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)
         )
    into actual
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public';

  if actual is distinct from array[
    'enforce_team_name_unique_on_change()',
    'has_tipprunde_role(target_tipprunde_id uuid, allowed_roles tipprunde_rolle[])',
    'is_global_admin()',
    'is_tipprunde_member(target_tipprunde_id uuid)',
    'is_tipprunde_owner(target_tipprunde_id uuid)',
    'set_updated_at()'
  ]::text[] then
    raise exception 'Abort: public function inventory changed: %', actual;
  end if;

  select array_agg(t.typname order by t.typname)
    into actual
  from pg_catalog.pg_type as t
  join pg_catalog.pg_namespace as n on n.oid = t.typnamespace
  where n.nspname = 'public'
    and t.typtype = 'e';

  if actual is distinct from array[
    'einladung_status', 'mitgliedschaft_status', 'spiel_status',
    'spieltag_abschnitt', 'tipprunde_rolle', 'tipprunde_status', 'wertungstyp'
  ]::text[] then
    raise exception 'Abort: public enum inventory changed: %', actual;
  end if;

  select count(*) into actual_count
  from pg_catalog.pg_policies
  where schemaname = 'public';
  if actual_count <> 30 then
    raise exception 'Abort: expected 30 public policies, found %', actual_count;
  end if;

  select count(*) into actual_count
  from pg_catalog.pg_trigger as t
  join pg_catalog.pg_class as c on c.oid = t.tgrelid
  join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal;
  if actual_count <> 9 then
    raise exception 'Abort: expected 9 public triggers, found %', actual_count;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_namespace where nspname = 'private'
  ) then
    raise exception 'Abort: expected empty private schema is absent';
  end if;

  select count(*) into actual_count
  from pg_catalog.pg_class as c
  join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
  where n.nspname = 'private'
    and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S');
  if actual_count <> 0 then
    raise exception 'Abort: private schema is not empty';
  end if;

  select array_agg(
           format('%I(%s)', p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
           order by p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)
         )
    into actual
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'private';
  if actual is distinct from array[
    'has_tipprunde_role(target_tipprunde_id uuid, allowed_roles tipprunde_rolle[])',
    'is_global_admin()',
    'is_tipprunde_member(target_tipprunde_id uuid)',
    'is_tipprunde_owner(target_tipprunde_id uuid)'
  ]::text[] then
    raise exception 'Abort: private function inventory changed: %', actual;
  end if;

  select count(*) into actual_count from auth.users;
  if actual_count <> 2 then raise exception 'Abort: expected 2 auth users, found %', actual_count; end if;
  select count(*) into actual_count from auth.sessions;
  if actual_count <> 7 then raise exception 'Abort: expected 7 auth sessions, found %', actual_count; end if;
  select count(*) into actual_count from auth.identities;
  if actual_count <> 2 then raise exception 'Abort: expected 2 auth identities, found %', actual_count; end if;
  select count(*) into actual_count from auth.refresh_tokens;
  if actual_count <> 10 then raise exception 'Abort: expected 10 refresh tokens, found %', actual_count; end if;

  select count(*) into actual_count from storage.buckets;
  if actual_count <> 0 then raise exception 'Abort: storage buckets appeared: %', actual_count; end if;
  select count(*) into actual_count from storage.objects;
  if actual_count <> 0 then raise exception 'Abort: storage objects appeared: %', actual_count; end if;

  select array_agg(version order by version)
    into actual
  from supabase_migrations.schema_migrations;
  if actual is distinct from array[
    '001', '20260703135907', '20260703141322', '20260704172407'
  ]::text[] then
    raise exception 'Abort: migration inventory changed: %', actual;
  end if;
end
$reset_preconditions$;

drop table
  public.einladungen,
  public.ergebnis_aenderungen,
  public.ergebnisse,
  public.ligen,
  public.mitgliedschaften,
  public.profiles,
  public.punktewertungen,
  public.spiele,
  public.spieltage,
  public.teams,
  public.tipprunden,
  public.tipps
cascade;

drop function public.enforce_team_name_unique_on_change();
drop function public.has_tipprunde_role(uuid, public.tipprunde_rolle[]);
drop function public.is_global_admin();
drop function public.is_tipprunde_member(uuid);
drop function public.is_tipprunde_owner(uuid);
drop function public.set_updated_at();

drop schema private cascade;

drop type public.einladung_status;
drop type public.mitgliedschaft_status;
drop type public.spiel_status;
drop type public.spieltag_abschnitt;
drop type public.tipprunde_rolle;
drop type public.tipprunde_status;
drop type public.wertungstyp;

do $delete_auth_users$
declare
  deleted_users bigint;
begin
  delete from auth.users;
  get diagnostics deleted_users = row_count;
  if deleted_users <> 2 then
    raise exception 'Abort: expected to delete 2 auth users, deleted %', deleted_users;
  end if;
end
$delete_auth_users$;

do $delete_migration_history$
declare
  deleted_migrations bigint;
begin
  delete from supabase_migrations.schema_migrations
  where version in ('001', '20260703135907', '20260703141322', '20260704172407');
  get diagnostics deleted_migrations = row_count;
  if deleted_migrations <> 4 then
    raise exception 'Abort: expected to delete 4 migration rows, deleted %', deleted_migrations;
  end if;
end
$delete_migration_history$;

do $reset_postconditions$
declare
  actual_count bigint;
begin
  select count(*) into actual_count
  from pg_catalog.pg_class as c
  join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S');
  if actual_count <> 0 then raise exception 'Abort: public relations remain: %', actual_count; end if;

  select count(*) into actual_count
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public';
  if actual_count <> 0 then raise exception 'Abort: public functions remain: %', actual_count; end if;

  select count(*) into actual_count
  from pg_catalog.pg_type as t
  join pg_catalog.pg_namespace as n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typtype = 'e';
  if actual_count <> 0 then raise exception 'Abort: public enums remain: %', actual_count; end if;

  if exists (select 1 from pg_catalog.pg_namespace where nspname = 'private') then
    raise exception 'Abort: private schema remains';
  end if;

  select count(*) into actual_count from auth.users;
  if actual_count <> 0 then raise exception 'Abort: auth users remain: %', actual_count; end if;
  select count(*) into actual_count from auth.sessions;
  if actual_count <> 0 then raise exception 'Abort: auth sessions remain: %', actual_count; end if;
  select count(*) into actual_count from auth.identities;
  if actual_count <> 0 then raise exception 'Abort: auth identities remain: %', actual_count; end if;
  select count(*) into actual_count from auth.refresh_tokens;
  if actual_count <> 0 then raise exception 'Abort: refresh tokens remain: %', actual_count; end if;
  select count(*) into actual_count from storage.buckets;
  if actual_count <> 0 then raise exception 'Abort: storage buckets remain: %', actual_count; end if;
  select count(*) into actual_count from storage.objects;
  if actual_count <> 0 then raise exception 'Abort: storage objects remain: %', actual_count; end if;
  select count(*) into actual_count from supabase_migrations.schema_migrations;
  if actual_count <> 0 then raise exception 'Abort: migration history remains: %', actual_count; end if;
end
$reset_postconditions$;

commit;

select jsonb_build_object(
  'status', 'old_application_state_deleted',
  'public_relations', 0,
  'public_functions', 0,
  'public_enums', 0,
  'auth_users', 0,
  'auth_sessions', 0,
  'auth_identities', 0,
  'auth_refresh_tokens', 0,
  'storage_buckets', 0,
  'storage_objects', 0,
  'migration_rows', 0
) as reset_result;
