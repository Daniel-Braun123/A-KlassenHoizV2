"use server";

import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import { createClub, updateClub } from "./club-service";
import type { CompetitionActionState } from "./types";

function revalidateClubAdmin(): void {
  revalidatePath("/admin/clubs");
  revalidatePath("/admin/competitions");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/results");
}

export async function createClubAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    await createClub({ name: data.get("name"), logoUrl: data.get("logoUrl") });
    revalidateClubAdmin();
    return competitionSuccess("Verein wurde angelegt.");
  } catch (error) {
    return competitionFailure(error);
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
      logoUrl: data.get("logoUrl"),
    });
    revalidateClubAdmin();
    return competitionSuccess("Verein wurde aktualisiert.");
  } catch (error) {
    return competitionFailure(error);
  }
}
