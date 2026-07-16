"use client";

import { useEffect, useState } from "react";

import type { Database } from "@/lib/supabase/database.types";

type MatchStatusValue = Database["app"]["Enums"]["match_status"];
type ResultDecision = Database["app"]["Enums"]["result_decision"];
type DisplayStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "result_missing"
  | "completed"
  | "postponed"
  | "cancelled"
  | "abandoned"
  | "unknown";

const labels: Record<Exclude<DisplayStatus, "live">, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  result_missing: "Ergebnis ausstehend",
  completed: "Beendet",
  postponed: "Verschoben",
  cancelled: "Abgesagt",
  abandoned: "Abgebrochen",
  unknown: "Unbekannt",
};

export function getMatchDisplayStatus({
  status,
  kickoffAt,
  decision,
  now,
}: {
  status: MatchStatusValue | null;
  kickoffAt?: string | null | undefined;
  decision?: ResultDecision | null | undefined;
  now: number;
}): DisplayStatus {
  if (status === "postponed" || status === "cancelled" || status === "abandoned") return status;
  if (decision || status === "completed") return "completed";
  if (status === "draft") return "draft";
  if (!kickoffAt) return status === "published" ? "scheduled" : "unknown";
  const kickoff = new Date(kickoffAt).getTime();
  if (!Number.isFinite(kickoff)) return "unknown";
  if (now < kickoff) return "scheduled";
  if (now < kickoff + 90 * 60 * 1000) return "live";
  return "result_missing";
}

export function MatchStatus({
  status,
  open,
  kickoffAt,
  decision,
  hideScheduled = false,
}: {
  status: MatchStatusValue | null;
  open: boolean;
  kickoffAt?: string | null;
  decision?: ResultDecision | null;
  hideScheduled?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!kickoffAt || decision || status === "completed") return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [decision, kickoffAt, status]);

  const displayStatus = kickoffAt
    ? getMatchDisplayStatus({ status, kickoffAt, decision, now })
    : status === "published" && !open
      ? "result_missing"
      : getMatchDisplayStatus({ status, kickoffAt, decision, now });
  const className =
    displayStatus === "live"
      ? "match-status match-status--live"
      : displayStatus === "scheduled"
        ? "match-status match-status--open"
        : "match-status match-status--locked";

  if (hideScheduled && displayStatus === "scheduled") return null;

  if (displayStatus === "live") {
    return (
      <span className={className} aria-label="LIVE">
        LIVE
        <span className="match-status__live-dot" aria-hidden="true" />
      </span>
    );
  }

  return <span className={className}>{labels[displayStatus]}</span>;
}
