import type { Database } from "@/lib/supabase/database.types";

export type SeasonCompletion = Database["api"]["Views"]["admin_season_completion"]["Row"];

export function seasonCompletionBlockers(state: SeasonCompletion): string[] {
  const reasons: string[] = [];
  if (!state.total_matches) reasons.push("Es ist noch kein Spiel vorhanden.");
  if (state.missing_results) reasons.push(`${state.missing_results} Spiele noch ohne Ergebnis.`);
  if (state.unfinished_matches)
    reasons.push(
      `${state.unfinished_matches} Spiele sind noch nicht vorbei (frühestens 90 Minuten nach Anstoß).`,
    );
  if (state.unresolved_matches && !state.missing_results)
    reasons.push(`${state.unresolved_matches} Spiele sind noch nicht als abgeschlossen gewertet.`);
  if (state.unpublished_matchdays)
    reasons.push(`${state.unpublished_matchdays} Spieltage sind noch nicht veröffentlicht.`);
  if (state.status === "draft") reasons.push("Veröffentliche zuerst die Liga.");
  if (state.status === "archived") reasons.push("Die Liga ist bereits archiviert.");
  return reasons;
}
