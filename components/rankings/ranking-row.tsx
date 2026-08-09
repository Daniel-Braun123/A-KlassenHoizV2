import { HistoricalMemberLabel } from "@/components/rankings/historical-member-label";
import type { MatchdayRankingRow, OverallRankingRow } from "@/features/rankings/types";

export function RankingRow({ row }: { row: OverallRankingRow | MatchdayRankingRow }) {
  return (
    <tr className={row.is_current_user ? "ranking-row ranking-row--current" : "ranking-row"}>
      <td>
        <strong>{row.rank}</strong>
      </td>
      <th scope="row" className="ranking-row__identity">
        <span className="ranking-row__name">
          <HistoricalMemberLabel nickname={row.nickname} status={row.membership_status} />
        </span>
        {row.is_current_user ? <span className="ranking-row__you">Du</span> : null}
      </th>
      <td>{row.points}</td>
      <td>{row.exact_scores}</td>
      <td>{row.scored_tips}</td>
    </tr>
  );
}
