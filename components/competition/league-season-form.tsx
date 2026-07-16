"use client";

import type { Route } from "next";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import {
  createAdminLeagueAction,
  publishAdminLeagueAction,
  updateAdminLeagueAction,
} from "@/features/competition/league-actions";
import {
  initialCompetitionActionState,
  type AdminLeagueRow,
  type ClubCatalogRow,
} from "@/features/competition/types";
import { currentLeagueYearLabel } from "@/features/competition/year-label";
import { ActionMessage } from "./action-message";

function clubInitials(name: string | null): string {
  return (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ClubMark({ club }: Readonly<{ club: ClubCatalogRow }>) {
  const [failed, setFailed] = useState(false);
  if (!club.logo_url || failed) {
    return (
      <span className="club-selection__logo club-selection__logo--fallback" aria-hidden="true">
        {clubInitials(club.name)}
      </span>
    );
  }
  return (
    // Vereinsname steht als zugänglicher Text direkt neben dem dekorativen Logo.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="club-selection__logo"
      height="32"
      loading="lazy"
      onError={() => setFailed(true)}
      src={club.logo_url}
      width="32"
    />
  );
}

function ClubSelection({
  clubs,
  selectedIds = [],
  labelledBy,
}: Readonly<{
  clubs: ClubCatalogRow[];
  selectedIds?: string[];
  labelledBy: string;
}>) {
  const selected = new Set(selectedIds);

  return (
    <fieldset aria-describedby={`${labelledBy}-hint`} className="club-selection">
      <legend id={labelledBy}>Vereine der Liga</legend>
      <p id={`${labelledBy}-hint`}>Wähle mindestens zwei Vereine aus dem globalen Katalog.</p>
      <ul className="club-selection__list">
        {clubs.map((club) => (
          <li key={club.id!}>
            <label className="club-selection__option">
              <input
                defaultChecked={selected.has(club.id!)}
                name="clubIds"
                type="checkbox"
                value={club.id!}
              />
              <ClubMark club={club} />
              <strong>{club.name}</strong>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function statusLabel(status: AdminLeagueRow["status"]): string {
  switch (status) {
    case "published":
      return "Veröffentlicht";
    case "completed":
      return "Abgeschlossen";
    case "archived":
      return "Archiviert";
    default:
      return "Entwurf";
  }
}

function CreateLeagueForm({ clubs }: Readonly<{ clubs: ClubCatalogRow[] }>) {
  const [state, action, pending] = useActionState(
    createAdminLeagueAction,
    initialCompetitionActionState,
  );
  const canCreate = clubs.length >= 2;

  return (
    <form action={action} className="admin-form admin-form--wide">
      <div>
        <h3>Ligadaten</h3>
        <p>Lege Name, Jahr und die teilnehmenden Vereine fest.</p>
      </div>
      <Input autoComplete="off" label="Liganame" maxLength={120} name="name" required />
      <Input
        autoComplete="off"
        defaultValue={currentLeagueYearLabel()}
        hint="Zwei aufeinanderfolgende Jahre, zum Beispiel 26/27."
        inputMode="numeric"
        label="Jahr"
        maxLength={5}
        name="yearLabel"
        pattern="[0-9]{2}/[0-9]{2}"
        placeholder="26/27"
        required
      />
      {canCreate ? (
        <ClubSelection clubs={clubs} labelledBy="create-league-clubs" />
      ) : (
        <p className="admin-form__warning">
          Lege zuerst mindestens zwei Vereine im globalen Vereinskatalog an.
        </p>
      )}
      <Button disabled={pending || !canCreate} type="submit">
        {pending ? "Liga wird angelegt …" : "Liga als Entwurf anlegen"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function LeagueEditor({
  league,
  clubs,
}: Readonly<{ league: AdminLeagueRow; clubs: ClubCatalogRow[] }>) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateAdminLeagueAction,
    initialCompetitionActionState,
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishAdminLeagueAction,
    initialCompetitionActionState,
  );
  const selectedIds = league.club_ids ?? [];
  const isDraft = league.status === "draft";
  const hasPredictions = league.has_predictions === true;

  return (
    <form action={updateAction} className="admin-form">
      <div>
        <h3>Stammdaten bearbeiten</h3>
      </div>
      <input name="id" type="hidden" value={league.id!} />
      <input name="expectedVersion" type="hidden" value={league.version!} />
      <input name="hasPredictions" type="hidden" value={String(hasPredictions)} />
      <Input
        defaultValue={league.name ?? ""}
        label="Liganame"
        maxLength={120}
        name="name"
        required
      />
      <Input
        defaultValue={league.year_label ?? ""}
        hint="Format 26/27"
        inputMode="numeric"
        label="Jahr"
        maxLength={5}
        name="yearLabel"
        pattern="[0-9]{2}/[0-9]{2}"
        required
      />
      <ClubSelection
        clubs={clubs}
        labelledBy={`league-${league.id}-clubs`}
        selectedIds={selectedIds}
      />
      {hasPredictions ? (
        <Input
          hint="Die Begründung wird im Änderungsprotokoll gespeichert."
          label="Begründung der Änderung"
          maxLength={500}
          name="reason"
          required
        />
      ) : null}
      <Button disabled={updatePending || publishPending} type="submit" variant="secondary">
        {updatePending ? "Wird gespeichert …" : "Änderungen speichern"}
      </Button>
      {isDraft ? (
        <Button disabled={updatePending || publishPending} formAction={publishAction} type="submit">
          {publishPending ? "Wird veröffentlicht …" : "Liga veröffentlichen"}
        </Button>
      ) : null}
      <ActionMessage state={updateState} />
      <ActionMessage state={publishState} />
    </form>
  );
}

function LeagueListItem({ league }: Readonly<{ league: AdminLeagueRow }>) {
  const href = `/admin/competitions/${league.id}` as Route;
  return (
    <li className="admin-league-list__item">
      <Link className="admin-league-list__link" href={href}>
        <span>
          <strong>
            {league.name} · {league.year_label}
          </strong>
          <small>
            {league.club_count ?? 0} Vereine · {statusLabel(league.status)}
          </small>
        </span>
        <Icon className="admin-league-list__chevron" name="chevron-right" />
      </Link>
    </li>
  );
}

export function LeagueAdmin({
  leagues,
  clubs,
}: Readonly<{ leagues: AdminLeagueRow[]; clubs: ClubCatalogRow[] }>) {
  const activeClubs = clubs.filter((club) => club.id && club.status === "active");

  return (
    <>
      <section className="editor-list" aria-labelledby="existing-leagues-title">
        <div>
          <h2 id="existing-leagues-title">Bestehende Ligen</h2>
        </div>
        {leagues.length ? (
          <ul className="admin-league-list">
            {leagues.map((league) =>
              league.id ? <LeagueListItem key={league.id} league={league} /> : null,
            )}
          </ul>
        ) : (
          <p>Noch keine Liga angelegt.</p>
        )}
      </section>
      <details className="admin-create-disclosure">
        <summary>
          <span>
            <strong>Neue Liga anlegen</strong>
            <small>Name, Jahr und Vereine festlegen</small>
          </span>
          <Icon name="plus" />
        </summary>
        <CreateLeagueForm clubs={activeClubs} />
      </details>
    </>
  );
}
