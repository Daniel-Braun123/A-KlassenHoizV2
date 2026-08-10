begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(12);

select policies_are(
  'app',
  'push_notification_preferences',
  array['push_notification_preferences_own_read'],
  'preferences expose only the own read policy'
);
select policies_are(
  'app',
  'push_subscriptions',
  array['push_subscriptions_own_read'],
  'subscriptions expose only the own read policy'
);
select policies_are('app', 'push_deliveries', array[]::text[], 'deliveries have no client policy');
select ok(not has_table_privilege('authenticated', 'app.push_subscriptions', 'INSERT'), 'no direct subscription insert');
select ok(not has_table_privilege('authenticated', 'app.push_subscriptions', 'UPDATE'), 'no direct subscription update');
select ok(not has_table_privilege('authenticated', 'app.push_subscriptions', 'DELETE'), 'no direct subscription delete');
select ok(not has_table_privilege('authenticated', 'app.push_deliveries', 'SELECT'), 'clients cannot read delivery internals');
select function_privs_are(
  'api', 'upsert_my_push_subscription', array['text', 'text', 'text', 'text'],
  'authenticated', array['EXECUTE'], 'users can register only through the guarded RPC'
);
select function_privs_are(
  'api', 'remove_my_push_subscription', array['text'],
  'authenticated', array['EXECUTE'], 'users can remove only through the guarded RPC'
);
select function_privs_are(
  'api', 'set_my_push_preferences', array['boolean'],
  'authenticated', array['EXECUTE'], 'users can change only their own preference'
);
select function_privs_are(
  'api', 'claim_due_push_reminders', array['timestamp with time zone', 'integer'],
  'authenticated', array[]::text[], 'clients cannot claim scheduled work'
);
select function_privs_are(
  'api', 'complete_push_delivery', array['uuid', 'boolean', 'text'],
  'authenticated', array[]::text[], 'clients cannot complete scheduled work'
);

select * from finish();
rollback;
