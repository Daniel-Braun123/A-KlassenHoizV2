begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(10);

select has_function(
  'api',
  'create_club_with_media',
  array['uuid', 'text', 'text', 'text'],
  'club creation accepts one reviewed logo source'
);
select has_function(
  'api',
  'update_club_with_media',
  array['uuid', 'integer', 'text', 'text', 'text'],
  'club updates replace logo media atomically'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
set local role authenticated;

select lives_ok(
  $$select api.create_club_with_media(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Logo Storage Test',
    null,
    'clubs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/v1.webp'
  )$$,
  'admin creates a club with a stored logo'
);
select is(
  (select logo_path from app.clubs where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'clubs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/v1.webp',
  'stored logo path belongs to the club'
);
select is(
  api.update_club_with_media(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    1,
    'Logo Storage Test',
    'https://example.test/logo.webp',
    null
  ),
  2,
  'switching from storage to URL increments the version once'
);
select is(
  (select logo_url from app.clubs where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'https://example.test/logo.webp',
  'external logo URL is stored'
);
select is(
  (select logo_path from app.clubs where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null,
  'switching to a URL clears the stored path'
);
select throws_ok(
  $$select api.create_club_with_media(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Zwei Logos',
    'https://example.test/logo.webp',
    'clubs/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/v1.webp'
  )$$,
  '22023',
  'Choose either a logo URL or a stored logo',
  'a club cannot reference two logo sources'
);
select throws_ok(
  $$select api.update_club_with_media(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'Veraltet', null, null
  )$$,
  'P0001',
  'Version conflict',
  'stale updates are rejected'
);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select throws_ok(
  $$select api.create_club_with_media(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Nicht erlaubt', null, null
  )$$,
  '42501',
  null,
  'normal users cannot create clubs with media'
);

reset role;
select * from finish();
rollback;
