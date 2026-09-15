import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccountSchema } from "@/features/rounds/management-schemas";
import { deleteAuthUserIdempotently } from "./delete-account";
import { AccountDeletionError } from "./errors";
import { clearDeletionVerification, hasGoogleDeletionVerification } from "./reauthentication";
export async function deleteCurrentAccount(input: unknown): Promise<void> {
  const value = deleteAccountSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) throw new ApplicationError("UNAUTHENTICATED");
  const user = userData.user;
  const providers = (user.identities ?? []).map((identity) => identity.provider);
  if (providers.includes("google")) {
    if (!(await hasGoogleDeletionVerification(supabase, user.id))) {
      throw new AccountDeletionError(
        "Bitte bestätige dein Konto zuerst erneut mit Google. Die Bestätigung ist 10 Minuten gültig.",
      );
    }
  } else if (providers.includes("email")) {
    if (!value.password)
      throw new AccountDeletionError("Bitte gib dein aktuelles App-Passwort ein.");
    const { data, error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: value.password,
    });
    if (reauthError) {
      if (reauthError.status === 429) throw new ApplicationError("RATE_LIMITED");
      if (["invalid_credentials", "invalid_password"].includes(reauthError.code ?? "")) {
        throw new AccountDeletionError(
          "Das aktuelle Passwort stimmt nicht. Bitte versuche es erneut.",
        );
      }
      throw new ApplicationError("UNAVAILABLE", "Deletion reauthentication failed");
    }
    if (data.user?.id !== user.id) throw new ApplicationError("FORBIDDEN");
  } else {
    throw new ApplicationError("FORBIDDEN");
  }
  const { data: userId, error } = await supabase.schema("api").rpc("prepare_account_deletion");
  if (error) {
    if (error.code === "P0001")
      throw new AccountDeletionError(
        "Übertrage zuerst den Besitz deiner aktiven Tipprunden oder lösche diese Runden.",
      );
    throw new ApplicationError(error.code === "42501" ? "FORBIDDEN" : "UNAVAILABLE", error.message);
  }
  if (userId !== user.id) throw new ApplicationError("FORBIDDEN");
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) throw new ApplicationError("UNAVAILABLE", "Could not revoke account sessions");
  await deleteAuthUserIdempotently(userId);
  await clearDeletionVerification();
}
