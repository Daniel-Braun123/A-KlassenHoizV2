import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  pushEndpointSchema,
  pushPreferenceSchema,
  pushSubscriptionSchema,
} from "@/features/notifications/schemas";

function mapError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "P0003") throw new ApplicationError("RATE_LIMITED", error.message);
  if (error.code === "22023" || error.code === "23514") {
    throw new ApplicationError("INVALID_INPUT", error.message);
  }
  throw new ApplicationError("UNAVAILABLE", "Push notification operation failed", {
    cause: error,
  });
}

export async function getMissingTipsPreference(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("my_push_notification_preferences")
    .select("missing_tips_enabled")
    .maybeSingle();
  mapError(error);
  return data?.missing_tips_enabled ?? true;
}

export async function getOpenTipCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) throw new ApplicationError("FORBIDDEN", "Authentication required");

  const { data, error } = await supabase
    .schema("api")
    .from("round_overview")
    .select("total_matches,predicted_matches")
    .eq("status", "active");
  mapError(error);

  return (data ?? []).reduce(
    (total, round) =>
      total + Math.max(0, (round.total_matches ?? 0) - (round.predicted_matches ?? 0)),
    0,
  );
}

export async function registerPushSubscription(input: unknown): Promise<string> {
  const value = pushSubscriptionSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const parameters: {
    p_endpoint: string;
    p_p256dh_key: string;
    p_auth_secret: string;
    p_user_agent?: string;
  } = {
    p_endpoint: value.endpoint,
    p_p256dh_key: value.p256dhKey,
    p_auth_secret: value.authSecret,
  };
  if (value.userAgent) parameters.p_user_agent = value.userAgent;
  const { data, error } = await supabase
    .schema("api")
    .rpc("upsert_my_push_subscription", parameters);
  mapError(error);
  if (!data) throw new ApplicationError("UNAVAILABLE", "Push subscription was not stored");
  return data;
}

export async function removePushSubscription(input: unknown): Promise<boolean> {
  const endpoint = pushEndpointSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .rpc("remove_my_push_subscription", { p_endpoint: endpoint });
  mapError(error);
  return data ?? false;
}

export async function setMissingTipsPreference(input: unknown): Promise<boolean> {
  const value = pushPreferenceSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("api").rpc("set_my_push_preferences", {
    p_missing_tips_enabled: value.missingTipsEnabled,
  });
  mapError(error);
  return data ?? value.missingTipsEnabled;
}

export async function getOwnedPushSubscription(endpointInput: unknown) {
  const endpoint = pushEndpointSchema.parse(endpointInput);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("my_push_subscriptions")
    .select("id,endpoint,p256dh_key,auth_secret")
    .eq("endpoint", endpoint)
    .maybeSingle();
  mapError(error);
  if (!data?.id || !data.endpoint || !data.p256dh_key || !data.auth_secret) {
    throw new ApplicationError("NOT_FOUND", "Push subscription not found");
  }
  return {
    id: data.id,
    endpoint: data.endpoint,
    p256dh_key: data.p256dh_key,
    auth_secret: data.auth_secret,
  } as const;
}
