import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeAuthRedirect } from "@/features/auth/redirects";
import { passwordResetRequestSchema, registerSchema, signInSchema } from "@/features/auth/schemas";
import type {
  PasswordResetRequestInput,
  RegistrationInput,
  SignInInput,
} from "@/features/auth/types";
import { mapAuthError } from "@/features/auth/security";

export async function register(input: RegistrationInput): Promise<string> {
  const parsed = registerSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: { data: { display_name: parsed.displayName } },
  });

  if (error || !data.user || !data.session) {
    throw (
      mapAuthError(error) ??
      new ApplicationError("UNAVAILABLE", "Registration failed without exposing account state")
    );
  }

  return normalizeAuthRedirect(parsed.next);
}

export async function signIn(input: SignInInput): Promise<string> {
  const parsed = signInSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    const mapped = mapAuthError(error);
    throw mapped?.code === "RATE_LIMITED"
      ? mapped
      : new ApplicationError("UNAUTHENTICATED", "Sign-in credentials were rejected");
  }

  return normalizeAuthRedirect(parsed.next);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new ApplicationError("UNAVAILABLE", "Sign-out failed");
}

export async function requestPasswordReset(input: PasswordResetRequestInput): Promise<void> {
  const parsed = passwordResetRequestSchema.parse(input);
  const environment = readServerEnvironment();
  const supabase = await createSupabaseServerClient();
  const callback = new URL("/auth/callback", environment.NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set("next", "/password/reset");

  // The public response is deliberately identical for known and unknown accounts.
  await supabase.auth.resetPasswordForEmail(parsed.email, { redirectTo: callback.toString() });
}

export async function completePasswordReset(password: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new ApplicationError("UNAVAILABLE", "Password update failed");
}
