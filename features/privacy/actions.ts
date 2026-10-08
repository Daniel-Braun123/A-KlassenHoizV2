"use server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { actionFailure } from "@/lib/actions/result";
import { deleteCurrentAccount } from "./service";
import { AccountDeletionError } from "./errors";
import { startGoogleDeletionVerification } from "./reauthentication";
import type { DeleteAccountState } from "./state";

function failureState(error: unknown): DeleteAccountState {
  if (error instanceof AccountDeletionError) return { status: "error", message: error.message };
  if (error instanceof ZodError)
    return {
      status: "error",
      message: "Bitte gib zur Bestätigung exakt KONTO LÖSCHEN ein und prüfe deine Eingaben.",
    };
  const result = actionFailure(error);
  return { status: "error", ...result.error };
}

export async function startGoogleDeletionAction(): Promise<DeleteAccountState> {
  let url: string;
  try {
    url = await startGoogleDeletionVerification();
  } catch (error) {
    return failureState(error);
  }
  redirect(url as Route);
}
export async function deleteAccountAction(
  _: DeleteAccountState,
  data: FormData,
): Promise<DeleteAccountState> {
  try {
    await deleteCurrentAccount({
      confirmation: data.get("confirmation"),
      password: data.get("password") ?? undefined,
    });
  } catch (error) {
    return failureState(error);
  }
  redirect("/" as Route);
}
