import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAuthCallbackUrl,
  buildOAuthCallbackUrl,
  normalizeAuthRedirect,
} from "@/features/auth/redirects";
import {
  oauthSignInSchema,
  passwordResetRequestSchema,
  registerSchema,
  signInSchema,
} from "@/features/auth/schemas";
import type {
  OAuthSignInInput,
  PasswordResetRequestInput,
  RegistrationInput,
  RegistrationResult,
  SignInInput,
} from "@/features/auth/types";
import { isExistingRegistration, mapAuthError } from "@/features/auth/security";

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

  if (isExistingRegistration(error)) {
    return { kind: "submitted" };
  }

  if (error || !data.user) {
    throw (
      mapAuthError(error) ??
      new ApplicationError("UNAVAILABLE", "Registration failed without exposing account state")
    );
  }

  if (!data.session) return { kind: "submitted" };
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

export async function createGoogleAuthorizationUrl(input: OAuthSignInInput): Promise<string> {
  const parsed = oauthSignInSchema.parse(input);
  const environment = readServerEnvironment();
  const destination = normalizeAuthRedirect(parsed.next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildOAuthCallbackUrl(
        environment.NEXT_PUBLIC_SITE_URL,
        destination,
        parsed.entryPoint,
      ),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw new ApplicationError("UNAVAILABLE", "Google sign-in could not be started");
  }

  return data.url;
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

  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    throw new ApplicationError("UNAVAILABLE", "Password reset session cleanup failed");
  }
}
