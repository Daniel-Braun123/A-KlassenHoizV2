import { describe, expect, it } from "vitest";
import {
  currentMatchdayStatusText,
  summarizeCurrentMatchday,
} from "@/features/predictions/current-matchday-summary";
import type { PredictionSheetRow } from "@/features/predictions/types";

function row(overrides: Partial<PredictionSheetRow> = {}): PredictionSheetRow {
  return {
    round_id: "round-1",
    matchday_id: "day-1",
    matchday_number: 1,
    match_id: "match-1",
    starts_on: "2026-09-05",
    ends_on: "2026-09-06",
    is_open: true,
    predicted_home_goals: null,
    predicted_away_goals: null,
    ...overrides,
  } as PredictionSheetRow;
}

describe("current matchday overview summary", () => {
  it("counts only missing tips in the current matchday", () => {
    const future = Array.from({ length: 80 }, (_, index) =>
      row({
        matchday_id: "future",
        match_id: `future-${index}`,
        starts_on: "2026-09-12",
        ends_on: "2026-09-13",
      }),
    );

    const summary = summarizeCurrentMatchday(
      [row(), row({ match_id: "match-2" }), ...future],
      "2026-09-05",
    );

    expect(summary).toMatchObject({ id: "day-1", missingOpenTips: 2, totalMatches: 2 });
    expect(currentMatchdayStatusText(summary!)).toBe("Noch 2 Spiele ohne Tipp.");
  });

  it("keeps the current matchday selected when every game is tipped", () => {
    const summary = summarizeCurrentMatchday(
      [
        row({ predicted_home_goals: 0, predicted_away_goals: 0 }),
        row({
          matchday_id: "future",
          starts_on: "2026-09-12",
          ends_on: "2026-09-13",
        }),
      ],
      "2026-09-05",
    );

    expect(summary).toMatchObject({ id: "day-1", missingOpenTips: 0, allPredicted: true });
    expect(currentMatchdayStatusText(summary!)).toBe("Aktueller Spieltag vollständig getippt.");
  });

  it("switches to the next matchday after the previous matchday ends", () => {
    const summary = summarizeCurrentMatchday(
      [
        row({ is_open: false }),
        row({
          matchday_id: "future",
          match_id: "future-match",
          starts_on: "2026-09-12",
          ends_on: "2026-09-13",
        }),
      ],
      "2026-09-07",
    );

    expect(summary).toMatchObject({ id: "future", missingOpenTips: 1 });
  });

  it("excludes locked games and uses singular copy for one missing tip", () => {
    const summary = summarizeCurrentMatchday(
      [row({ is_open: false }), row({ match_id: "missing" })],
      "2026-09-05",
    );

    expect(summary).toMatchObject({ missingOpenTips: 1, allPredicted: false });
    expect(currentMatchdayStatusText(summary!)).toBe("Noch 1 Spiel ohne Tipp.");
  });

  it("deduplicates matches and reports an expired deadline", () => {
    const summary = summarizeCurrentMatchday([row({ is_open: false }), row({ is_open: false })]);

    expect(summary).toMatchObject({ totalMatches: 1, missingOpenTips: 0 });
    expect(currentMatchdayStatusText(summary!)).toBe(
      "Die Tippfrist für diesen Spieltag ist beendet.",
    );
  });

  it("returns null when no published matchday games are available", () => {
    expect(summarizeCurrentMatchday([])).toBeNull();
  });
});
