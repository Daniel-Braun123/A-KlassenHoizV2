begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(4);

select policies_are(
  'realtime',
  'messages',
  array['round_result_broadcast_member_receive'],
  'realtime exposes only the guarded round-result receive policy'
);
select function_privs_are(
  'private',
  'can_receive_round_broadcast',
  array['text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated members can be checked during channel authorization'
);
select function_privs_are(
  'private',
  'can_receive_round_broadcast',
  array['text'],
  'anon',
  array[]::text[],
  'anonymous visitors cannot invoke round channel authorization'
);
select function_privs_are(
  'private',
  'broadcast_match_result_change',
  array[]::text[],
  'authenticated',
  array[]::text[],
  'clients cannot invoke the result broadcast trigger directly'
);

select * from finish();
rollback;
