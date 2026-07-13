"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateClubAction } from "@/features/competition/club-actions";
import { updateLeagueAction, updateSeasonAction } from "@/features/competition/league-actions";
import {
  initialCompetitionActionState,
  type ClubCatalogRow,
  type LeagueCatalogRow,
  type SeasonCatalogRow,
} from "@/features/competition/types";
import { ActionMessage } from "./action-message";

export function LeagueEditor({ league }: Readonly<{ league: LeagueCatalogRow }>) {
  const [state, action, pending] = useActionState(
    updateLeagueAction,
    initialCompetitionActionState,
  );
  return (
    <form action={action} className="inline-editor">
      <input name="id" type="hidden" value={league.id!} />
      <input name="expectedVersion" type="hidden" value={league.version!} />
      <Input defaultValue={league.name ?? ""} label="Liganame" name="name" required />
      <Input defaultValue={league.short_name ?? ""} label="Kurzname" name="shortName" />
      <Select defaultValue={league.status!} label="Katalogstatus" name="status">
        <option value="draft">Entwurf</option>
        <option value="active">Aktiv</option>
        <option value="archived">Archiviert</option>
      </Select>
      <Button disabled={pending} type="submit" variant="secondary">
        Version {league.version} speichern
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
export function SeasonEditor({ season }: Readonly<{ season: SeasonCatalogRow }>) {
  const [state, action, pending] = useActionState(
    updateSeasonAction,
    initialCompetitionActionState,
  );
  return (
    <form action={action} className="inline-editor">
      <input name="id" type="hidden" value={season.id!} />
      <input name="expectedVersion" type="hidden" value={season.version!} />
      <Input defaultValue={season.label ?? ""} label="Saisonbezeichnung" name="label" required />
      <Input
        defaultValue={season.starts_on ?? ""}
        label="Startdatum"
        name="startsOn"
        type="date"
        required
      />
      <Input
        defaultValue={season.ends_on ?? ""}
        label="Enddatum"
        name="endsOn"
        type="date"
        required
      />
      <Select defaultValue={season.status!} label="Katalogstatus" name="status">
        <option value="draft">Entwurf</option>
        <option value="active">Aktiv</option>
        <option value="archived">Archiviert</option>
      </Select>
      <Button disabled={pending} type="submit" variant="secondary">
        Version {season.version} speichern
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
export function ClubEditor({ club }: Readonly<{ club: ClubCatalogRow }>) {
  const [state, action, pending] = useActionState(updateClubAction, initialCompetitionActionState);
  return (
    <form action={action} className="inline-editor">
      <input name="id" type="hidden" value={club.id!} />
      <input name="expectedVersion" type="hidden" value={club.version!} />
      <Input defaultValue={club.name ?? ""} label="Vereinsname" name="name" required />
      <Input defaultValue={club.short_name ?? ""} label="Kurzname" name="shortName" required />
      <Select defaultValue={club.status!} label="Status" name="status">
        <option value="active">Aktiv</option>
        <option value="archived">Archiviert</option>
      </Select>
      <Button disabled={pending} type="submit" variant="secondary">
        Version {club.version} speichern
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
