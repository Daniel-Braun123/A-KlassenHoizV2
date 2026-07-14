"use server";

import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import {
  createLeague,
  createLeagueSeason,
  createSeason,
  transitionLeagueSeason,
  updateLeague,
  updateSeason,
} from "./league-service";
import type { CompetitionActionState } from "./types";

export async function createLeagueAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createLeague({ name: data.get("name"), shortName: data.get("shortName") || undefined });
    revalidatePath("/admin/competitions");
    return competitionSuccess("Liga wurde angelegt.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function createSeasonAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createSeason({
      label: data.get("label"),
      startsOn: data.get("startsOn"),
      endsOn: data.get("endsOn"),
    });
    revalidatePath("/admin/competitions");
    return competitionSuccess("Saison wurde angelegt.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function createLeagueSeasonAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createLeagueSeason({ leagueId: data.get("leagueId"), seasonId: data.get("seasonId") });
    revalidatePath("/admin/competitions");
    return competitionSuccess("Liga-Saison wurde verbunden.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function transitionLeagueSeasonAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await transitionLeagueSeason({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      status: data.get("status"),
    });
    revalidatePath("/admin/competitions");
    return competitionSuccess("Status wurde sicher geändert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function updateLeagueAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateLeague({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      name: data.get("name"),
      shortName: data.get("shortName") || undefined,
      status: data.get("status"),
    });
    revalidatePath("/admin/competitions");
    return competitionSuccess("Liga wurde mit Versionsprüfung aktualisiert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function updateSeasonAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateSeason({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      label: data.get("label"),
      startsOn: data.get("startsOn"),
      endsOn: data.get("endsOn"),
      status: data.get("status"),
    });
    revalidatePath("/admin/competitions");
    return competitionSuccess("Saison wurde mit Versionsprüfung aktualisiert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
