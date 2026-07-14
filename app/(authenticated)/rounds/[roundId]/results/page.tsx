import type { Route } from "next";
import { Link } from "@/components/ui/link";
import { ResultRevisionNotice } from "@/components/rounds/result-revision-notice";
import { getMyRound } from "@/features/rounds/service";
import { listRoundResults } from "@/features/scoring/service";

export default async function ResultsPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  const [round, results] = await Promise.all([getMyRound(roundId), listRoundResults(roundId)]);
  const corrections = results.filter((result) => result.is_correction).length;
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">{round.name}</p>
        <h1>Ergebnisse</h1>
        <p>Offizielle Ergebnisse und nachvollziehbare Korrekturen der zentralen Liga-Saison.</p>
      </div>
      <ResultRevisionNotice count={corrections} />
      <ol className="result-list">
        {results.map((result) => (
          <li key={result.match_id!}>
            <div>
              <span>{result.display_name}</span>
              <time dateTime={result.kickoff_at ?? undefined}>
                {result.kickoff_at
                  ? new Intl.DateTimeFormat("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(result.kickoff_at))
                  : ""}
              </time>
            </div>
            <strong>
              {result.home_club_name}{" "}
              <span>
                {result.decision === "excluded" ? "–" : (result.home_goals ?? "–")} :{" "}
                {result.decision === "excluded" ? "–" : (result.away_goals ?? "–")}
              </span>{" "}
              {result.away_club_name}
            </strong>
            {result.is_correction ? (
              <small>Korrigiert · Revision {result.revision_no}</small>
            ) : null}
          </li>
        ))}
      </ol>
      <Link href={`/rounds/${roundId}` as Route}>Zurück zur Tipprunde</Link>
    </section>
  );
}
