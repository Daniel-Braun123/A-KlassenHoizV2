"use client";

import { MatchStatus } from "@/components/predictions/match-status";
import { PredictionProgress } from "@/components/predictions/prediction-progress";
import { VisiblePredictions } from "@/components/predictions/visible-predictions";
import { usePredictionAutosave } from "@/features/predictions/use-prediction-autosave";
import type { PredictionSheetRow, VisiblePrediction } from "@/features/predictions/types";

const formatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function initials(name: string | null): string {
  return (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function logoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return path && base ? `${base}/storage/v1/object/public/club-logos/${path}` : null;
}

function Club({ name, logoPath }: { name: string | null; logoPath: string | null }) {
  const src = logoUrl(logoPath);
  return (
    <span className="prediction-club">
      {src ? (
        // Public club logos are presentation content; the adjacent text is the accessible name.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width="40" height="40" />
      ) : (
        <span className="prediction-club__fallback" aria-hidden="true">
          {initials(name)}
        </span>
      )}
      <span>{name}</span>
    </span>
  );
}

function parseGoals(value: string): number | undefined {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 99 ? parsed : undefined;
}

export function PredictionCard({
  match,
  visiblePredictions,
}: {
  match: PredictionSheetRow;
  visiblePredictions: VisiblePrediction[];
}) {
  const autosave = usePredictionAutosave({
    roundId: match.round_id!,
    matchId: match.match_id!,
    initialHomeGoals: match.predicted_home_goals,
    initialAwayGoals: match.predicted_away_goals,
    open: match.is_open === true,
  });
  const homeId = `home-${match.match_id}`;
  const awayId = `away-${match.match_id}`;

  return (
    <article className="prediction-card">
      <header className="prediction-card__meta">
        <time dateTime={match.kickoff_at ?? undefined}>
          {match.kickoff_at ? formatter.format(new Date(match.kickoff_at)) : "Termin offen"}
        </time>
        <MatchStatus status={match.match_status} open={match.is_open === true} />
      </header>
      <div className="prediction-card__teams">
        <label htmlFor={homeId}>
          <Club name={match.home_club_name} logoPath={match.home_logo_path} />
        </label>
        <input
          id={homeId}
          className="prediction-score"
          inputMode="numeric"
          type="number"
          min="0"
          max="99"
          value={autosave.homeGoals ?? ""}
          onChange={(event) => autosave.updateHomeGoals(parseGoals(event.currentTarget.value))}
          disabled={!match.is_open}
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
          value={autosave.awayGoals ?? ""}
          onChange={(event) => autosave.updateAwayGoals(parseGoals(event.currentTarget.value))}
          disabled={!match.is_open}
          aria-label={`Tore ${match.away_club_name}`}
        />
        <label htmlFor={awayId}>
          <Club name={match.away_club_name} logoPath={match.away_logo_path} />
        </label>
      </div>
      <PredictionProgress state={autosave.state} onRetry={autosave.retry} />
      <VisiblePredictions predictions={visiblePredictions} />
    </article>
  );
}
