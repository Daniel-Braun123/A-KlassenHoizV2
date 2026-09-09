import { describe, expect, it } from "vitest";
import type { OverallRankingRow } from "@/features/rankings/types";
import { buildSeasonReview } from "@/features/rounds/season-review";
const row = (
  id: string,
  rank: number,
  extra: Partial<OverallRankingRow> = {},
): OverallRankingRow => ({
  membership_id: id,
  rank,
  round_id: "round",
  nickname: id,
  membership_status: "active",
  points: 100 - rank,
  exact_scores: 0,
  scored_tips: 0,
  is_current_user: false,
  ...extra,
});
describe("season podium", () => {
  it("keeps all ties and competition ranks rather than slicing three users", () => {
    const review = buildSeasonReview([
      row("B", 1),
      row("A", 1),
      row("C", 3),
      row("D", 3),
      row("Me", 5, { is_current_user: true }),
    ]);
    expect(review.podium.map((g) => g.rank)).toEqual([1, 3]);
    expect(review.podium[0]!.members.map((m) => m.nickname)).toEqual(["A", "B"]);
    expect(review.podium[1]!.members).toHaveLength(2);
    expect(review.own?.rank).toBe(5);
    expect(review.participantCount).toBe(5);
  });
  it("omits deleted and removed members and handles a single participant", () => {
    const result = buildSeasonReview([
      row("Me", 1, { is_current_user: true }),
      row("Deleted", 2, { membership_status: "anonymized" }),
      row("Removed", 3, { membership_status: "removed" }),
    ]);
    expect(result.participantCount).toBe(1);
    expect(result.podium).toHaveLength(1);
    expect(result.own?.rank).toBe(1);
  });
  it("handles an empty ranking without fabricated winners", () => {
    expect(buildSeasonReview([])).toEqual({ podium: [], own: null, participantCount: 0 });
  });
});
