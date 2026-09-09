import type { Route } from "next";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import type { SeasonReview } from "@/features/rounds/season-review";
import "@/styles/season-completion.css";

export function SeasonReviewView({ review, roundId }: { review: SeasonReview; roundId: string }) {
  return (
    <section className="season-review" aria-labelledby="season-review-title">
      <header className="season-review__heading">
        <Icon name="trophy" />
        <h2 id="season-review-title">Saison abgeschlossen</h2>
        <p>Die Endplatzierungen deiner Tipprunde</p>
      </header>
      {review.podium.length ? (
        <ol className="season-podium" aria-label="Podest der Saison">
          {review.podium.map((group) => (
            <li
              key={group.rank}
              className={`season-podium__place season-podium__place--${group.rank}`}
              value={group.rank}
            >
              <div className="season-podium__members">
                <span className="season-podium__label">
                  Platz {group.rank}
                  {group.members.length > 1 ? " · geteilt" : ""}
                </span>
                {group.members.map((member) => (
                  <div className="season-podium__member" key={member.membership_id}>
                    <strong>
                      {member.nickname}
                      {member.is_current_user ? (
                        <span className="season-podium__you"> · Du</span>
                      ) : null}
                    </strong>
                    <span>{member.points ?? 0} Punkte</span>
                  </div>
                ))}
              </div>
              <div className="season-podium__step" aria-hidden="true">
                {group.rank}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p>Es sind keine Platzierungen verfügbar.</p>
      )}
      {review.own ? (
        <div className="season-review__own">
          <div>
            <h3>Dein Saisonergebnis</h3>
            <p>
              Platz <strong>{review.own.rank}</strong> von {review.participantCount}
            </p>
          </div>
          <p className="season-review__points">
            <strong>{review.own.points ?? 0}</strong> Punkte
          </p>
        </div>
      ) : (
        <p>Für dich ist keine eigene Platzierung verfügbar.</p>
      )}
      <Link
        className="season-review__ranking"
        href={`/rounds/${roundId}/rankings` as Route}
        variant="button"
      >
        Gesamte Endrangliste ansehen
      </Link>
    </section>
  );
}
