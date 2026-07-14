"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createRoundAction } from "@/features/rounds/actions";
import { initialRoundActionState } from "@/features/rounds/types";
import type { PublishedLeagueSeason } from "@/features/competition/types";
export function CreateRoundFlow({ competitions }: { competitions: PublishedLeagueSeason[] }) {
  const [key] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(createRoundAction, initialRoundActionState);
  return (
    <form action={action} className="guided-form">
      <input name="idempotencyKey" type="hidden" value={key} />
      <ol className="guided-form__steps">
        <li>
          <strong>1. Name</strong>
          <span>Nur eingeladene Freunde sehen ihn.</span>
        </li>
        <li>
          <strong>2. Liga-Saison</strong>
          <span>Sie gilt später für alle Tipps.</span>
        </li>
        <li>
          <strong>3. Dein Name</strong>
          <span>So erscheinst du in der Runde.</span>
        </li>
      </ol>
      <Input label="Name der Tipprunde" name="name" required maxLength={80} />
      <Select label="Liga-Saison" name="leagueSeasonId" required>
        <option value="">Bitte wählen</option>
        {competitions.map((x) => (
          <option key={x.id!} value={x.id!}>
            {x.league_name} · {x.season_label}
          </option>
        ))}
      </Select>
      <Input label="Dein Rundennickname" name="nickname" required maxLength={40} />
      {state.status === "error" ? (
        <p className="admin-form__message admin-form__message--error" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        Private Tipprunde erstellen
      </Button>
    </form>
  );
}
