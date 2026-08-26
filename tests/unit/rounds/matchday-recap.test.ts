import { describe, expect, it } from "vitest";

import type { PredictionSheetRow } from "@/features/predictions/types";
import type { MatchdayRankingRow } from "@/features/rankings/types";
import { buildLatestMatchdayRecap } from "@/features/rounds/matchday-recap";

function sheetRow(overrides: Partial<PredictionSheetRow>): PredictionSheetRow {
  return {
    away_club_id: "away",
    away_club_name: "Auswärts",
    away_club_short_name: null,
    away_logo_path: null,
    away_logo_url: null,
    display_name: "Hinrunde · Spieltag 1",
    ends_on: "2026-08-23",
    home_club_id: "home",
    home_club_name: "Heim",
    home_club_short_name: null,
    home_logo_path: null,
    home_logo_url: null,
    is_open: false,
    kickoff_at: "2026-08-22T13:00:00.000Z",
    match_id: "match-1",
    match_status: "completed",
    matchday_id: "matchday-1",
    matchday_number: 1,
    matchday_status: "published",
    phase: "first_leg",
    predicted_away_goals: 1,
    predicted_home_goals: 2,
    prediction_points: 4,
    prediction_saved_at: "2026-08-22T12:00:00.000Z",
    result_away_goals: 1,
    result_decision: "official",
    result_home_goals: 2,
    result_is_correction: false,
    result_revision_no: 1,
    round_id: "round-1",
    starts_on: "2026-08-21",
    ...overrides,
  };
}

function rankingRow(overrides: Partial<MatchdayRankingRow>): MatchdayRankingRow {
  return {
    display_name: "Hinrunde · Spieltag 1",
    ends_on: "2026-08-23",
    exact_scores: 1,
    is_current_user: true,
    matchday_id: "matchday-1",
    matchday_number: 1,
    membership_id: "member-current",
    membership_status: "active",
    nickname: "Daniel",
    points: 4,
    rank: 1,
    round_id: "round-1",
    scored_tips: 1,
    starts_on: "2026-08-21",
    ...overrides,
  };
}

describe("buildLatestMatchdayRecap", () => {
  it("zeigt keinen Rückblick, solange ein Spiel des Spieltags nicht entschieden ist", () => {
    const result = buildLatestMatchdayRecap(
      [sheetRow({ result_decision: null, result_home_goals: null, result_away_goals: null })],
      [rankingRow({ points: 0 })],
    );

    expect(result).toBeNull();
  });

  it("verwendet den letzten vollständig entschiedenen Spieltag", () => {
    const result = buildLatestMatchdayRecap(
      [
        sheetRow({}),
        sheetRow({
          display_name: "Hinrunde · Spieltag 2",
          ends_on: "2026-08-30",
          kickoff_at: "2026-08-29T13:00:00.000Z",
          match_id: "match-2",
          matchday_id: "matchday-2",
          matchday_number: 2,
          predicted_home_goals: 0,
          predicted_away_goals: 1,
          result_home_goals: 2,
          result_away_goals: 0,
          prediction_points: 0,
        }),
      ],
      [
        rankingRow({}),
        rankingRow({
          is_current_user: false,
          membership_id: "member-other",
          nickname: "Alex",
          points: 2,
          rank: 2,
        }),
        rankingRow({
          display_name: "Hinrunde · Spieltag 2",
          ends_on: "2026-08-30",
          matchday_id: "matchday-2",
          matchday_number: 2,
          points: 0,
          rank: 2,
        }),
        rankingRow({
          display_name: "Hinrunde · Spieltag 2",
          ends_on: "2026-08-30",
          is_current_user: false,
          matchday_id: "matchday-2",
          matchday_number: 2,
          membership_id: "member-other",
          nickname: "Alex",
          points: 4,
          rank: 1,
        }),
      ],
    );

    expect(result).toMatchObject({
      matchdayId: "matchday-2",
      displayName: "Hinrunde · Spieltag 2",
      points: 0,
      matchdayRank: 2,
      overallRankChange: -1,
    });
    expect(result?.matches).toEqual([
      expect.objectContaining({
        id: "match-2",
        predictedHomeGoals: 0,
        predictedAwayGoals: 1,
        resultHomeGoals: 2,
        resultAwayGoals: 0,
        points: 0,
      }),
    ]);
  });

  it("markiert den ersten abgeschlossenen Spieltag ohne erfundene Rangbewegung", () => {
    const result = buildLatestMatchdayRecap([sheetRow({})], [rankingRow({})]);

    expect(result?.overallRankChange).toBeNull();
    expect(result?.points).toBe(4);
    expect(result?.matchdayRank).toBe(1);
  });
});
