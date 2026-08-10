begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(15);

select has_table('app', 'push_notification_preferences', 'push preferences exist');
select has_table('app', 'push_subscriptions', 'device subscriptions exist');
select has_table('app', 'push_deliveries', 'delivery deduplication exists');
select has_view('api', 'my_push_notification_preferences', 'own preference view is exposed');
select has_view('api', 'my_push_subscriptions', 'own subscription view is exposed');
select has_function(
  'api',
  'upsert_my_push_subscription',
  array['text', 'text', 'text', 'text'],
  'subscription mutation is an RPC boundary'
);
select has_function(
  'private',
  'invoke_push_reminder_endpoint',
  array[]::text[],
  'the scheduler invokes the private HTTPS boundary'
);
select is(
  (select count(*) from cron.job where jobname = 'dispatch-push-reminders'),
  1::bigint,
  'one ten-minute reminder job is installed'
);
select has_function(
  'api',
  'claim_due_push_reminders',
  array['timestamp with time zone', 'integer'],
  'scheduler claims due reminders atomically'
);
select col_is_pk('app', 'push_notification_preferences', 'user_id', 'one preference per user');
select col_is_unique('app', 'push_subscriptions', 'endpoint', 'one owner per browser endpoint');
select col_has_check('app', 'push_subscriptions', 'endpoint', 'push endpoints are validated');
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'app.push_subscriptions'::regclass),
  'subscription RLS is enabled and forced'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'app.push_notification_preferences'::regclass),
  'preference RLS is enabled and forced'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'app.push_deliveries'::regclass),
  'delivery RLS is enabled and forced'
);

select * from finish();
rollback;
