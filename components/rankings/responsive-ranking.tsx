import { RankingRow } from "@/components/rankings/ranking-row";
import type { MatchdayRankingRow, OverallRankingRow } from "@/features/rankings/types";
export function ResponsiveRanking({
  title,
  rows,
}: {
  title: string;
  rows: Array<OverallRankingRow | MatchdayRankingRow>;
}) {
  return (
    <section className="ranking-section">
      <h2>{title}</h2>
      <div
        className="ranking-table-wrap"
        tabIndex={0}
        role="region"
        aria-label={`${title}-Rangliste, horizontal scrollbar bei Bedarf`}
      >
        <table className="ranking-table">
          <thead>
            <tr>
              <th scope="col">Platz</th>
              <th scope="col">Nickname</th>
              <th scope="col">Punkte</th>
              <th scope="col">Exakt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RankingRow key={row.membership_id!} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
