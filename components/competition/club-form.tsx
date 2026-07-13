"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  assignClubAction,
  createClubAction,
  uploadClubLogoAction,
} from "@/features/competition/club-actions";
import {
  initialCompetitionActionState,
  type ClubCatalogRow,
  type CompetitionCatalogRow,
} from "@/features/competition/types";
import { ActionMessage } from "./action-message";

export function ClubForms({
  clubs,
  competitions,
}: Readonly<{ clubs: ClubCatalogRow[]; competitions: CompetitionCatalogRow[] }>) {
  const [createState, createAction, createPending] = useActionState(
    createClubAction,
    initialCompetitionActionState,
  );
  const [assignState, assignAction, assignPending] = useActionState(
    assignClubAction,
    initialCompetitionActionState,
  );
  const [logoState, logoAction, logoPending] = useActionState(
    uploadClubLogoAction,
    initialCompetitionActionState,
  );
  return (
    <div className="admin-form-grid">
      <form action={createAction} className="admin-form">
        <h2>Neuer Verein</h2>
        <Input label="Vereinsname" name="name" required />
        <Input label="Kurzname" name="shortName" required />
        <Button disabled={createPending} type="submit">
          Verein anlegen
        </Button>
        <ActionMessage state={createState} />
      </form>
      <form action={assignAction} className="admin-form">
        <h2>Verein zuordnen</h2>
        <Select label="Liga-Saison" name="leagueSeasonId" required>
          <option value="">Bitte wählen</option>
          {competitions.map((x) => (
            <option key={x.league_season_id!} value={x.league_season_id!}>
              {x.league_name} · {x.season_label}
            </option>
          ))}
        </Select>
        <Select label="Verein" name="clubId" required>
          <option value="">Bitte wählen</option>
          {clubs.map((x) => (
            <option key={x.id!} value={x.id!}>
              {x.name}
            </option>
          ))}
        </Select>
        <Button disabled={assignPending} type="submit">
          Zuordnen
        </Button>
        <ActionMessage state={assignState} />
      </form>
      <form action={logoAction} className="admin-form">
        <h2>Logo versionieren</h2>
        <Select label="Verein" name="clubId" required>
          <option value="">Bitte wählen</option>
          {clubs.map((x) => (
            <option key={x.id!} value={x.id!}>
              {x.name}
            </option>
          ))}
        </Select>
        <Input
          label="Gelesene Vereinsversion"
          name="expectedVersion"
          type="number"
          min={1}
          required
        />
        <Input label="Neue Logoversion" name="version" type="number" min={1} required />
        <Input
          accept="image/png,image/jpeg,image/webp"
          hint="PNG, JPEG oder WebP; höchstens 2 MiB."
          label="Logodatei"
          name="logo"
          type="file"
          required
        />
        <Button disabled={logoPending} type="submit">
          Logo hochladen
        </Button>
        <ActionMessage state={logoState} />
      </form>
    </div>
  );
}
