"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { hardDeleteRoundAction } from "@/features/rounds/management-actions";
import { initialRoundActionState } from "@/features/rounds/types";
export function DeleteRoundDialog({
  roundId,
  roundName,
  version,
}: {
  roundId: string;
  roundName: string;
  version: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(hardDeleteRoundAction, initialRoundActionState);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Endgültig löschen
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tipprunde endgültig löschen"
        description="Diese Aktion ist sofort irreversibel. Es gibt keine Wiederherstellungsfrist."
      >
        <form action={action} className="destructive-state">
          <input name="roundId" type="hidden" value={roundId} />
          <input name="expectedVersion" type="hidden" value={version} />
          <input name="roundName" type="hidden" value={roundName} />
          <label className="field">
            <span className="field__label">Zur Bestätigung „{roundName}“ eingeben</span>
            <input className="field__control" name="confirmationName" required autoComplete="off" />
          </label>
          <p>
            Tipps, Punkte, Mitgliedschaften und Einladungen dieser Runde werden in einer Transaktion
            gelöscht. Liga, Spiele, Konten und Ergebnisse bleiben.
          </p>
          <Button disabled={pending} type="submit" variant="danger">
            Sofort und endgültig löschen
          </Button>
          {state.status !== "idle" ? <p role="alert">{state.message}</p> : null}
        </form>
      </Dialog>
    </>
  );
}
