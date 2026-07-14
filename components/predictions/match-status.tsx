import type { Database } from "@/lib/supabase/database.types";

type MatchStatus = Database["app"]["Enums"]["match_status"];

const labels: Record<MatchStatus, string> = {
  draft: "Entwurf",
  published: "Offen",
  postponed: "Verschoben",
  cancelled: "Abgesagt",
  abandoned: "Abgebrochen",
  completed: "Beendet",
};

export function MatchStatus({ status, open }: { status: MatchStatus | null; open: boolean }) {
  const effective =
    !open && status === "published"
      ? "Tippfrist abgelaufen"
      : status
        ? labels[status]
        : "Unbekannt";
  return (
    <span className={`match-status match-status--${open ? "open" : "locked"}`}>{effective}</span>
  );
}
