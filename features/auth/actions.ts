"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { actionFailure } from "@/lib/actions/result";
import { ApplicationError } from "@/lib/actions/errors";
import { completePasswordResetSchema } from "@/features/auth/schemas";
import type { AuthActionState } from "@/features/auth/state";
import {
  completePasswordReset,
  register,
  requestPasswordReset,
  signIn,
  signOut,
} from "@/features/auth/service";

function failureState(error: unknown): AuthActionState {
  const failure = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", "Auth input invalid") : error,
  );
  return { status: "error", ...failure.error };
}

export async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  let destination: string;
  try {
    destination = await register({
      displayName: String(formData.get("displayName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      next: String(formData.get("next") ?? ""),
    });
  } catch (error) {
    return failureState(error);
  }
  redirect(destination as Route);
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
    return { status: "success", message: "Dein neues Passwort ist gespeichert." };
  } catch (error) {
    return failureState(error);
  }
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login" as Route);
}
