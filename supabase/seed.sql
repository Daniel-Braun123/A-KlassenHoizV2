-- Synthetic local-only Auth actors. Never copy production identities into this file.
with actors(id, email, display_name) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'nonmember@example.test', 'Nichtmitglied'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'member@example.test', 'Mitglied'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'owner@example.test', 'Besitzer'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'app-admin@example.test', 'App-Admin'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'disabled@example.test', 'Gesperrt')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  actor.id,
  'authenticated',
  'authenticated',
  actor.email,
  extensions.crypt('LocalFixture42!', extensions.gen_salt('bf')),
  '2026-07-13T08:00:00Z'::timestamptz,
  '',
  '',
  '',
  '',
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('display_name', actor.display_name),
  '2026-07-13T08:00:00Z'::timestamptz,
  '2026-07-13T08:00:00Z'::timestamptz,
  false,
  false
from actors as actor;

-- The deterministic local operator is provisioned explicitly. Client metadata is never trusted.
update app.profiles
set app_role = 'app_admin'
where user_id = '00000000-0000-4000-8000-000000000004'::uuid;

with actors(id, email) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'nonmember@example.test'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'member@example.test'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'owner@example.test'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'app-admin@example.test'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'disabled@example.test')
)
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  actor.email,
  actor.id,
  jsonb_build_object(
    'sub', actor.id,
    'email', actor.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  '2026-07-13T08:00:00Z'::timestamptz,
  '2026-07-13T08:00:00Z'::timestamptz,
  '2026-07-13T08:00:00Z'::timestamptz
from actors as actor;
