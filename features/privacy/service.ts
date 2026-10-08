import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccountSchema } from "@/features/rounds/management-schemas";
import { deleteAuthUserIdempotently, revokeAuthUserSessions } from "./delete-account";
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
  // Check ownership before revoking sessions. The mutation repeats this check
  // atomically, including ownership changes racing with this request.
  const { data: ownedRounds, error: ownershipError } = await supabase
    .schema("api")
    .from("my_rounds")
    .select("id")
    .eq("role", "owner")
    .limit(1);
  if (ownershipError) throw new ApplicationError("UNAVAILABLE", "Could not check round ownership");
  if (ownedRounds?.length)
    throw new AccountDeletionError(
      "Übertrage zuerst den Besitz deiner aktiven Tipprunden oder lösche diese Runden.",
    );
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token)
    throw new ApplicationError("UNAUTHENTICATED");
  // getUser and provider reauthentication above establish the caller's identity.
  // Revocation must succeed before any irreversible database changes. Access
  // tokens remain valid until expiry, so the existing client can finish the RPC.
  await revokeAuthUserSessions(sessionData.session.access_token);
  const { data: userId, error } = await supabase.schema("api").rpc("prepare_account_deletion");
  if (error) {
    if (error.code === "P0001")
      throw new AccountDeletionError(
        "Übertrage zuerst den Besitz deiner aktiven Tipprunden oder lösche diese Runden.",
      );
    throw new ApplicationError(error.code === "42501" ? "FORBIDDEN" : "UNAVAILABLE", error.message);
  }
  if (userId !== user.id) throw new ApplicationError("FORBIDDEN");
  await deleteAuthUserIdempotently(userId);
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // The account and its refresh sessions are already gone. Cookie cleanup
    // must not turn a completed deletion into a reported failure.
  }
  await clearDeletionVerification();
}
