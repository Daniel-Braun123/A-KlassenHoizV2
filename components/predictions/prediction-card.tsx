"use client";

import { useEffect, useState } from "react";

import { ClubLogo } from "@/components/competition/club-logo";
import { MatchStatus } from "@/components/predictions/match-status";
import { VisiblePredictions } from "@/components/predictions/visible-predictions";
import { berlinTimeLabel } from "@/features/competition/schedule-display";
import type { PredictionSheetRow, VisiblePrediction } from "@/features/predictions/types";

function storedLogoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return path && base ? `${base}/storage/v1/object/public/club-logos/${path}` : null;
}

function Club({
  name,
  logoPath,
  logoUrl,
}: {
  name: string | null;
  logoPath: string | null;
  logoUrl: string | null;
}) {
  const src = logoUrl?.trim() || storedLogoUrl(logoPath);
  return (
    <span className="prediction-club">
      <ClubLogo className="prediction-club__logo" logoUrl={src} name={name} size={32} />
      <span>{name}</span>
    </span>
  );
}

function tipLabel(homeGoals: string, awayGoals: string): string | null {
  return homeGoals !== "" && awayGoals !== "" ? `${homeGoals}:${awayGoals}` : null;
}

function pointsLabel(points: number): string {
  return points > 0 ? `+${points} P` : "0 P";
}

export function PredictionCard({
  awayGoals,
  homeGoals,
  match,
  onAwayGoalsChange,
  onHomeGoalsChange,
  pending,
  visiblePredictions,
}: {
  awayGoals: string;
  homeGoals: string;
  match: PredictionSheetRow;
  onAwayGoalsChange: (value: string) => void;
  onHomeGoalsChange: (value: string) => void;
  pending: boolean;
  visiblePredictions: VisiblePrediction[];
}) {
  const [open, setOpen] = useState(match.is_open === true);

  useEffect(() => {
    if (!open || !match.kickoff_at) return;
    const kickoff = new Date(match.kickoff_at).getTime();
    const interval = window.setInterval(() => {
      if (Date.now() >= kickoff) setOpen(false);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [match.kickoff_at, open]);

  const homeId = `home-${match.match_id}`;
  const awayId = `away-${match.match_id}`;
  const savedTip = tipLabel(homeGoals, awayGoals);
  const officialResult =
    match.result_decision === "official" &&
    match.result_home_goals !== null &&
    match.result_away_goals !== null;

  return (
    <article className="prediction-card">
      <div className="prediction-card__teams">
        <span className="prediction-card__team">
          <Club
            name={match.home_club_name}
            logoPath={match.home_logo_path}
            logoUrl={match.home_logo_url}
          />
        </span>
        <div className="prediction-card__center">
          {open ? (
            <>
              <time className="prediction-card__time" dateTime={match.kickoff_at ?? undefined}>
                {match.kickoff_at
                  ? berlinTimeLabel(match.kickoff_at).replace(/ Uhr$/, "")
                  : "Termin offen"}
              </time>
              <fieldset
                aria-label={`Tipp ${match.home_club_name} gegen ${match.away_club_name}`}
                className="prediction-score-editor"
                disabled={pending}
              >
                <input
                  id={homeId}
                  className="prediction-score"
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="99"
                  value={homeGoals}
                  onChange={(event) => onHomeGoalsChange(event.currentTarget.value)}
                  aria-label={`Tore ${match.home_club_name}`}
                />
                <span className="prediction-card__separator" aria-hidden="true">
                  :
                </span>
                <input
                  id={awayId}
                  className="prediction-score"
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="99"
                  value={awayGoals}
                  onChange={(event) => onAwayGoalsChange(event.currentTarget.value)}
                  aria-label={`Tore ${match.away_club_name}`}
                />
              </fieldset>
            </>
          ) : officialResult ? (
            <>
              <span className="prediction-card__outcome-label">Endstand</span>
              <strong className="prediction-card__result" aria-label="Offizielles Ergebnis">
                {match.result_home_goals} : {match.result_away_goals}
              </strong>
              <span
                className="prediction-card__tip-meta"
                aria-label={
                  savedTip
                    ? `Dein Tipp ${savedTip}${match.prediction_points === null ? "" : `, ${match.prediction_points} Punkte`}`
                    : "Kein Tipp abgegeben"
                }
              >
                {savedTip ? <span>Tipp {savedTip}</span> : <span>Kein Tipp</span>}
                {match.prediction_points !== null ? (
                  <strong
                    className={`prediction-card__points${
                      match.prediction_points === 0 ? " prediction-card__points--zero" : ""
                    }`}
                  >
                    {pointsLabel(match.prediction_points)}
                  </strong>
                ) : null}
              </span>
              {match.result_is_correction ? (
                <span className="prediction-card__correction">Korrigiert</span>
              ) : null}
            </>
          ) : match.result_decision === "excluded" ? (
            <>
              <span className="prediction-card__outcome-label prediction-card__outcome-label--muted">
                Ohne Wertung
              </span>
              <span className="prediction-card__locked-tip">
                {savedTip ? `Tipp ${savedTip}` : "Kein Tipp"}
              </span>
              {match.result_is_correction ? (
                <span className="prediction-card__correction">Korrigiert</span>
              ) : null}
            </>
          ) : (
            <>
              <MatchStatus status={match.match_status} open={false} kickoffAt={match.kickoff_at} />
              <span className="prediction-card__locked-tip">
                {savedTip ? `Tipp ${savedTip}` : "Kein Tipp"}
              </span>
            </>
          )}
        </div>
        <span className="prediction-card__team">
          <Club
            name={match.away_club_name}
            logoPath={match.away_logo_path}
            logoUrl={match.away_logo_url}
          />
        </span>
      </div>
      <VisiblePredictions predictions={visiblePredictions} />
    </article>
  );
}
