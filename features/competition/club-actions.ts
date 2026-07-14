"use server";

import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import { assignClub, createClub, updateClub } from "./club-service";
import { uploadClubLogo } from "./logo-service";
import type { CompetitionActionState } from "./types";

export async function createClubAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createClub({ name: data.get("name"), shortName: data.get("shortName") });
    revalidatePath("/admin/clubs");
    return competitionSuccess("Verein wurde angelegt.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function assignClubAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await assignClub({ leagueSeasonId: data.get("leagueSeasonId"), clubId: data.get("clubId") });
    revalidatePath("/admin/clubs");
    return competitionSuccess("Verein wurde zugeordnet.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function uploadClubLogoAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await uploadClubLogo(data);
    revalidatePath("/admin/clubs");
    return competitionSuccess("Logo wurde versioniert gespeichert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
export async function updateClubAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await updateClub({
      id: data.get("id"),
      expectedVersion: data.get("expectedVersion"),
      name: data.get("name"),
      shortName: data.get("shortName"),
      status: data.get("status"),
    });
    revalidatePath("/admin/clubs");
    return competitionSuccess("Verein wurde mit Versionsprüfung aktualisiert.");
  } catch (e) {
    return competitionFailure(e);
  }
}
