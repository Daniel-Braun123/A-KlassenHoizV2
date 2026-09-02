"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClubAction, updateClubAction } from "@/features/competition/club-actions";
import { initialCompetitionActionState, type ClubCatalogRow } from "@/features/competition/types";
import { ActionMessage } from "./action-message";
import { ClubLogo } from "./club-logo";
import { ClubLogoField } from "./club-logo-field";

function CreateClubForm() {
  const [state, action, pending] = useActionState(createClubAction, initialCompetitionActionState);
  const [name, setName] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);

  return (
    <form action={action} className="admin-form admin-form--wide">
      <div>
        <h2>Neuer Verein</h2>
      </div>
      <Input
        autoComplete="off"
        label="Vereinsname"
        maxLength={120}
        name="name"
        onChange={(event) => setName(event.currentTarget.value)}
        required
      />
      <ClubLogoField name={name || "Neuer Verein"} onBusyChange={setLogoBusy} />
      <Button disabled={pending || logoBusy} type="submit">
        {logoBusy
          ? "Bild wird vorbereitet …"
          : pending
            ? "Verein wird angelegt …"
            : "Verein anlegen"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ClubEditor({ club }: Readonly<{ club: ClubCatalogRow }>) {
  const [state, action, pending] = useActionState(updateClubAction, initialCompetitionActionState);
  const [name, setName] = useState(club.name ?? "");
  const [logoBusy, setLogoBusy] = useState(false);
  const hasLogo = Boolean(club.logo_path || club.logo_url);

  return (
    <form action={action} className="admin-form">
      <div className="admin-card-header">
        <div>
          <h2>{club.name}</h2>
          <p>{hasLogo ? "Logo hinterlegt" : "Ohne Logo"}</p>
        </div>
        <ClubLogo
          className="club-logo-preview"
          logoPath={club.logo_path}
          logoUrl={club.logo_url}
          name={club.name}
          size={48}
        />
      </div>
      <input name="id" type="hidden" value={club.id!} />
      <input name="expectedVersion" type="hidden" value={club.version!} />
      <Input
        defaultValue={club.name ?? ""}
        label="Vereinsname"
        maxLength={120}
        name="name"
        onChange={(event) => setName(event.currentTarget.value)}
        required
      />
      <ClubLogoField
        initialLogoPath={club.logo_path}
        initialLogoUrl={club.logo_url}
        name={name || club.name || "Verein"}
        onBusyChange={setLogoBusy}
      />
      <Button disabled={pending || logoBusy} type="submit" variant="secondary">
        {logoBusy
          ? "Bild wird vorbereitet …"
          : pending
            ? "Wird gespeichert …"
            : "Änderungen speichern"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ClubAdmin({ clubs }: Readonly<{ clubs: ClubCatalogRow[] }>) {
  return (
    <>
      <CreateClubForm />
      <section className="editor-list" aria-labelledby="club-catalog-title">
        <div>
          <h2 id="club-catalog-title">Globaler Vereinskatalog</h2>
        </div>
        {clubs.length ? (
          <div className="admin-form-grid">
            {clubs.map((club) => (club.id ? <ClubEditor club={club} key={club.id} /> : null))}
          </div>
        ) : (
          <p>Noch keine Vereine angelegt.</p>
        )}
      </section>
    </>
  );
}
