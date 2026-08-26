import type { MatchdayRankingRow } from "@/features/rankings/types";
import type { PredictionSheetRow } from "@/features/predictions/types";

export type MatchdayRecapMatch = Readonly<{
  id: string;
  kickoffAt: string;
  homeClubName: string;
  homeLogoUrl: string | null;
  awayClubName: string;
  awayLogoUrl: string | null;
  predictedHomeGoals: number | null;
  predictedAwayGoals: number | null;
  resultHomeGoals: number | null;
  resultAwayGoals: number | null;
  resultDecision: "official" | "excluded";
  points: number | null;
}>;

export type MatchdayRecap = Readonly<{
  matchdayId: string;
  displayName: string;
  points: number;
  matchdayRank: number;
  overallRankChange: number | null;
  matches: readonly MatchdayRecapMatch[];
}>;

type MatchdayGroup = Readonly<{
  id: string;
  displayName: string;
  endsOn: string;
  number: number;
  rows: readonly PredictionSheetRow[];
}>;

function groupCompletedMatchdays(rows: readonly PredictionSheetRow[]): MatchdayGroup[] {
  const groups = new Map<string, PredictionSheetRow[]>();

  for (const row of rows) {
    if (!row.matchday_id || !row.match_id) continue;
    const group = groups.get(row.matchday_id) ?? [];
    group.push(row);
    groups.set(row.matchday_id, group);
  }

  return [...groups.entries()]
    .flatMap(([id, group]) => {
      if (
        group.length === 0 ||
        group.some(
          (row) => row.result_decision !== "official" && row.result_decision !== "excluded",
        )
      ) {
        return [];
      }

      const first = group[0]!;
      return [
        {
          id,
          displayName: first.display_name?.trim() || `${first.matchday_number ?? ""}. Spieltag`,
          endsOn: first.ends_on ?? "",
          number: first.matchday_number ?? 0,
          rows: group,
        },
      ];
    })
    .toSorted(
      (left, right) =>
        left.endsOn.localeCompare(right.endsOn) ||
        left.number - right.number ||
        left.id.localeCompare(right.id),
    );
}

function cumulativeTotals(
  rows: readonly MatchdayRankingRow[],
  includedMatchdayIds: ReadonlySet<string>,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (!row.membership_id || !row.matchday_id || !includedMatchdayIds.has(row.matchday_id)) {
      continue;
    }
    totals.set(row.membership_id, (totals.get(row.membership_id) ?? 0) + (row.points ?? 0));
  }

  return totals;
}

function competitionRank(totals: ReadonlyMap<string, number>, membershipId: string): number {
  const points = totals.get(membershipId) ?? 0;
  return 1 + [...totals.values()].filter((candidate) => candidate > points).length;
}

export function buildLatestMatchdayRecap(
  sheetRows: readonly PredictionSheetRow[],
  rankingRows: readonly MatchdayRankingRow[],
): MatchdayRecap | null {
  const completed = groupCompletedMatchdays(sheetRows);
  const latest = completed.at(-1);
  if (!latest) return null;

  const currentRanking = rankingRows.find(
    (row) => row.matchday_id === latest.id && row.is_current_user,
  );
  if (!currentRanking?.membership_id) return null;

  const completedIds = new Set(completed.map((matchday) => matchday.id));
  const currentTotals = cumulativeTotals(rankingRows, completedIds);
  const previousIds = new Set(completed.slice(0, -1).map((matchday) => matchday.id));
  const previousTotals = cumulativeTotals(rankingRows, previousIds);
  const currentOverallRank = competitionRank(currentTotals, currentRanking.membership_id);
  const previousOverallRank = previousIds.size
    ? competitionRank(previousTotals, currentRanking.membership_id)
    : null;

  const matches = latest.rows
    .flatMap((row): MatchdayRecapMatch[] => {
      if (
        !row.match_id ||
        !row.kickoff_at ||
        !row.home_club_name ||
        !row.away_club_name ||
        (row.result_decision !== "official" && row.result_decision !== "excluded")
      ) {
        return [];
      }

      return [
        {
          id: row.match_id,
          kickoffAt: row.kickoff_at,
          homeClubName: row.home_club_name,
          homeLogoUrl: row.home_logo_url,
          awayClubName: row.away_club_name,
          awayLogoUrl: row.away_logo_url,
          predictedHomeGoals: row.predicted_home_goals,
          predictedAwayGoals: row.predicted_away_goals,
          resultHomeGoals: row.result_home_goals,
          resultAwayGoals: row.result_away_goals,
          resultDecision: row.result_decision,
          points: row.prediction_points,
        },
      ];
    })
    .toSorted(
      (left, right) =>
        left.kickoffAt.localeCompare(right.kickoffAt) || left.id.localeCompare(right.id),
    );

  return {
    matchdayId: latest.id,
    displayName: latest.displayName,
    points: currentRanking.points ?? 0,
    matchdayRank: currentRanking.rank ?? 1,
    overallRankChange:
      previousOverallRank === null ? null : previousOverallRank - currentOverallRank,
    matches,
  };
}
