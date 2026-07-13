"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { setMatchResultAction } from "@/features/competition/result-actions";
import { initialCompetitionActionState, type ScheduleRow } from "@/features/competition/types";
import { ActionMessage } from "./action-message";

export function ResultForm({ matches }: Readonly<{ matches: ScheduleRow[] }>) {
  const [state, action, pending] = useActionState(
    setMatchResultAction,
    initialCompetitionActionState,
  );
  return (
    <form action={action} className="admin-form admin-form--wide">
      <h2>Ergebnis oder Korrektur</h2>
      <p className="admin-form__warning">
        Eine Korrektur wirkt global. Jede Änderung wird als unveränderliche Revision gespeichert und
        berechnet alle betroffenen Wertungen in derselben Transaktion neu.
      </p>
      <Select label="Spiel" name="matchId" required>
        <option value="">Bitte wählen</option>
        {matches
          .filter((x) => x.match_id)
          .map((x) => (
            <option key={x.match_id!} value={x.match_id!}>
              {x.home_club_name} – {x.away_club_name}
            </option>
          ))}
      </Select>
      <Input
        label="Gelesene Spielversion"
        name="expectedMatchVersion"
        type="number"
        min={1}
        required
      />
      <Input
        label="Gelesene Ergebnisrevision (0 bei erstem Ergebnis)"
        name="expectedRevision"
        type="number"
        min={0}
        required
      />
      <Select label="Entscheidung" name="decision" required>
        <option value="official">Offizielles Ergebnis</option>
        <option value="excluded">Von der Wertung ausschließen</option>
      </Select>
      <div className="score-fields">
        <Input label="Tore Heim" name="homeGoals" type="number" min={0} max={99} />
        <Input label="Tore Auswärts" name="awayGoals" type="number" min={0} max={99} />
      </div>
      <Input label="Korrekturgrund" name="reason" maxLength={500} />
      <Button disabled={pending} type="submit">
        Ergebnis und Neuberechnung bestätigen
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
