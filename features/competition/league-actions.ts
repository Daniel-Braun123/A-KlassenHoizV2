"use server";

import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import { createAdminLeague, publishAdminLeague, updateAdminLeague } from "./league-service";
import type { CompetitionActionState } from "./types";

function selectedClubIds(data: FormData): FormDataEntryValue[] {
  return data.getAll("clubIds");
}

function revalidateCompetitionAdmin(): void {
  revalidatePath("/admin/competitions");
  revalidatePath("/admin/competitions/[leagueId]", "layout");
  revalidatePath("/admin/competitions/[leagueId]/schedule", "page");
  revalidatePath("/admin/competitions/[leagueId]/results", "page");
}

export async function createAdminLeagueAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createAdminLeague({
      name: data.get("name"),
      yearLabel: data.get("yearLabel"),
      clubIds: selectedClubIds(data),
    });
    revalidateCompetitionAdmin();
    return competitionSuccess("Liga wurde als Entwurf angelegt.");
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function updateAdminLeagueAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateAdminLeague({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      name: data.get("name"),
      yearLabel: data.get("yearLabel"),
      clubIds: selectedClubIds(data),
      hasPredictions: data.get("hasPredictions") === "true",
      reason: data.get("reason") || undefined,
    });
    revalidateCompetitionAdmin();
    return competitionSuccess("Änderungen wurden gespeichert.");
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function publishAdminLeagueAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await publishAdminLeague({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
    });
    revalidateCompetitionAdmin();
    return competitionSuccess("Liga ist jetzt für Tipprunden sichtbar.");
  } catch (error) {
    return competitionFailure(error);
  }
}
