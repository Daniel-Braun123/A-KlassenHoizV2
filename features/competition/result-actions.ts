"use server";

import { revalidatePath } from "next/cache";
import { competitionFailure, competitionSuccess } from "./action-state";
import { setMatchResult } from "./result-service";
import type { CompetitionActionState } from "./types";

export async function setMatchResultAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    const decision = String(data.get("decision"));
    const result = await setMatchResult({
      matchId: data.get("matchId"),
      expectedMatchVersion: data.get("expectedMatchVersion"),
      expectedRevision: data.get("expectedRevision"),
      decision,
      homeGoals: decision === "official" ? data.get("homeGoals") : undefined,
      awayGoals: decision === "official" ? data.get("awayGoals") : undefined,
      reason: data.get("reason") || undefined,
    });
    revalidatePath("/admin/results");
    revalidatePath("/rounds/[roundId]/rankings", "page");
    revalidatePath("/rounds/[roundId]/results", "page");
    return competitionSuccess(
      `Ergebnis gespeichert. ${result.recalculatedCount} Wertungen wurden atomar neu berechnet.`,
    );
  } catch (e) {
    return competitionFailure(e);
  }
}
