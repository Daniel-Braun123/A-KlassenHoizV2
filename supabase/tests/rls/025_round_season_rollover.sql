begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(8);
select has_column('app', 'prediction_rounds', 'predecessor_round_id', 'rounds can reference a previous season');
select has_index('app', 'prediction_rounds', 'prediction_rounds_one_successor_idx', 'only one successor is allowed');
select is(
  (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'api.round_rollover_options'::regclass),
  true,
  'rollover choices respect invoker RLS'
);
select function_privs_are(
  'api',
  'rollover_round',
  array['uuid', 'uuid', 'integer'],
  'authenticated',
  array['EXECUTE'],
  'authenticated users reach the guarded rollover RPC'
);
select ok(
  not has_function_privilege('anon', 'api.rollover_round(uuid,uuid,integer)', 'EXECUTE'),
  'anonymous users cannot call rollover'
);
select has_column('api', 'my_rounds', 'has_successor', 'rollover state is separate from successor access');
select ok(
  not has_function_privilege('anon', 'private.round_has_successor(uuid)', 'EXECUTE'),
  'anonymous users cannot inspect rollover relationships'
);
select is(
  (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'api.my_rounds'::regclass),
  true,
  'predecessor and successor links respect the caller membership'
);
select * from finish();
rollback;
