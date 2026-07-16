"use client";

import { PredictionCard } from "@/components/predictions/prediction-card";
import { berlinDateKey, berlinDateLabel } from "@/features/competition/schedule-display";
import type { PredictionSheetRow, VisiblePrediction } from "@/features/predictions/types";

export type PredictionDraft = Readonly<{
  homeGoals: string;
  awayGoals: string;
}>;

export function PredictionList({
  drafts,
  matches,
  onDraftChange,
  pending,
  visible,
}: {
  drafts: Readonly<Record<string, PredictionDraft>>;
  matches: PredictionSheetRow[];
  onDraftChange: (matchId: string, change: Partial<PredictionDraft>) => void;
  pending: boolean;
  visible: VisiblePrediction[];
}) {
  const byMatch = new Map<string, VisiblePrediction[]>();
  for (const prediction of visible) {
    if (!prediction.match_id) continue;
    const current = byMatch.get(prediction.match_id) ?? [];
    current.push(prediction);
    byMatch.set(prediction.match_id, current);
  }
  const groups = new Map<
    string,
    { dateKey: string; dateLabel: string; matches: PredictionSheetRow[] }
  >();
  for (const match of matches) {
    const dateKey = match.kickoff_at ? berlinDateKey(match.kickoff_at) : "without-date";
    const current = groups.get(dateKey);
    if (current) {
      current.matches.push(match);
    } else {
      groups.set(dateKey, {
        dateKey,
        dateLabel: match.kickoff_at ? berlinDateLabel(match.kickoff_at) : "Termin offen",
        matches: [match],
      });
    }
  }

  return (
    <section className="prediction-date-groups" aria-label="Spiele dieses Spieltags">
      {[...groups.values()].map((group) => (
        <section
          aria-labelledby={`prediction-date-${group.dateKey}`}
          className="match-date-group"
          key={group.dateKey}
        >
          <h2 className="match-date-group__heading" id={`prediction-date-${group.dateKey}`}>
            {group.dateLabel}
          </h2>
          <div className="prediction-list">
            {group.matches.map((match) => {
              const matchId = match.match_id!;
              const draft = drafts[matchId] ?? { homeGoals: "", awayGoals: "" };
              return (
                <PredictionCard
                  awayGoals={draft.awayGoals}
                  homeGoals={draft.homeGoals}
                  key={matchId}
                  match={match}
                  onAwayGoalsChange={(value) => onDraftChange(matchId, { awayGoals: value })}
                  onHomeGoalsChange={(value) => onDraftChange(matchId, { homeGoals: value })}
                  pending={pending}
                  visiblePredictions={byMatch.get(matchId) ?? []}
                />
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
