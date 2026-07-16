"use server";

import { revalidatePath } from "next/cache";
import { ApplicationError } from "@/lib/actions/errors";
import { berlinDateTimeLocalToIso } from "./berlin-time";
import { competitionFailure, competitionSuccess } from "./action-state";
import {
  createMatch,
  createMatchSimple,
  createMatchday,
  createMatchdayAuto,
  deleteMatchSimple,
  deleteMatchdaySimple,
  moveMatchdayPhase,
  updateMatch,
  updateMatchSimple,
  updateMatchday,
} from "./schedule-service";
import type { CompetitionActionState } from "./types";

function kickoffIso(value: FormDataEntryValue | null): string {
  try {
    return berlinDateTimeLocalToIso(String(value ?? ""));
  } catch (error) {
    throw new ApplicationError("INVALID_INPUT", "Invalid Europe/Berlin kickoff", { cause: error });
  }
}

function revalidateScheduleAdmin(): void {
  revalidatePath("/admin/competitions");
  revalidatePath("/admin/competitions/[leagueId]/schedule", "page");
}

export async function createMatchdayAutoAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createMatchdayAuto({ leagueId: data.get("leagueId"), phase: data.get("phase") });
    revalidateScheduleAdmin();
    return competitionSuccess("Der nächste Spieltag wurde angelegt.");
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function moveMatchdayPhaseAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await moveMatchdayPhase({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      phase: data.get("phase"),
    });
    revalidateScheduleAdmin();
    return competitionSuccess(
      "Der Spieltag wurde in die andere Runde verschoben und neu nummeriert.",
    );
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function deleteMatchdaySimpleAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await deleteMatchdaySimple({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
    });
    revalidateScheduleAdmin();
    return competitionSuccess("Der Spieltag wurde gelöscht.");
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function createMatchSimpleAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createMatchSimple({
      matchdayId: data.get("matchdayId"),
      homeClubId: data.get("homeClubId"),
      awayClubId: data.get("awayClubId"),
      kickoffAt: kickoffIso(data.get("kickoffAt")),
    });
    revalidateScheduleAdmin();
    return competitionSuccess("Das Spiel wurde angelegt.");
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function updateMatchSimpleAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateMatchSimple({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      homeClubId: data.get("homeClubId"),
      awayClubId: data.get("awayClubId"),
      kickoffAt: kickoffIso(data.get("kickoffAt")),
      status: data.get("status"),
    });
    revalidateScheduleAdmin();
    return competitionSuccess("Das Spiel wurde aktualisiert.");
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function deleteMatchSimpleAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await deleteMatchSimple({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
    });
    revalidateScheduleAdmin();
    return competitionSuccess("Das Spiel wurde gelöscht.");
  } catch (error) {
    return competitionFailure(error);
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
    revalidateScheduleAdmin();
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
    revalidateScheduleAdmin();
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
    revalidateScheduleAdmin();
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
    revalidateScheduleAdmin();
    return competitionSuccess("Spiel wurde konfliktgeschützt aktualisiert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
