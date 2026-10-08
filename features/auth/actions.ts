"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { actionFailure } from "@/lib/actions/result";
import { ApplicationError } from "@/lib/actions/errors";
import {
  completePasswordResetSchema,
  registerSchema,
  resendRegistrationSchema,
} from "@/features/auth/schemas";
import type { AuthActionState, RegistrationActionState } from "@/features/auth/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeAuthRedirect } from "./redirects";
import {
  completePasswordReset,
  createGoogleAuthorizationUrl,
  register,
  requestPasswordReset,
  resendRegistration,
  signIn,
  signOut,
} from "@/features/auth/service";

function failureState(error: unknown): Extract<AuthActionState, { status: "error" }> {
  const failure = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", "Auth input invalid") : error,
  );
  return { status: "error", ...failure.error };
}

export async function registerAction(
  _previous: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  let result: Awaited<ReturnType<typeof register>>;
  let input: ReturnType<typeof registerSchema.parse>;
  try {
    input = registerSchema.parse({
      displayName: String(formData.get("displayName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      next: String(formData.get("next") ?? ""),
    });
    result = await register({ ...input, next: input.next ?? "" });
  } catch (error) {
    return failureState(error);
  }

  if (result.kind === "submitted") {
    return {
      status: "success",
      email: input.email,
      displayName: input.displayName,
      message:
        "Wenn für diese E-Mail-Adresse noch kein Konto besteht, erhältst du gleich einen Bestätigungslink.",
    };
  }

  redirect(result.destination as Route);
}

export async function resendRegistrationAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await resendRegistration({
      email: formData.get("email"),
      next: String(formData.get("next") ?? ""),
    });
    return {
      status: "success",
      message:
        "Falls deine Adresse noch bestätigt werden muss, erhältst du einen neuen Link. Prüfe dein Postfach.",
    };
  } catch (error) {
    return failureState(error);
  }
}

/** On returning to the original tab, only resume the account entered there. */
export async function registrationDestinationAction(input: unknown): Promise<string | null> {
  const parsed = resendRegistrationSchema.safeParse(input);
  if (!parsed.success) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (
    error ||
    data.user?.email?.toLowerCase() !== parsed.data.email ||
    !data.user?.email_confirmed_at
  )
    return null;
  return normalizeAuthRedirect(parsed.data.next);
}

export async function signInAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  let destination: string;
  try {
    destination = await signIn({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      next: String(formData.get("next") ?? ""),
    });
  } catch (error) {
    return failureState(error);
  }
  redirect(destination as Route);
}

export async function startGoogleSignInAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  let authorizationUrl: string;
  try {
    authorizationUrl = await createGoogleAuthorizationUrl({
      entryPoint: formData.get("entryPoint") === "register" ? "register" : "login",
      next: String(formData.get("next") ?? ""),
    });
  } catch (error) {
    return failureState(error);
  }

  redirect(authorizationUrl as Route);
}

export async function passwordResetRequestAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await requestPasswordReset({ email: String(formData.get("email") ?? "") });
    return {
      status: "success",
      message: "Wenn ein Konto existiert, erhältst du gleich eine E-Mail mit dem nächsten Schritt.",
    };
  } catch (error) {
    return failureState(error);
  }
}

export async function completePasswordResetAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = completePasswordResetSchema.parse({
      password: String(formData.get("password") ?? ""),
      passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
    });
    await completePasswordReset(parsed.password);
  } catch (error) {
    return failureState(error);
  }

  redirect("/login?passwordChanged=1" as Route);
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login" as Route);
}
