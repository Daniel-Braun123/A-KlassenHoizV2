import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAuthCallbackUrl, normalizeAuthRedirect } from "@/features/auth/redirects";
import { passwordResetRequestSchema, registerSchema, signInSchema } from "@/features/auth/schemas";
import type {
  PasswordResetRequestInput,
  RegistrationInput,
  RegistrationResult,
  SignInInput,
} from "@/features/auth/types";
import { mapAuthError } from "@/features/auth/security";

export async function register(input: RegistrationInput): Promise<RegistrationResult> {
  const parsed = registerSchema.parse(input);
  const environment = readServerEnvironment();
  const destination = normalizeAuthRedirect(parsed.next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: { display_name: parsed.displayName },
      emailRedirectTo: buildAuthCallbackUrl(environment.NEXT_PUBLIC_SITE_URL, destination),
    },
  });

  if (error || !data.user) {
    throw (
      mapAuthError(error) ??
      new ApplicationError("UNAVAILABLE", "Registration failed without exposing account state")
    );
  }

  if (!data.session) return { kind: "confirmation_required" };
  return { kind: "authenticated", destination };
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
  const callback = buildAuthCallbackUrl(environment.NEXT_PUBLIC_SITE_URL, "/password/reset");

  // The public response is deliberately identical for known and unknown accounts.
  await supabase.auth.resetPasswordForEmail(parsed.email, { redirectTo: callback });
}

export async function completePasswordReset(password: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new ApplicationError("UNAVAILABLE", "Password update failed");
}
