import { berlinToday, nearestMatchdayId } from "@/features/competition/matchday-period";

import type { PredictionSheetRow } from "./types";

export type CurrentMatchdaySummary = Readonly<{
  id: string;
  missingOpenTips: number;
  totalMatches: number;
  allPredicted: boolean;
}>;

type MatchdayGroup = {
  id: string;
  startsOn: string;
  endsOn: string;
  matches: Map<string, PredictionSheetRow>;
};

export function summarizeCurrentMatchday(
  rows: readonly PredictionSheetRow[],
  today = berlinToday(),
): CurrentMatchdaySummary | null {
  const matchdays = new Map<string, MatchdayGroup>();

  for (const row of rows) {
    if (!row.matchday_id || !row.starts_on || !row.ends_on || !row.match_id) continue;

    const matchday = matchdays.get(row.matchday_id) ?? {
      id: row.matchday_id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      matches: new Map<string, PredictionSheetRow>(),
    };
    matchday.matches.set(row.match_id, row);
    matchdays.set(matchday.id, matchday);
  }

  const selectedId = nearestMatchdayId([...matchdays.values()], undefined, today);
  const selected = selectedId ? matchdays.get(selectedId) : undefined;
  if (!selected || selected.matches.size === 0) return null;

  const matches = [...selected.matches.values()];
  const isPredicted = (row: PredictionSheetRow) =>
    row.predicted_home_goals !== null && row.predicted_away_goals !== null;

  return {
    id: selected.id,
    missingOpenTips: matches.filter((row) => row.is_open && !isPredicted(row)).length,
    totalMatches: matches.length,
    allPredicted: matches.every(isPredicted),
  };
}

export function currentMatchdayStatusText(summary: CurrentMatchdaySummary): string {
  if (summary.missingOpenTips === 1) return "Noch 1 Spiel ohne Tipp.";
  if (summary.missingOpenTips > 1) {
    return `Noch ${summary.missingOpenTips} Spiele ohne Tipp.`;
  }
  if (summary.allPredicted) return "Aktueller Spieltag vollständig getippt.";
  return "Die Tippfrist für diesen Spieltag ist beendet.";
}
