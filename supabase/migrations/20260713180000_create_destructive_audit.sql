create table private.destructive_audit_events(
  id bigint generated always as identity primary key,
  action text not null check(action in('round_hard_deleted')),
  actor_id uuid not null,
  object_id uuid not null,
  occurred_at timestamptz not null default clock_timestamp()
);
revoke all on private.destructive_audit_events from public,anon,authenticated;
grant select,insert on private.destructive_audit_events to service_role;
