import type { Route } from "next";
import { Link } from "@/components/ui/link";
import { getRoundOverview } from "@/features/predictions/service";
import { getMyRound, listRoundMembers } from "@/features/rounds/service";
export default async function RoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  const [round, members, overview] = await Promise.all([
    getMyRound(roundId),
    listRoundMembers(roundId),
    getRoundOverview(roundId),
  ]);
  const hasMatches = (overview?.total_matches ?? 0) > 0;
  const remaining = Math.max(
    0,
    (overview?.total_matches ?? 0) - (overview?.predicted_matches ?? 0),
  );
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">
          {round.league_name} · {round.season_label}
        </p>
        <h1>{round.name}</h1>
        <p>
          {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}.
        </p>
      </div>
      <div className="next-action-card">
        <h2>Nächste Tippaktion</h2>
        {hasMatches ? (
          <>
            <p>
              {remaining
                ? `Noch ${remaining} Spiele ohne Tipp.`
                : "Alle veröffentlichten Spiele sind getippt."}
            </p>
            <Link href={`/rounds/${round.id}/predictions` as Route} variant="button">
              Jetzt tippen
            </Link>
          </>
        ) : (
          <p>Noch ist kein veröffentlichter Spieltag offen.</p>
        )}
      </div>
      <div className="page-actions">
        <Link href={`/rounds/${round.id}/rankings` as Route}>Rangliste</Link>
        <Link href={`/rounds/${round.id}/results` as Route}>Ergebnisse</Link>
        {round.role === "owner" ? (
          <Link href={`/rounds/${round.id}/settings` as Route} variant="button">
            Runde verwalten
          </Link>
        ) : null}
        <Link href={"/start" as Route}>Tipprunden wechseln</Link>
      </div>
    </section>
  );
}
