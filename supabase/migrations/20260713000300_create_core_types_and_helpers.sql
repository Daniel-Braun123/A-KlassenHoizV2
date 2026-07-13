create type app.app_role as enum ('user', 'app_admin');
create type app.profile_status as enum ('active', 'deletion_pending', 'disabled');
create type app.catalog_status as enum ('draft', 'active', 'archived');
create type app.league_season_status as enum ('draft', 'published', 'completed', 'archived');
create type app.club_status as enum ('active', 'archived');
create type app.league_season_club_status as enum ('active', 'withdrawn');
create type app.matchday_status as enum ('draft', 'published', 'completed', 'archived');
create type app.match_status as enum (
  'draft',
  'published',
  'postponed',
  'cancelled',
  'completed',
  'abandoned'
);
create type app.result_decision as enum ('official', 'excluded');
create type app.round_status as enum ('active', 'archived');
create type app.round_role as enum ('owner', 'member');
create type app.membership_status as enum ('active', 'left', 'removed', 'anonymized');

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end
$function$;

create function private.is_app_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and coalesce((select auth.jwt() -> 'app_metadata' ->> 'app_role') = 'app_admin', false)
$function$;

comment on function private.is_app_admin() is
  'Bootstrap app-admin check using trusted app_metadata; replaced by the fresh V2 profile policy in US1.';

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.is_app_admin() from public, anon;
grant execute on function private.is_app_admin() to authenticated, service_role;
