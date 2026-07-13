"use server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { actionFailure } from "@/lib/actions/result";
import { ApplicationError } from "@/lib/actions/errors";
import { createRound, updateRound } from "./service";
import type { RoundActionState } from "./types";
const failure = (error: unknown): RoundActionState => {
  const result = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
  );
  return { status: "error", ...result.error };
};
export async function createRoundAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  let id: string;
  try {
    id = await createRound({
      name: data.get("name"),
      leagueSeasonId: data.get("leagueSeasonId"),
      nickname: data.get("nickname"),
      idempotencyKey: data.get("idempotencyKey"),
    });
  } catch (e) {
    return failure(e);
  }
  redirect(`/rounds/${id}` as Route);
}
export async function updateRoundAction(
  _: RoundActionState,
  data: FormData,
): Promise<RoundActionState> {
  try {
    await updateRound({
      roundId: data.get("roundId"),
      expectedVersion: data.get("expectedVersion"),
      name: data.get("name"),
      leagueSeasonId: data.get("leagueSeasonId"),
    });
    revalidatePath(`/rounds/${String(data.get("roundId"))}/settings`);
    return { status: "success", message: "Tipprunde wurde aktualisiert." };
  } catch (e) {
    return failure(e);
  }
}
