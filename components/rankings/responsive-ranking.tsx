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
      <div className="ranking-table-wrap">
        <table className="ranking-table">
          <colgroup>
            <col className="ranking-table__col ranking-table__col--rank" />
            <col className="ranking-table__col ranking-table__col--nickname" />
            <col className="ranking-table__col ranking-table__col--metric" span={3} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" aria-label="Platz">
                <span className="ranking-table__label ranking-table__label--short">Pl.</span>
                <span className="ranking-table__label ranking-table__label--long">Platz</span>
              </th>
              <th scope="col" aria-label="Nickname">
                <span className="ranking-table__label ranking-table__label--short">Name</span>
                <span className="ranking-table__label ranking-table__label--long">Nickname</span>
              </th>
              <th scope="col" aria-label="Punkte">
                <span className="ranking-table__label ranking-table__label--short">Pkt.</span>
                <span className="ranking-table__label ranking-table__label--long">Punkte</span>
              </th>
              <th scope="col" aria-label="Exakte Ergebnisse">
                <span className="ranking-table__label">Exakt</span>
              </th>
              <th scope="col" aria-label="Gewertete Tipps">
                <span className="ranking-table__label">Tipps</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => <RankingRow key={row.membership_id!} row={row} />)
            ) : (
              <tr>
                <td className="ranking-table__empty" colSpan={5}>
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
