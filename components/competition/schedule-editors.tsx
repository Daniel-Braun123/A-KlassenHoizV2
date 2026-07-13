"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateMatchAction, updateMatchdayAction } from "@/features/competition/schedule-actions";
import {
  initialCompetitionActionState,
  type ClubCatalogRow,
  type ScheduleRow,
} from "@/features/competition/types";
import { ActionMessage } from "./action-message";

function berlinInput(value: string): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
  return parts.replace(" ", "T");
}
export function MatchdayEditor({ row }: Readonly<{ row: ScheduleRow }>) {
  const [state, action, pending] = useActionState(
    updateMatchdayAction,
    initialCompetitionActionState,
  );
  return (
    <form action={action} className="inline-editor">
      <input name="id" type="hidden" value={row.matchday_id!} />
      <input name="expectedVersion" type="hidden" value={row.matchday_version!} />
      <Input
        defaultValue={row.matchday_number!}
        label="Spieltagnummer"
        name="number"
        type="number"
        min={1}
        required
      />
      <Input defaultValue={row.display_name ?? ""} label="Anzeigename" name="displayName" />
      <Select defaultValue={row.matchday_status!} label="Spieltagstatus" name="status">
        <option value="draft">Entwurf</option>
        <option value="published">Veröffentlicht</option>
        <option value="completed">Abgeschlossen</option>
        <option value="archived">Archiviert</option>
      </Select>
      <Button disabled={pending} type="submit" variant="secondary">
        Spieltag-Version {row.matchday_version} speichern
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
export function ExistingMatchEditor({
  clubs,
  row,
}: Readonly<{ clubs: ClubCatalogRow[]; row: ScheduleRow }>) {
  const [state, action, pending] = useActionState(updateMatchAction, initialCompetitionActionState);
  return (
    <form action={action} className="inline-editor">
      <h3>
        {row.home_club_name} – {row.away_club_name}
      </h3>
      <input name="id" type="hidden" value={row.match_id!} />
      <input name="expectedVersion" type="hidden" value={row.match_version!} />
      <input name="matchdayId" type="hidden" value={row.matchday_id!} />
      <Select defaultValue={row.home_club_id!} label="Heimverein" name="homeClubId">
        {clubs.map((x) => (
          <option key={x.id!} value={x.id!}>
            {x.name}
          </option>
        ))}
      </Select>
      <Select defaultValue={row.away_club_id!} label="Auswärtsverein" name="awayClubId">
        {clubs.map((x) => (
          <option key={x.id!} value={x.id!}>
            {x.name}
          </option>
        ))}
      </Select>
      <Input
        defaultValue={berlinInput(row.kickoff_at!)}
        label="Anpfiff"
        name="kickoffAt"
        type="datetime-local"
        required
      />
      <Select defaultValue={row.match_status!} label="Spielstatus" name="status">
        <option value="draft">Entwurf</option>
        <option value="published">Veröffentlicht</option>
        <option value="postponed">Verschoben</option>
        <option value="cancelled">Abgesagt</option>
        <option value="completed">Abgeschlossen</option>
        <option value="abandoned">Abgebrochen</option>
      </Select>
      <Button disabled={pending} type="submit" variant="secondary">
        Spiel-Version {row.match_version} speichern
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
