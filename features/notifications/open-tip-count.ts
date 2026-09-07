import { berlinToday, nearestMatchdayId } from "@/features/competition/matchday-period";
import type { Database } from "@/lib/supabase/database.types";

export type BadgePredictionRow = Pick<
  Database["api"]["Views"]["matchday_prediction_sheet"]["Row"],
  | "round_id"
  | "matchday_id"
  | "match_id"
  | "starts_on"
  | "ends_on"
  | "is_open"
  | "predicted_home_goals"
  | "predicted_away_goals"
>;

export function countCurrentMatchdayOpenTips(
  rows: readonly BadgePredictionRow[],
  today = berlinToday(),
): number {
  const rounds = new Map<
    string,
    Map<string, { id: string; startsOn: string; endsOn: string; missing: Set<string> }>
  >();
  for (const row of rows) {
    if (!row.round_id || !row.matchday_id || !row.starts_on || !row.ends_on) continue;
    const days = rounds.get(row.round_id) ?? new Map();
    const day = days.get(row.matchday_id) ?? {
      id: row.matchday_id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      missing: new Set<string>(),
    };
    if (
      row.match_id &&
      row.is_open &&
      (row.predicted_home_goals === null || row.predicted_away_goals === null)
    ) {
      day.missing.add(row.match_id);
    }
    days.set(day.id, day);
    rounds.set(row.round_id, days);
  }

  let count = 0;
  for (const days of rounds.values()) {
    const selectedId = nearestMatchdayId([...days.values()], undefined, today);
    if (selectedId) count += days.get(selectedId)?.missing.size ?? 0;
  }
  return count;
}
