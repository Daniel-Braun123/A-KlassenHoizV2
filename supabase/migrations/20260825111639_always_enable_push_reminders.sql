update app.push_notification_preferences
set missing_tips_enabled = true
where not missing_tips_enabled;

create or replace function api.upsert_my_push_subscription(
  p_endpoint text,
  p_p256dh_key text,
  p_auth_secret text,
  p_user_agent text default null
) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare
  actor uuid;
  subscription_id uuid;
begin
  actor := private.require_round_user();
  perform private.enforce_rate_limit(actor, 'push-subscription', 20, interval '5 minutes');

  p_endpoint := btrim(p_endpoint);
  p_p256dh_key := btrim(p_p256dh_key);
  p_auth_secret := btrim(p_auth_secret);
  p_user_agent := nullif(left(btrim(p_user_agent), 512), '');

  if p_endpoint not like 'https://%'
    or char_length(p_endpoint) not between 12 and 2048
    or char_length(p_p256dh_key) not between 16 and 512
    or char_length(p_auth_secret) not between 8 and 256 then
    raise exception using errcode = '22023', message = 'Invalid push subscription';
  end if;

  insert into app.push_notification_preferences(user_id, missing_tips_enabled)
  values (actor, true)
  on conflict (user_id) do update set
    missing_tips_enabled = true
  where not app.push_notification_preferences.missing_tips_enabled;

  insert into app.push_subscriptions(user_id, endpoint, p256dh_key, auth_secret, user_agent)
  values (actor, p_endpoint, p_p256dh_key, p_auth_secret, p_user_agent)
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh_key = excluded.p256dh_key,
    auth_secret = excluded.auth_secret,
    user_agent = excluded.user_agent,
    last_seen_at = clock_timestamp()
  returning id into subscription_id;

  return subscription_id;
end
$function$;
