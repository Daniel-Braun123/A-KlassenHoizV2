"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { actionFailure } from "@/lib/actions/result";
import type { AccountEditState } from "./account-edit";
import {
  AccountEditError,
  changeDisplayName,
  changeAccountEmail,
  changeAccountPassword,
} from "./account-edit-service";

function failure(error: unknown): AccountEditState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = String(issue.path[0]);
      fieldErrors[field] ??= issue.message;
    }
    return { status: "error", message: "Bitte prüfe deine Eingaben.", fieldErrors };
  }
  if (error instanceof AccountEditError) {
    return {
      status: "error",
      message: error.message,
      ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}),
    };
  }
  return { status: "error", message: actionFailure(error).error.message };
}

export async function changeDisplayNameAction(
  _previous: AccountEditState,
  form: FormData,
): Promise<AccountEditState> {
  try {
    await changeDisplayName({ displayName: form.get("displayName") });
    revalidatePath("/", "layout");
    return { status: "success", message: "Dein Anzeigename wurde gespeichert." };
  } catch (error) {
    return failure(error);
  }
}

export async function changeAccountEmailAction(
  _previous: AccountEditState,
  form: FormData,
): Promise<AccountEditState> {
  try {
    await changeAccountEmail({
      email: form.get("email"),
      currentPassword: form.get("currentPassword"),
    });
    revalidatePath("/profile");
    return {
      status: "success",
      message:
        "Bitte bestätige die E-Mail-Änderung über die Links in deinen Postfächern. Bis dahin gilt deine bisherige Adresse.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function changeAccountPasswordAction(
  _previous: AccountEditState,
  form: FormData,
): Promise<AccountEditState> {
  try {
    await changeAccountPassword({
      currentPassword: form.get("currentPassword"),
      password: form.get("password"),
      passwordConfirmation: form.get("passwordConfirmation"),
    });
  } catch (error) {
    return failure(error);
  }
  redirect("/login?passwordChanged=1");
}
