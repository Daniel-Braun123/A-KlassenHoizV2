import type { Route } from "next";
import { MatchdayRecap } from "@/components/rounds/matchday-recap";
import { SeasonReviewView } from "@/components/rounds/season-review";
import { getSeasonReview } from "@/features/rounds/season-review-service";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import {
  currentMatchdayStatusText,
  summarizeCurrentMatchday,
} from "@/features/predictions/current-matchday-summary";
import { getRoundHomeData } from "@/features/predictions/service";
import { getMyRound, listRoundMembers } from "@/features/rounds/service";
export default async function RoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  const [round, members, home, review] = await Promise.all([
    getMyRound(roundId),
    listRoundMembers(roundId),
    getRoundHomeData(roundId),
    getSeasonReview(roundId),
  ]);
  const currentMatchday = summarizeCurrentMatchday(home.sheet);
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
      {review ? (
        <SeasonReviewView review={review} roundId={roundId} />
      ) : (
        <>
          <div className="next-action-card">
            <div className="next-action-card__heading">
              <span className="next-action-card__icon" aria-hidden="true">
                <Icon name="calendar" />
              </span>
              <div>
                <h2>Aktueller Spieltag</h2>
                {currentMatchday ? (
                  <p>{currentMatchdayStatusText(currentMatchday)}</p>
                ) : (
                  <p>Noch ist kein veröffentlichter Spieltag verfügbar.</p>
                )}
              </div>
            </div>
            {currentMatchday ? (
              <Link
                className="next-action-card__button"
                href={`/rounds/${roundId}/predictions?matchday=${currentMatchday.id}` as Route}
                variant="button"
              >
                {currentMatchday.missingOpenTips ? "Jetzt tippen" : "Tipps ansehen"}
              </Link>
            ) : null}
          </div>
          {home.recap ? <MatchdayRecap recap={home.recap} roundId={roundId} /> : null}
        </>
      )}
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
