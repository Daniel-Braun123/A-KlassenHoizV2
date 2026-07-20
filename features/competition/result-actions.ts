"use server";

import { revalidatePath } from "next/cache";

import { competitionFailure, competitionSuccess } from "./action-state";
import { setMatchResult, setMatchResultsBatch } from "./result-service";
import type { CompetitionActionState } from "./types";

function revalidateResults(): void {
  revalidatePath("/admin/competitions/[leagueId]/results", "page");
  revalidatePath("/rounds/[roundId]/predictions", "page");
  revalidatePath("/rounds/[roundId]/rankings", "page");
  revalidatePath("/rounds/[roundId]/table", "page");
}

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
    revalidateResults();
    return competitionSuccess(
      `Ergebnis gespeichert. ${result.recalculatedCount} Wertungen wurden neu berechnet.`,
    );
  } catch (error) {
    return competitionFailure(error);
  }
}

export async function setMatchResultsBatchAction(
  _: CompetitionActionState,
  data: FormData,
): Promise<CompetitionActionState> {
  try {
    const serialized = data.get("results");
    const inputs = JSON.parse(typeof serialized === "string" ? serialized : "[]") as unknown;
    const results = await setMatchResultsBatch(inputs);
    revalidateResults();
    const recalculatedCount = results.reduce((sum, result) => sum + result.recalculatedCount, 0);
    return competitionSuccess(
      `${results.length} ${results.length === 1 ? "Ergebnis" : "Ergebnisse"} gespeichert. ` +
        `${recalculatedCount} Wertungen wurden neu berechnet.`,
    );
  } catch (error) {
    return competitionFailure(error);
  }
}
