create table private.support_access_grants(
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references app.prediction_rounds(id) on delete cascade,
  granted_to uuid not null references app.profiles(user_id),
  case_reference text not null check(case_reference=btrim(case_reference) and char_length(case_reference) between 3 and 80),
  reason text not null check(reason=btrim(reason) and char_length(reason) between 10 and 500),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint support_grant_duration check(expires_at>created_at and expires_at<=created_at+interval '15 minutes')
);
create index support_access_active_idx on private.support_access_grants(granted_to,expires_at) where revoked_at is null;

create table app.admin_access_events(
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  action text not null check(action in('support_grant_created','support_metadata_read','support_grant_revoked')),
  grant_id uuid not null,
  object_id uuid not null,
  occurred_at timestamptz not null default clock_timestamp()
);

revoke all on private.support_access_grants from public,anon,authenticated;
grant all on private.support_access_grants to service_role;
alter table app.admin_access_events enable row level security;alter table app.admin_access_events force row level security;
create policy admin_access_events_own_read on app.admin_access_events for select to authenticated using((select private.is_app_admin()) and actor_id=(select auth.uid()));
revoke all on app.admin_access_events from public,anon,authenticated;
grant select on app.admin_access_events to authenticated,service_role;
