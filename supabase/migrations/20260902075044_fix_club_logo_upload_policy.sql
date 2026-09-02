-- The Storage API creates the object row before file metadata such as size and
-- MIME type is available. Keeping those metadata checks in the INSERT policy
-- rejects every standard upload. The bucket configuration and server-side
-- validation remain responsible for enforcing file size and content type.
alter policy club_logos_admin_insert
on storage.objects
with check (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
  and name ~ '^clubs/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/v[1-9][0-9]*\.(png|jpe?g|webp)$'
);

alter policy club_logos_admin_update
on storage.objects
using (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
)
with check (
  bucket_id = 'club-logos'
  and (select private.is_app_admin())
  and name ~ '^clubs/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/v[1-9][0-9]*\.(png|jpe?g|webp)$'
);
