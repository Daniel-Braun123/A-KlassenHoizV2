import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAppAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims.sub) throw new ApplicationError("UNAUTHENTICATED");
  const { data: profile, error } = await supabase
    .schema("api")
    .from("my_profile")
    .select("app_role,status")
    .single();
  if (error || profile.status !== "active" || profile.app_role !== "app_admin") {
    throw new ApplicationError("FORBIDDEN", "Active app admin required");
  }
  return supabase;
}

export async function appAdminClientOrNull() {
  try {
    return await requireAppAdmin();
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      (error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN")
    )
      return null;
    throw error;
  }
}

export function throwCompetitionError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (error.code === "P0001" || error.code === "23505")
    throw new ApplicationError("CONFLICT", error.message);
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "23514" || error.code === "22023")
    throw new ApplicationError("INVALID_INPUT", error.message);
  if (error.code === "P0002") throw new ApplicationError("NOT_FOUND", error.message);
  throw new ApplicationError("UNAVAILABLE", "Competition operation failed", { cause: error });
}
