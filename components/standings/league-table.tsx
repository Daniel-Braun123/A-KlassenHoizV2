import { ClubLogo } from "@/components/competition/club-logo";
import type { LeagueTableRow } from "@/features/standings/types";

export function LeagueTable({ rows }: Readonly<{ rows: LeagueTableRow[] }>) {
  const evaluatedMatches = rows.reduce((total, row) => total + row.played, 0) / 2;

  return (
    <section className="league-table-section" aria-labelledby="league-table-heading">
      <div className="league-table-summary">
        <h2 className="sr-only" id="league-table-heading">
          Ligatabelle
        </h2>
        <span>{rows.length === 1 ? "1 Mannschaft" : `${rows.length} Mannschaften`}</span>
        <span>
          {evaluatedMatches === 1 ? "1 gewertetes Spiel" : `${evaluatedMatches} gewertete Spiele`}
        </span>
      </div>
      <div className="league-table-wrap">
        <table className="league-table">
          <caption className="sr-only">
            Tabelle der Liga, sortiert nach Punkten, Tordifferenz und erzielten Toren
          </caption>
          <colgroup>
            <col className="league-table__place" />
            <col className="league-table__club" />
            <col className="league-table__played" />
            <col className="league-table__goals" />
            <col className="league-table__points" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Platz</th>
              <th scope="col">Mannschaft</th>
              <th scope="col">
                <abbr title="Spiele">Sp.</abbr>
              </th>
              <th scope="col">
                <abbr title="Torverhältnis">Torv.</abbr>
              </th>
              <th scope="col">
                <abbr title="Punkte">Pkt.</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.clubId}>
                  <td className="league-table__rank">{row.rank}.</td>
                  <th scope="row">
                    <span className="league-table__team">
                      <ClubLogo logoUrl={row.logoUrl} name={row.clubName} size={32} />
                      <span>{row.clubName}</span>
                    </span>
                  </th>
                  <td>{row.played}</td>
                  <td>
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                  <td className="league-table__points-value">{row.points}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="league-table__empty" colSpan={5}>
                  Für diese Liga sind noch keine Mannschaften verfügbar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
