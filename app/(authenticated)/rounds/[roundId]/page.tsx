import type { Route } from "next";
import { MatchdayRecap } from "@/components/rounds/matchday-recap";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { getLatestMatchdayRecap, getRoundOverview } from "@/features/predictions/service";
import { getMyRound, listRoundMembers } from "@/features/rounds/service";
export default async function RoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  const [round, members, overview, recap] = await Promise.all([
    getMyRound(roundId),
    listRoundMembers(roundId),
    getRoundOverview(roundId),
    getLatestMatchdayRecap(roundId),
  ]);
  const hasMatches = (overview?.total_matches ?? 0) > 0;
  const remaining = Math.max(
    0,
    (overview?.total_matches ?? 0) - (overview?.predicted_matches ?? 0),
  );
  return (
    <section className="content-page round-overview-page">
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
        <div className="next-action-card__heading">
          <span className="next-action-card__icon" aria-hidden="true">
            <Icon name="calendar" />
          </span>
          <div>
            <h2>Nächste Tippaktion</h2>
            {hasMatches ? (
              <p>
                {remaining
                  ? `Noch ${remaining} Spiele ohne Tipp.`
                  : "Alle offenen Spiele sind getippt."}
              </p>
            ) : (
              <p>Noch ist kein veröffentlichter Spieltag offen.</p>
            )}
          </div>
        </div>
        {hasMatches ? (
          <Link
            className="next-action-card__button"
            href={`/rounds/${roundId}/predictions` as Route}
            variant="button"
          >
            {remaining ? "Jetzt tippen" : "Tipps ansehen"}
          </Link>
        ) : null}
      </div>
      {recap ? <MatchdayRecap recap={recap} roundId={roundId} /> : null}
      <div className="page-actions round-overview-actions">
        {round.role === "owner" ? (
          <Link
            className="round-overview-actions__manage"
            href={`/rounds/${roundId}/settings` as Route}
          >
            <Icon name="settings" />
            <span>Runde verwalten</span>
            <Icon className="round-overview-actions__chevron" name="chevron-right" />
          </Link>
        ) : null}
        <Link className="round-overview-actions__switch" href={"/start" as Route}>
          Tipprunden wechseln
        </Link>
      </div>
    </section>
  );
}
