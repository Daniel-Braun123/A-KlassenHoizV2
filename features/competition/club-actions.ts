"use server";

import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import { createClubWithMedia, updateClubWithMedia } from "./logo-service";
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
    await createClubWithMedia(
      {
        name: data.get("name"),
        logoMode: data.get("logoMode"),
        logoUrl: data.get("logoUrl"),
      },
      data.get("logo"),
    );
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
    await updateClubWithMedia(
      {
        id: data.get("id"),
        expectedVersion: data.get("expectedVersion"),
        name: data.get("name"),
        logoMode: data.get("logoMode"),
        logoUrl: data.get("logoUrl"),
      },
      data.get("logo"),
    );
    revalidateClubAdmin();
    return competitionSuccess("Verein wurde aktualisiert.");
  } catch (error) {
    return competitionFailure(error);
  }
}
