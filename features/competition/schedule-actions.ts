"use server";

import { revalidatePath } from "next/cache";
import { ApplicationError } from "@/lib/actions/errors";
import { berlinDateTimeLocalToIso } from "./berlin-time";
import { competitionFailure, competitionSuccess } from "./action-state";
import { createMatch, createMatchday, updateMatch, updateMatchday } from "./schedule-service";
import type { CompetitionActionState } from "./types";

function kickoffIso(value: FormDataEntryValue | null): string {
  try {
    return berlinDateTimeLocalToIso(String(value ?? ""));
  } catch (error) {
    throw new ApplicationError("INVALID_INPUT", "Invalid Europe/Berlin kickoff", { cause: error });
  }
}

export async function createMatchdayAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createMatchday({
      leagueSeasonId: data.get("leagueSeasonId"),
      number: data.get("number"),
      displayName: data.get("displayName") || undefined,
    });
    revalidatePath("/admin/schedule");
    return competitionSuccess("Spieltag wurde angelegt.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function createMatchAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createMatch({
      matchdayId: data.get("matchdayId"),
      homeClubId: data.get("homeClubId"),
      awayClubId: data.get("awayClubId"),
      kickoffAt: kickoffIso(data.get("kickoffAt")),
    });
    revalidatePath("/admin/schedule");
    return competitionSuccess("Spiel wurde angelegt.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function updateMatchdayAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateMatchday({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      number: data.get("number"),
      displayName: data.get("displayName") || undefined,
      status: data.get("status"),
    });
    revalidatePath("/admin/schedule");
    return competitionSuccess("Spieltag wurde konfliktgeschützt aktualisiert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function updateMatchAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateMatch({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      matchdayId: data.get("matchdayId"),
      homeClubId: data.get("homeClubId"),
      awayClubId: data.get("awayClubId"),
      kickoffAt: kickoffIso(data.get("kickoffAt")),
      status: data.get("status"),
    });
    revalidatePath("/admin/schedule");
    return competitionSuccess("Spiel wurde konfliktgeschützt aktualisiert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
