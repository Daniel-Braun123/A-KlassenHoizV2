import type { LeagueTableClub, LeagueTableResult, LeagueTableRow } from "./types";

type MutableTableRow = {
  clubId: string;
  clubName: string;
  logoUrl: string | null;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

function compareClubNames(left: string, right: string): number {
  return left.localeCompare(right, "de", { numeric: true, sensitivity: "base" });
}

function sportingKey(row: MutableTableRow): string {
  return `${row.points}:${row.goalsFor - row.goalsAgainst}:${row.goalsFor}`;
}

export function calculateLeagueTable(
  clubs: readonly LeagueTableClub[],
  results: readonly LeagueTableResult[],
): LeagueTableRow[] {
  const rows = new Map<string, MutableTableRow>();

  for (const club of clubs) {
    rows.set(club.name, {
      clubId: club.id,
      clubName: club.name,
      logoUrl: club.logoUrl,
      played: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  for (const result of results) {
    if (
      result.decision !== "official" ||
      result.home_goals === null ||
      result.away_goals === null ||
      !result.home_club_name ||
      !result.away_club_name
    ) {
      continue;
    }

    const home = rows.get(result.home_club_name);
    const away = rows.get(result.away_club_name);
    if (!home || !away) continue;

    home.played += 1;
    home.goalsFor += result.home_goals;
    home.goalsAgainst += result.away_goals;
    away.played += 1;
    away.goalsFor += result.away_goals;
    away.goalsAgainst += result.home_goals;

    if (result.home_goals > result.away_goals) {
      home.points += 3;
    } else if (result.home_goals < result.away_goals) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  const sorted = [...rows.values()].sort((left, right) => {
    const pointDifference = right.points - left.points;
    if (pointDifference) return pointDifference;

    const goalDifference =
      right.goalsFor - right.goalsAgainst - (left.goalsFor - left.goalsAgainst);
    if (goalDifference) return goalDifference;

    const goalsScoredDifference = right.goalsFor - left.goalsFor;
    if (goalsScoredDifference) return goalsScoredDifference;

    return compareClubNames(left.clubName, right.clubName);
  });

  let previousKey: string | null = null;
  let rank = 0;

  return sorted.map((row, index) => {
    const key = sportingKey(row);
    if (key !== previousKey) rank = index + 1;
    previousKey = key;
    return { ...row, rank };
  });
}
