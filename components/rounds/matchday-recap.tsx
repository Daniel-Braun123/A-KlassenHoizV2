import type { Route } from "next";

import { Link } from "@/components/ui/link";
import { formatMatchdayOptionLabel } from "@/features/competition/matchday-period";
import type { MatchdayRecap as MatchdayRecapData } from "@/features/rounds/matchday-recap";

function rankChangeCopy(change: number | null): Readonly<{ value: string; label: string }> {
  if (change === null) return { value: "–", label: "Rangtrend" };
  if (change === 0) return { value: "±0", label: "Rangtrend" };
  return {
    value: change > 0 ? `+${change}` : `−${Math.abs(change)}`,
    label: "Rangtrend",
  };
}

export function MatchdayRecap({
  recap,
  roundId,
}: Readonly<{ recap: MatchdayRecapData; roundId: string }>) {
  const change = rankChangeCopy(recap.overallRankChange);

  return (
    <section className="matchday-recap" aria-labelledby="matchday-recap-title">
      <header className="matchday-recap__heading">
        <h2 id="matchday-recap-title">Letzter Spieltag</h2>
        <p>{formatMatchdayOptionLabel(recap.displayName)} · abgeschlossen</p>
      </header>

      <dl className="matchday-recap__metrics">
        <div>
          <dt>Punkte</dt>
          <dd>{recap.points}</dd>
        </div>
        <div>
          <dt>Platz</dt>
          <dd>{recap.matchdayRank}</dd>
        </div>
        <div>
          <dt>{change.label}</dt>
          <dd>{change.value}</dd>
        </div>
      </dl>

      <Link
        className="matchday-recap__ranking-link"
        href={
          `/rounds/${roundId}/rankings?matchday=${encodeURIComponent(recap.matchdayId)}` as Route
        }
      >
        Zur Spieltagsrangliste
      </Link>
    </section>
  );
}
