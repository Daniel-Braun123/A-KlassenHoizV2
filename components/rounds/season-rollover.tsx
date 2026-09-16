"use client";

import type { Route } from "next";
import { useActionState } from "react";
import { rolloverRoundAction } from "@/features/rounds/actions";
import { initialRoundActionState, type RoundRolloverOption } from "@/features/rounds/types";
import { ActionMessage } from "@/components/ui/action-message";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Select } from "@/components/ui/select";

export function SeasonRollover({
  roundId,
  hasSuccessor,
  roundVersion,
  options,
  successorRoundId,
}: Readonly<{
  roundId: string;
  hasSuccessor: boolean;
  roundVersion: number;
  options: readonly RoundRolloverOption[];
  successorRoundId: string | null;
}>) {
  const [state, action, pending] = useActionState(rolloverRoundAction, initialRoundActionState);

  if (hasSuccessor) {
    return (
      <div className="season-rollover season-rollover--linked">
        <div>
          <h3>Neue Saison</h3>
          <p>Diese Tipprunde wurde bereits in die nächste Saison übernommen.</p>
        </div>
        {successorRoundId ? (
          <Link href={`/rounds/${successorRoundId}` as Route}>Neue Saison öffnen</Link>
        ) : null}
      </div>
    );
  }

  if (!options.length) {
    return (
      <div className="season-rollover season-rollover--empty">
        <h3>Nächste Saison</h3>
        <p>Noch ist keine spätere veröffentlichte Liga zur Übernahme verfügbar.</p>
      </div>
    );
  }

  return (
    <details className="season-rollover season-rollover--action">
      <summary>
        <span>
          <strong>Tipprunde in neue Saison übernehmen</strong>
          <small>Mitglieder und Einstellungen mitnehmen</small>
        </span>
        <Icon name="chevron-right" />
      </summary>
      <form action={action} className="season-rollover__form">
        <input name="sourceRoundId" type="hidden" value={roundId} />
        <input name="expectedVersion" type="hidden" value={roundVersion} />
        <p>
          Die bisherige Saison bleibt mit Endrangliste und Sieger erhalten. In der neuen Tipprunde
          starten Tipps und Punkte bei null.
        </p>
        <Select
          hint="Name, aktive Mitglieder, Rollen und Runden-Nicknames werden übernommen. Der alte Einladungslink wird beendet."
          label="Neue Liga / Saison"
          name="targetLeagueSeasonId"
          required
        >
          {options.map((option) => (
            <option key={option.league_season_id!} value={option.league_season_id!}>
              {option.league_name} · {option.season_label}
            </option>
          ))}
        </Select>
        <ActionMessage state={state} />
        <Button disabled={pending} fullWidth type="submit">
          {pending ? "Neue Tipprunde wird erstellt …" : "Neue Tipprunde erstellen"}
        </Button>
      </form>
    </details>
  );
}
