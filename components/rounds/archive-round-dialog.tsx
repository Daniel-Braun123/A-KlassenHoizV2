"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { archiveRoundAction } from "@/features/rounds/management-actions";
import { initialRoundActionState } from "@/features/rounds/types";
export function ArchiveRoundDialog({
  roundId,
  version,
  archived,
}: {
  roundId: string;
  version: number;
  archived: boolean;
}) {
  const [state, action, pending] = useActionState(archiveRoundAction, initialRoundActionState);
  return (
    <form action={action} className="destructive-state">
      <input name="roundId" type="hidden" value={roundId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="archived" type="hidden" value={String(!archived)} />
      <div>
        <h2>{archived ? "Tipprunde reaktivieren" : "Tipprunde archivieren"}</h2>
        <p>
          {archived
            ? "Die Runde wird wieder für alle Mitglieder aktiv."
            : "Archivieren ist die reversible Standardaktion. Alle Daten bleiben erhalten."}
        </p>
      </div>
      <Button disabled={pending} type="submit" variant="secondary">
        {archived ? "Reaktivieren" : "Jetzt archivieren"}
      </Button>
      {state.status !== "idle" ? (
        <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
      ) : null}
    </form>
  );
}
