"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClubAction, updateClubAction } from "@/features/competition/club-actions";
import { initialCompetitionActionState, type ClubCatalogRow } from "@/features/competition/types";
import { ActionMessage } from "./action-message";

function CreateClubForm() {
  const [state, action, pending] = useActionState(createClubAction, initialCompetitionActionState);

  return (
    <form action={action} className="admin-form admin-form--wide">
      <div>
        <h2>Neuer Verein</h2>
      </div>
      <Input autoComplete="off" label="Vereinsname" maxLength={120} name="name" required />
      <Input
        autoComplete="url"
        hint="Optional: direkte HTTPS-Adresse zu einem Bild."
        label="Logo-URL"
        maxLength={2048}
        name="logoUrl"
        placeholder="https://…"
        type="url"
      />
      <Button disabled={pending} type="submit">
        {pending ? "Verein wird angelegt …" : "Verein anlegen"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ClubEditor({ club }: Readonly<{ club: ClubCatalogRow }>) {
  const [state, action, pending] = useActionState(updateClubAction, initialCompetitionActionState);

  return (
    <form action={action} className="admin-form">
      <div className="admin-card-header">
        <div>
          <h2>{club.name}</h2>
          <p>{club.logo_url ? "Logo hinterlegt" : "Ohne Logo"}</p>
        </div>
        {club.logo_url ? (
          // Externe Vereinslogos sind reine Präsentation; der Vereinsname steht direkt daneben.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="club-logo-preview" src={club.logo_url} alt="" width="48" height="48" />
        ) : (
          <span className="club-logo-preview club-logo-preview--fallback" aria-hidden="true">
            {club.name?.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <input name="id" type="hidden" value={club.id!} />
      <input name="expectedVersion" type="hidden" value={club.version!} />
      <Input
        defaultValue={club.name ?? ""}
        label="Vereinsname"
        maxLength={120}
        name="name"
        required
      />
      <Input
        autoComplete="url"
        defaultValue={club.logo_url ?? ""}
        hint="Leer lassen, um das Logo zu entfernen."
        label="Logo-URL"
        maxLength={2048}
        name="logoUrl"
        placeholder="https://…"
        type="url"
      />
      <Button disabled={pending} type="submit" variant="secondary">
        {pending ? "Wird gespeichert …" : "Änderungen speichern"}
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
