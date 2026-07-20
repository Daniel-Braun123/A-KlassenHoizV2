import { describe, expect, it } from "vitest";

import { calculateLeagueTable } from "@/features/standings/calculate";
import type { LeagueTableClub, LeagueTableResult } from "@/features/standings/types";

const clubs: LeagueTableClub[] = [
  { id: "b", name: "Berg", logoUrl: null },
  { id: "a", name: "Aidenbach", logoUrl: null },
  { id: "d", name: "Dorf", logoUrl: null },
  { id: "c", name: "City", logoUrl: null },
];

describe("calculateLeagueTable", () => {
  it("wertet offizielle Ergebnisse mit 3/1/0 Punkten aus", () => {
    const results: LeagueTableResult[] = [
      {
        home_club_name: "Aidenbach",
        away_club_name: "Berg",
        home_goals: 2,
        away_goals: 1,
        decision: "official",
      },
      {
        home_club_name: "City",
        away_club_name: "Dorf",
        home_goals: 0,
        away_goals: 0,
        decision: "official",
      },
    ];

    expect(calculateLeagueTable(clubs, results)).toEqual([
      expect.objectContaining({
        clubName: "Aidenbach",
        played: 1,
        goalsFor: 2,
        goalsAgainst: 1,
        points: 3,
        rank: 1,
      }),
      expect.objectContaining({
        clubName: "City",
        played: 1,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 1,
        rank: 2,
      }),
      expect.objectContaining({
        clubName: "Dorf",
        played: 1,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 1,
        rank: 2,
      }),
      expect.objectContaining({
        clubName: "Berg",
        played: 1,
        goalsFor: 1,
        goalsAgainst: 2,
        points: 0,
        rank: 4,
      }),
    ]);
  });

  it("zeigt ungespielte Vereine gleichplatziert und alphabetisch an", () => {
    const rows = calculateLeagueTable(clubs, []);

    expect(rows.map((row) => row.clubName)).toEqual(["Aidenbach", "Berg", "City", "Dorf"]);
    expect(rows.every((row) => row.rank === 1)).toBe(true);
    expect(rows.every((row) => row.played === 0 && row.points === 0)).toBe(true);
  });

  it("ignoriert ausgeschlossene und unvollständige Ergebnisse", () => {
    const results: LeagueTableResult[] = [
      {
        home_club_name: "Aidenbach",
        away_club_name: "Berg",
        home_goals: null,
        away_goals: null,
        decision: "excluded",
      },
      {
        home_club_name: "City",
        away_club_name: "Dorf",
        home_goals: 3,
        away_goals: null,
        decision: "official",
      },
    ];

    expect(calculateLeagueTable(clubs, results).every((row) => row.played === 0)).toBe(true);
  });
});
