"use server";
import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import { setSeasonCompletion } from "./season-completion-service";
import type { CompetitionActionState } from "./types";

export async function setSeasonCompletionAction(
  _: CompetitionActionState,
  form: FormData,
): Promise<CompetitionActionState> {
  try {
    const completed = form.get("completed") === "true";
    await setSeasonCompletion({
      id: form.get("id"),
      expectedVersion: form.get("expectedVersion"),
      completed,
    });
    revalidatePath("/admin/competitions", "layout");
    revalidatePath("/admin/competitions/[leagueId]", "layout");
    revalidatePath("/rounds/[roundId]", "layout");
    revalidatePath("/start");
    return competitionSuccess(
      completed
        ? "Die Saison ist abgeschlossen. Die Auswertung ist in den Tipprunden sichtbar."
        : "Die Saison ist wieder geöffnet. Ergebnisse und Spielplan können korrigiert werden.",
    );
  } catch (error) {
    const failure = competitionFailure(error);
    return failure.code === "INVALID_INPUT"
      ? {
          ...failure,
          message:
            "Die Saison kann noch nicht abgeschlossen werden. Lade die Ansicht neu und prüfe die offenen Spiele und Spieltage.",
        }
      : failure;
  }
}
