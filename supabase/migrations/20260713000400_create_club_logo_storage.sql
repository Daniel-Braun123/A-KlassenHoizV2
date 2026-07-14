insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'club-logos',
  'club-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
);

create policy club_logos_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'club-logos');

create policy club_logos_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
  and name ~ '^clubs/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/v[1-9][0-9]*\.(png|jpe?g|webp)$'
  and lower(coalesce(metadata ->> 'mimetype', '')) = any (array['image/png', 'image/jpeg', 'image/webp'])
  and coalesce(metadata ->> 'size', '') ~ '^[0-9]+$'
  and (metadata ->> 'size')::bigint between 1 and 2097152
);

create policy club_logos_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
)
with check (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
  and name ~ '^clubs/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/v[1-9][0-9]*\.(png|jpe?g|webp)$'
  and lower(coalesce(metadata ->> 'mimetype', '')) = any (array['image/png', 'image/jpeg', 'image/webp'])
  and coalesce(metadata ->> 'size', '') ~ '^[0-9]+$'
  and (metadata ->> 'size')::bigint between 1 and 2097152
);

create policy club_logos_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
);
