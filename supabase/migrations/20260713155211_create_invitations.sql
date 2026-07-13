create table private.invitations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references app.prediction_rounds(id) on delete cascade,
  token_hash bytea not null,
  created_by_membership_id uuid not null references app.round_memberships(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  constraint invitations_token_hash_sha256 check (octet_length(token_hash) = 32),
  constraint invitations_expiry_after_creation check (expires_at > created_at)
);
create unique index invitations_token_hash_unique on private.invitations(token_hash);
create unique index invitations_one_active_per_round_idx on private.invitations(round_id) where revoked_at is null;
create index invitations_created_by_membership_id_idx on private.invitations(created_by_membership_id);
create index invitations_expiry_idx on private.invitations(expires_at) where revoked_at is null;

create table private.mutation_idempotency (
  user_id uuid not null references app.profiles(user_id) on delete cascade,
  scope text not null,
  idempotency_key uuid not null,
  result_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key(user_id, scope, idempotency_key),
  constraint mutation_idempotency_scope_trimmed check (scope = btrim(scope) and char_length(scope) between 1 and 40)
);

revoke all on private.invitations, private.mutation_idempotency from public, anon, authenticated;
grant all on private.invitations, private.mutation_idempotency to service_role;
