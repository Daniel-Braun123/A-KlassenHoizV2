begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(12);

select is(
  (select public from storage.buckets where id = 'club-logos'),
  true,
  'club logos are publicly readable assets'
);
select is(
  (select file_size_limit from storage.buckets where id = 'club-logos'),
  2097152::bigint,
  'club logo size is limited to 2 MiB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'club-logos'),
  array['image/png', 'image/jpeg', 'image/webp']::text[],
  'only PNG, JPEG and WebP are accepted'
);

select policies_are(
  'storage',
  'objects',
  array[
    'club_logos_admin_delete',
    'club_logos_admin_insert',
    'club_logos_admin_update',
    'club_logos_public_read'
  ],
  'club logo storage exposes exactly the reviewed policy set'
);

select policy_cmd_is(
  'storage',
  'objects',
  'club_logos_public_read',
  'SELECT',
  'public logo access is read-only'
);
select policy_roles_are(
  'storage',
  'objects',
  'club_logos_public_read',
  array['anon', 'authenticated'],
  'anon and authenticated actors may read logos'
);
select policy_roles_are(
  'storage',
  'objects',
  'club_logos_admin_insert',
  array['authenticated'],
  'only authenticated actors can reach the insert policy'
);

select ok(
  (select with_check like '%private.is_app_admin%' from pg_policies where policyname = 'club_logos_admin_insert'),
  'insert policy checks the database-backed app-admin role'
);
select ok(
  (select with_check not like '%metadata%' from pg_policies where policyname = 'club_logos_admin_insert'),
  'insert policy does not require metadata before Storage has populated it'
);
select ok(
  (select with_check like '%png%' and with_check like '%jpe?g%' and with_check like '%webp%'
   from pg_policies where policyname = 'club_logos_admin_insert'),
  'insert policy restricts versioned paths to supported image extensions'
);
select ok(
  (select with_check like '%clubs/%' and with_check like '%/v%'
   from pg_policies where policyname = 'club_logos_admin_insert'),
  'insert policy enforces versioned club paths'
);
select ok(
  (select qual like '%private.is_app_admin%' from pg_policies where policyname = 'club_logos_admin_delete'),
  'delete policy checks the database-backed app-admin role'
);

select * from finish();
rollback;
