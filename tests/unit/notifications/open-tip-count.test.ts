import { describe, expect, it } from "vitest";
import {
  countCurrentMatchdayOpenTips,
  type BadgePredictionRow,
} from "@/features/notifications/open-tip-count";

function row(overrides: Partial<BadgePredictionRow> = {}): BadgePredictionRow {
  return {
    round_id: "round-1",
    matchday_id: "day-1",
    match_id: "match-1",
    starts_on: "2026-09-05",
    ends_on: "2026-09-06",
    is_open: true,
    predicted_home_goals: null,
    predicted_away_goals: null,
    ...overrides,
  };
}

describe("current matchday app badge", () => {
  it("counts only the current matchday despite an entire season of future games", () => {
    const future = Array.from({ length: 80 }, (_, index) =>
      row({
        matchday_id: "future",
        match_id: `future-${index}`,
        starts_on: "2026-09-12",
        ends_on: "2026-09-13",
      }),
    );
    expect(
      countCurrentMatchdayOpenTips([row(), row({ match_id: "match-2" }), ...future], "2026-09-05"),
    ).toBe(2);
  });
  it("does not move to a later matchday when the current one is fully tipped", () => {
    expect(
      countCurrentMatchdayOpenTips(
        [
          row({ predicted_home_goals: 0, predicted_away_goals: 0 }),
          row({ matchday_id: "future", starts_on: "2026-09-12", ends_on: "2026-09-13" }),
        ],
        "2026-09-05",
      ),
    ).toBe(0);
  });
  it("switches to the next matchday the day after the previous one ends", () => {
    expect(
      countCurrentMatchdayOpenTips(
        [
          row({ is_open: false }),
          row({ matchday_id: "future", starts_on: "2026-09-12", ends_on: "2026-09-13" }),
        ],
        "2026-09-07",
      ),
    ).toBe(1);
  });
  it("excludes locked games and counts a saved 0:0 as complete", () => {
    expect(
      countCurrentMatchdayOpenTips(
        [
          row({ is_open: false }),
          row({ match_id: "tipped", predicted_home_goals: 0, predicted_away_goals: 0 }),
          row({ match_id: "missing" }),
        ],
        "2026-09-05",
      ),
    ).toBe(1);
  });
  it("adds only each round's current matchday and deduplicates the same game within a round", () => {
    expect(
      countCurrentMatchdayOpenTips([row(), row(), row({ round_id: "round-2" })], "2026-09-05"),
    ).toBe(2);
  });
  it("clears the badge for an empty or completed schedule", () => {
    expect(countCurrentMatchdayOpenTips([], "2026-09-07")).toBe(0);
    expect(countCurrentMatchdayOpenTips([row({ is_open: false })], "2026-09-07")).toBe(0);
  });
});
