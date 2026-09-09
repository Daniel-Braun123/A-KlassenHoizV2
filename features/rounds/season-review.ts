import type { OverallRankingRow } from "@/features/rankings/types";

export type SeasonReview = Readonly<{
  podium: readonly Readonly<{ rank: number; members: readonly OverallRankingRow[] }>[];
  own: OverallRankingRow | null;
  participantCount: number;
}>;

export function buildSeasonReview(rows: readonly OverallRankingRow[]): SeasonReview {
  const visible = rows.filter(
    (row) =>
      row.membership_id &&
      row.rank &&
      row.membership_status !== "anonymized" &&
      row.membership_status !== "removed",
  );
  return {
    podium: [1, 2, 3]
      .map((rank) => ({
        rank,
        members: visible
          .filter((row) => row.rank === rank)
          .toSorted((a, b) => (a.nickname ?? "").localeCompare(b.nickname ?? "", "de")),
      }))
      .filter((group) => group.members.length > 0),
    own: visible.find((row) => row.is_current_user) ?? null,
    participantCount: visible.length,
  };
}
