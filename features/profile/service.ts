import "server-only";

import { cache } from "react";
import { isAuthApiError, isAuthSessionMissingError, type AuthError } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MyProfileRow = Database["api"]["Views"]["my_profile"]["Row"];

export type MyProfile = Pick<MyProfileRow, "app_role" | "display_name" | "status" | "user_id">;

export async function getMyAccountDetails() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isInvalidSession(error)) return null;
    throw error;
  }
  if (!data.user) return null;
  return {
    email: data.user.email ?? null,
    createdAt: data.user.created_at,
    emailConfirmed: Boolean(data.user.email_confirmed_at),
    providers: [...new Set((data.user.identities ?? []).map((identity) => identity.provider))],
  };
}

function isInvalidSession(error: AuthError) {
  return (
    isAuthSessionMissingError(error) ||
    error.name === "AuthInvalidJwtError" ||
    error.name === "AuthInvalidTokenResponseError" ||
    (isAuthApiError(error) && error.status >= 400 && error.status < 500)
  );
}

export const getMyProfile = cache(async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) {
    if (isInvalidSession(claimsError)) return null;
    throw claimsError;
  }
  if (!claims?.claims.sub) return null;

  const { data, error } = await supabase
    .schema("api")
    .from("my_profile")
    .select("user_id,display_name,status,app_role")
    .maybeSingle();
  if (error) throw error;
  return (
    data ?? {
      app_role: null,
      display_name: null,
      status: null,
      user_id: claims.claims.sub,
    }
  );
});
