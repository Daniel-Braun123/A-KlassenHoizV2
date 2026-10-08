import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

function createDeletionAdminClient() {
  const environment = readServerEnvironment();
  if (!environment.SUPABASE_SECRET_KEY)
    throw new ApplicationError("UNAVAILABLE", "Supabase server secret is not configured");
  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Revoke refresh sessions without removing the caller's cookies needed for retry. */
export async function revokeAuthUserSessions(accessToken: string): Promise<void> {
  const { error } = await createDeletionAdminClient().auth.admin.signOut(accessToken, "global");
  if (error)
    throw new ApplicationError("UNAVAILABLE", "Could not revoke account sessions", {
      cause: error,
    });
}

export async function deleteAuthUserIdempotently(userId: string): Promise<void> {
  const admin = createDeletionAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error && error.status !== 404 && error.code !== "user_not_found")
    throw new ApplicationError("UNAVAILABLE", "Auth user deletion failed", { cause: error });
}
