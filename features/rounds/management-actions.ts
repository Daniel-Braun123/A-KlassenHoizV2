"use server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure } from "@/lib/actions/result";
import type { RoundActionState } from "./types";
import {
  hardDeleteRound,
  leaveRound,
  removeRoundMember,
  setRoundArchived,
  transferRoundOwnership,
  updateMyRoundNickname,
} from "./management-service";
const failure = (error: unknown): RoundActionState => {
  const result = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
  );
  return { status: "error", ...result.error };
};
export async function updateNicknameAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    await updateMyRoundNickname({ roundId: data.get("roundId"), nickname: data.get("nickname") });
    revalidatePath(`/rounds/${data.get("roundId")}/settings`);
    return { status: "success", message: "Nickname aktualisiert." };
  } catch (e) {
    return failure(e);
  }
}
export async function transferOwnershipAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    await transferRoundOwnership({
      roundId: data.get("roundId"),
      targetMembershipId: data.get("targetMembershipId"),
      expectedVersion: data.get("expectedVersion"),
    });
    revalidatePath(`/rounds/${data.get("roundId")}`);
    return { status: "success", message: "Besitz wurde atomar übertragen." };
  } catch (e) {
    return failure(e);
  }
}
export async function removeMemberAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    await removeRoundMember({
      roundId: data.get("roundId"),
      membershipId: data.get("membershipId"),
    });
    revalidatePath(`/rounds/${data.get("roundId")}/settings`);
    return { status: "success", message: "Mitglied wurde entfernt." };
  } catch (e) {
    return failure(e);
  }
}
export async function leaveRoundAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    await leaveRound(String(data.get("roundId")));
  } catch (e) {
    return failure(e);
  }
  redirect("/start" as Route);
}
export async function archiveRoundAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    const archived = data.get("archived") === "true";
    await setRoundArchived(
      { roundId: data.get("roundId"), expectedVersion: data.get("expectedVersion") },
      archived,
    );
    revalidatePath(`/rounds/${data.get("roundId")}`);
    return {
      status: "success",
      message: archived ? "Tipprunde archiviert." : "Tipprunde reaktiviert.",
    };
  } catch (e) {
    return failure(e);
  }
}
export async function hardDeleteRoundAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    await hardDeleteRound({
      roundId: data.get("roundId"),
      expectedVersion: data.get("expectedVersion"),
      roundName: data.get("roundName"),
      confirmationName: data.get("confirmationName"),
    });
  } catch (e) {
    return failure(e);
  }
  redirect("/start" as Route);
}
