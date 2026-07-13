"use server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure } from "@/lib/actions/result";
import { joinRound, revokeInvitation, rotateInvitation } from "./service";
import type { InvitationActionState } from "./types";
const failure = (error: unknown): InvitationActionState => {
  const result = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
  );
  return { status: "error", ...result.error };
};
export async function rotateInvitationAction(
  _: InvitationActionState,
  data: FormData,
): Promise<InvitationActionState> {
  try {
    const result = await rotateInvitation({ roundId: data.get("roundId") });
    return {
      status: "success",
      message: "Ein neuer Einladungslink ist sieben Tage gültig.",
      invitationUrl: result.url,
      expiresAt: result.expiresAt,
    };
  } catch (e) {
    return failure(e);
  }
}
export async function revokeInvitationAction(
  _: InvitationActionState,
  data: FormData,
): Promise<InvitationActionState> {
  try {
    await revokeInvitation(String(data.get("roundId")));
    revalidatePath(`/rounds/${String(data.get("roundId"))}/settings`);
    return { status: "success", message: "Der bisherige Einladungslink ist widerrufen." };
  } catch (e) {
    return failure(e);
  }
}
export async function joinRoundAction(
  _: InvitationActionState,
  data: FormData,
): Promise<InvitationActionState> {
  let membership: string;
  try {
    membership = await joinRound({
      token: data.get("token"),
      nickname: data.get("nickname"),
      idempotencyKey: data.get("idempotencyKey"),
    });
  } catch (e) {
    return failure(e);
  }
  void membership;
  redirect("/start" as Route);
}
