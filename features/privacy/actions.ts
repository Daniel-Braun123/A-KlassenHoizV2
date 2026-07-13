"use server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure } from "@/lib/actions/result";
import { deleteCurrentAccount } from "./service";
export type DeleteAccountState = Readonly<{
  status: "idle" | "error";
  message?: string;
  code?: string;
}>;
export const initialDeleteAccountState: DeleteAccountState = { status: "idle" };
export async function deleteAccountAction(
  _: DeleteAccountState,
  data: FormData,
): Promise<DeleteAccountState> {
  try {
    await deleteCurrentAccount({
      confirmation: data.get("confirmation"),
      password: data.get("password"),
    });
  } catch (error) {
    const result = actionFailure(
      error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
    );
    return { status: "error", ...result.error };
  }
  redirect("/" as Route);
}
