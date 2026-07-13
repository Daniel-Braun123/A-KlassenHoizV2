"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateRoundAction } from "@/features/rounds/actions";
import { initialRoundActionState, type MyRound } from "@/features/rounds/types";
import type { PublishedLeagueSeason } from "@/features/competition/types";
export function RoundSettingsForm({
  round,
  competitions,
}: {
  round: MyRound;
  competitions: PublishedLeagueSeason[];
}) {
  const [state, action, pending] = useActionState(updateRoundAction, initialRoundActionState);
  return (
    <form action={action} className="admin-form">
      <h2>Grunddaten</h2>
      <input name="roundId" type="hidden" value={round.id!} />
      <input name="expectedVersion" type="hidden" value={round.version!} />
      <Input defaultValue={round.name ?? ""} label="Name" name="name" required />
      <Select
        defaultValue={round.league_season_id!}
        hint="Nach dem ersten Tipp ist die Liga-Saison gesperrt."
        label="Liga-Saison"
        name="leagueSeasonId"
      >
        {competitions.map((x) => (
          <option key={x.id!} value={x.id!}>
            {x.league_name} · {x.season_label}
          </option>
        ))}
      </Select>
      {state.status !== "idle" ? (
        <p
          className={`admin-form__message admin-form__message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        Version {round.version} speichern
      </Button>
    </form>
  );
}
