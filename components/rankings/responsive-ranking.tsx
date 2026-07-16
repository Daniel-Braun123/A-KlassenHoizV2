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
      <div className="ranking-section__heading">
        <h2>{title}</h2>
        <span>{rows.length === 1 ? "1 Mitglied" : `${rows.length} Mitglieder`}</span>
      </div>
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
            {rows.length ? (
              rows.map((row) => <RankingRow key={row.membership_id!} row={row} />)
            ) : (
              <tr>
                <td className="ranking-table__empty" colSpan={4}>
                  Noch keine Ranglistendaten vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
