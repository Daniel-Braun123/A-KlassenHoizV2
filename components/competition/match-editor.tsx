"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createMatchAction, createMatchdayAction } from "@/features/competition/schedule-actions";
import {
  initialCompetitionActionState,
  type ClubCatalogRow,
  type CompetitionCatalogRow,
  type ScheduleRow,
} from "@/features/competition/types";
import { ActionMessage } from "./action-message";

export function MatchEditor({
  clubs,
  competitions,
  schedule,
}: Readonly<{
  clubs: ClubCatalogRow[];
  competitions: CompetitionCatalogRow[];
  schedule: ScheduleRow[];
}>) {
  const matchdays = [...new Map(schedule.map((x) => [x.matchday_id, x])).values()];
  const [dayState, dayAction, dayPending] = useActionState(
    createMatchdayAction,
    initialCompetitionActionState,
  );
  const [matchState, matchAction, matchPending] = useActionState(
    createMatchAction,
    initialCompetitionActionState,
  );
  return (
    <div className="admin-form-grid">
      <form action={dayAction} className="admin-form">
        <h2>Spieltag anlegen</h2>
        <Select label="Liga-Saison" name="leagueSeasonId" required>
          <option value="">Bitte wählen</option>
          {competitions.map((x) => (
            <option key={x.league_season_id!} value={x.league_season_id!}>
              {x.league_name} · {x.season_label}
            </option>
          ))}
        </Select>
        <Input label="Nummer" name="number" type="number" min={1} required />
        <Input label="Anzeigename" name="displayName" />
        <Button disabled={dayPending} type="submit">
          Spieltag anlegen
        </Button>
        <ActionMessage state={dayState} />
      </form>
      <form action={matchAction} className="admin-form">
        <h2>Spiel anlegen</h2>
        <Select label="Spieltag" name="matchdayId" required>
          <option value="">Bitte wählen</option>
          {matchdays.map((x) => (
            <option key={x.matchday_id!} value={x.matchday_id!}>
              {x.display_name || `${x.matchday_number}. Spieltag`}
            </option>
          ))}
        </Select>
        <Select label="Heimverein" name="homeClubId" required>
          <option value="">Bitte wählen</option>
          {clubs.map((x) => (
            <option key={x.id!} value={x.id!}>
              {x.name}
            </option>
          ))}
        </Select>
        <Select label="Auswärtsverein" name="awayClubId" required>
          <option value="">Bitte wählen</option>
          {clubs.map((x) => (
            <option key={x.id!} value={x.id!}>
              {x.name}
            </option>
          ))}
        </Select>
        <Input label="Anpfiff" name="kickoffAt" type="datetime-local" required />
        <Button disabled={matchPending} type="submit">
          Spiel anlegen
        </Button>
        <ActionMessage state={matchState} />
      </form>
    </div>
  );
}
