"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createLeagueAction,
  createLeagueSeasonAction,
  createSeasonAction,
  transitionLeagueSeasonAction,
} from "@/features/competition/league-actions";
import {
  initialCompetitionActionState,
  type CompetitionCatalogRow,
  type LeagueCatalogRow,
  type SeasonCatalogRow,
} from "@/features/competition/types";
import { ActionMessage } from "./action-message";

export function LeagueSeasonForms({
  competitions,
  leagues,
  seasons,
}: Readonly<{
  competitions: CompetitionCatalogRow[];
  leagues: LeagueCatalogRow[];
  seasons: SeasonCatalogRow[];
}>) {
  const [leagueState, leagueAction, leaguePending] = useActionState(
    createLeagueAction,
    initialCompetitionActionState,
  );
  const [seasonState, seasonAction, seasonPending] = useActionState(
    createSeasonAction,
    initialCompetitionActionState,
  );
  const [connectState, connectAction, connectPending] = useActionState(
    createLeagueSeasonAction,
    initialCompetitionActionState,
  );
  const [transitionState, transitionAction, transitionPending] = useActionState(
    transitionLeagueSeasonAction,
    initialCompetitionActionState,
  );
  return (
    <div className="admin-form-grid">
      <form action={leagueAction} className="admin-form">
        <h2>Neue Liga</h2>
        <Input label="Name" name="name" required />
        <Input label="Kurzname" name="shortName" maxLength={20} />
        <Button disabled={leaguePending} type="submit">
          Liga anlegen
        </Button>
        <ActionMessage state={leagueState} />
      </form>
      <form action={seasonAction} className="admin-form">
        <h2>Neue Saison</h2>
        <Input label="Bezeichnung" name="label" placeholder="2026/27" required />
        <Input label="Startdatum" name="startsOn" type="date" required />
        <Input label="Enddatum" name="endsOn" type="date" required />
        <Button disabled={seasonPending} type="submit">
          Saison anlegen
        </Button>
        <ActionMessage state={seasonState} />
      </form>
      <form action={connectAction} className="admin-form">
        <h2>Liga-Saison verbinden</h2>
        <Select label="Liga" name="leagueId" required>
          <option value="">Bitte wählen</option>
          {leagues.map((x) => (
            <option key={x.id!} value={x.id!}>
              {x.name}
            </option>
          ))}
        </Select>
        <Select label="Saison" name="seasonId" required>
          <option value="">Bitte wählen</option>
          {seasons.map((x) => (
            <option key={x.id!} value={x.id!}>
              {x.label}
            </option>
          ))}
        </Select>
        <Button disabled={connectPending} type="submit">
          Verbinden
        </Button>
        <ActionMessage state={connectState} />
      </form>
      <form action={transitionAction} className="admin-form">
        <h2>Status fortschreiben</h2>
        <Select label="Liga-Saison" name="id" required>
          <option value="">Bitte wählen</option>
          {competitions.map((x) => (
            <option key={x.league_season_id!} value={x.league_season_id!}>
              {x.league_name} · {x.season_label} ({x.league_season_status})
            </option>
          ))}
        </Select>
        <Input label="Gelesene Version" name="expectedVersion" type="number" min={1} required />
        <Select label="Nächster Status" name="status" required>
          <option value="published">Veröffentlichen</option>
          <option value="completed">Abschließen</option>
          <option value="archived">Archivieren</option>
        </Select>
        <Button disabled={transitionPending} type="submit">
          Status ändern
        </Button>
        <ActionMessage state={transitionState} />
      </form>
    </div>
  );
}
