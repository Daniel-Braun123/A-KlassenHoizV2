import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

export async function deleteAuthUserIdempotently(userId: string): Promise<void> {
  const environment = readServerEnvironment();
  if (!environment.SUPABASE_SECRET_KEY)
    throw new ApplicationError("UNAVAILABLE", "Supabase server secret is not configured");
  const admin = createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error && error.status !== 404 && error.code !== "user_not_found")
    throw new ApplicationError("UNAVAILABLE", "Auth user deletion failed", { cause: error });
}
