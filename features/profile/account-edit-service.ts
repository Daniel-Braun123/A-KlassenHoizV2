import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readServerEnvironment } from "@/lib/config/env";
import { buildAuthCallbackUrl } from "@/features/auth/redirects";
import {
  canEditEmailCredentials,
  displayNameChangeSchema,
  emailChangeSchema,
  passwordChangeSchema,
} from "./account-edit";

export class AccountEditError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

function checkAuthError(error: { code?: string | undefined; status?: number | undefined } | null) {
  if (!error) return;
  if (error.status === 429 || error.code?.startsWith("over_")) {
    throw new ApplicationError("RATE_LIMITED");
  }
  if (
    ["invalid_credentials", "invalid_password", "current_password_invalid"].includes(
      error.code ?? "",
    )
  ) {
    throw new AccountEditError("Das aktuelle Passwort stimmt nicht.", "currentPassword");
  }
  if (["email_exists", "user_already_exists"].includes(error.code ?? "")) {
    throw new AccountEditError("Diese E-Mail-Adresse kann nicht verwendet werden.", "email");
  }
  if (error.code === "same_password") {
    throw new AccountEditError(
      "Das neue Passwort muss sich vom bisherigen unterscheiden.",
      "password",
    );
  }
  if (error.code === "weak_password") {
    throw new AccountEditError("Bitte wähle ein stärkeres Passwort.", "password");
  }
  throw new ApplicationError("UNAVAILABLE");
}

async function requireEditableAccount(credentials = false) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApplicationError("UNAUTHENTICATED");
  const { data: profile, error: profileError } = await supabase
    .schema("api")
    .from("my_profile")
    .select("status")
    .maybeSingle();
  if (profileError) throw new ApplicationError("UNAVAILABLE");
  if (profile?.status !== "active") throw new ApplicationError("INACTIVE_PROFILE");
  if (
    credentials &&
    (!data.user.email ||
      !canEditEmailCredentials((data.user.identities ?? []).map((identity) => identity.provider)))
  )
    throw new ApplicationError("FORBIDDEN");
  return { supabase, user: data.user };
}

export async function changeDisplayName(input: unknown): Promise<void> {
  const value = displayNameChangeSchema.parse(input);
  const { supabase } = await requireEditableAccount();
  const { error } = await supabase.schema("api").rpc("update_my_profile", {
    new_display_name: value.displayName,
  });
  if (error) throw new ApplicationError("UNAVAILABLE");
}

export async function changeAccountEmail(input: unknown): Promise<void> {
  const value = emailChangeSchema.parse(input);
  const { supabase, user } = await requireEditableAccount(true);
  if (value.email === user.email!.toLowerCase()) {
    throw new AccountEditError("Das ist bereits deine aktuelle E-Mail-Adresse.", "email");
  }
  // Reauthenticate against the account's server-verified current email, never form input.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: value.currentPassword,
  });
  checkAuthError(error);
  if (data.user?.id !== user.id) throw new ApplicationError("FORBIDDEN");
  const callback = new URL(
    buildAuthCallbackUrl(
      readServerEnvironment().NEXT_PUBLIC_SITE_URL,
      "/profile?emailChange=checked",
    ),
  );
  callback.searchParams.set("source", "email-change");
  const { error: updateError } = await supabase.auth.updateUser(
    { email: value.email },
    { emailRedirectTo: callback.toString() },
  );
  checkAuthError(updateError);
}

export async function changeAccountPassword(input: unknown): Promise<void> {
  const value = passwordChangeSchema.parse(input);
  const { supabase, user } = await requireEditableAccount(true);
  // Verify independently of the Auth deployment's current_password enforcement setting.
  const { data: reauthenticated, error: reauthenticationError } =
    await supabase.auth.signInWithPassword({
      email: user.email!,
      password: value.currentPassword,
    });
  checkAuthError(reauthenticationError);
  if (reauthenticated.user?.id !== user.id) throw new ApplicationError("FORBIDDEN");
  const { error } = await supabase.auth.updateUser({
    password: value.password,
    current_password: value.currentPassword,
  });
  checkAuthError(error);
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    throw new AccountEditError(
      "Dein Passwort wurde geändert. Bitte melde dich ab und mit dem neuen Passwort wieder an.",
    );
  }
}
