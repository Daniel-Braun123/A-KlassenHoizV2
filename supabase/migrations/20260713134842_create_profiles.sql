create table app.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  app_role app.app_role not null default 'user',
  status app.profile_status not null default 'active',
  last_active_round_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint profiles_display_name_trimmed check (display_name = btrim(display_name)),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80)
);

create index profiles_status_role_idx on app.profiles (status, app_role);
create index profiles_last_active_round_id_idx on app.profiles (last_active_round_id)
where last_active_round_id is not null;

alter table app.profiles enable row level security;
alter table app.profiles force row level security;

create trigger profiles_set_updated_at
before update on app.profiles
for each row execute function private.set_updated_at();

create function private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_display_name text := pg_catalog.btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if pg_catalog.char_length(requested_display_name) not between 1 and 80 then
    requested_display_name := 'Freund ' || pg_catalog.left(new.id::text, 8);
  end if;

  insert into app.profiles (user_id, display_name)
  values (new.id, requested_display_name)
  on conflict (user_id) do nothing;

  return new;
end
$function$;

revoke all on function private.create_profile_for_auth_user() from public, anon, authenticated;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row execute function private.create_profile_for_auth_user();

insert into app.profiles (user_id, display_name)
select
  auth_user.id,
  case
    when pg_catalog.char_length(pg_catalog.btrim(coalesce(auth_user.raw_user_meta_data ->> 'display_name', ''))) between 1 and 80
      then pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'display_name')
    else 'Freund ' || pg_catalog.left(auth_user.id::text, 8)
  end
from auth.users as auth_user
on conflict (user_id) do nothing;

create policy profiles_select_own
on app.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_update_own
on app.profiles
for update
to authenticated
using ((select auth.uid()) = user_id and status = 'active')
with check (
  (select auth.uid()) = user_id
  and status = 'active'
);

create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app.profiles as profile
      where profile.user_id = (select auth.uid())
        and profile.app_role = 'app_admin'
        and profile.status = 'active'
    )
$function$;

comment on function private.is_app_admin() is
  'Canonical active app-admin check backed by the fresh V2 profile table.';

revoke all on table app.profiles from public, anon, authenticated;
grant select on table app.profiles to authenticated;
grant all on table app.profiles to service_role;
grant usage on schema app to authenticated, service_role;
revoke all on function private.is_app_admin() from public, anon;
grant execute on function private.is_app_admin() to authenticated, service_role;
