begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(5);

select is((select file_size_limit from storage.buckets where id = 'club-logos'), 2097152::bigint, 'logo limit is 2 MiB');
select is((select allowed_mime_types from storage.buckets where id = 'club-logos'), array['image/png','image/jpeg','image/webp']::text[], 'logo MIME allowlist');
select ok((select with_check like '%/v%' from pg_policies where policyname = 'club_logos_admin_insert'), 'versioned object path required');
select ok((select with_check like '%private.is_app_admin%' from pg_policies where policyname = 'club_logos_admin_insert'), 'writes require app admin');
select ok((select roles = array['anon','authenticated']::name[] from pg_policies where policyname = 'club_logos_public_read'), 'reads are public assets');

select * from finish();
rollback;
