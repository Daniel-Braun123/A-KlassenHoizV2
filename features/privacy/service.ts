import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccountSchema } from "@/features/rounds/management-schemas";
import { deleteAuthUserIdempotently } from "./delete-account";
export async function deleteCurrentAccount(input: unknown): Promise<void> {
  const value = deleteAccountSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) throw new ApplicationError("UNAUTHENTICATED");
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: value.password,
  });
  if (reauthError) throw new ApplicationError("FORBIDDEN", "Reauthentication failed");
  const { data: userId, error } = await supabase.schema("api").rpc("prepare_account_deletion");
  if (error) {
    if (error.code === "P0001") throw new ApplicationError("CONFLICT", error.message);
    throw new ApplicationError(error.code === "42501" ? "FORBIDDEN" : "UNAVAILABLE", error.message);
  }
  await deleteAuthUserIdempotently(userId);
  await supabase.auth.signOut({ scope: "local" });
}
