"use client";

import { getMatchDisplayStatus } from "@/components/predictions/match-status";
import { berlinTimeLabel } from "@/features/competition/schedule-display";
import type { AdminScheduleRow } from "@/features/competition/schedule-service";

export function MatchCenterDisplay({ row, now }: Readonly<{ row: AdminScheduleRow; now: number }>) {
  if (!row.kickoff_at) return null;

  if (row.decision === "official" && row.home_goals !== null && row.away_goals !== null) {
    return (
      <span className="match-center-display match-center-display--result" aria-label="Ergebnis">
        {row.home_goals} : {row.away_goals}
      </span>
    );
  }

  if (row.decision === "excluded") {
    return <span className="match-center-display match-center-display--status">Ohne Wertung</span>;
  }

  const displayStatus = getMatchDisplayStatus({
    decision: row.decision,
    kickoffAt: row.kickoff_at,
    now,
    status: row.match_status,
  });

  if (displayStatus === "live") {
    return (
      <span className="match-center-display match-center-display--live" aria-label="Live">
        LIVE
        <span className="match-center-display__live-dot" aria-hidden="true" />
      </span>
    );
  }

  const statusLabel =
    displayStatus === "result_missing"
      ? "Ergebnis fehlt"
      : displayStatus === "postponed"
        ? "Verschoben"
        : displayStatus === "cancelled"
          ? "Abgesagt"
          : displayStatus === "abandoned"
            ? "Abgebrochen"
            : null;

  return (
    <span className={`match-center-display${statusLabel ? " match-center-display--status" : ""}`}>
      {statusLabel ?? berlinTimeLabel(row.kickoff_at).replace(/ Uhr$/, "")}
    </span>
  );
}
