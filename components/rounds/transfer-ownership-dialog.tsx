"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { transferOwnershipAction } from "@/features/rounds/management-actions";
import { initialRoundActionState, type RoundMember } from "@/features/rounds/types";
export function TransferOwnershipDialog({
  roundId,
  version,
  members,
}: {
  roundId: string;
  version: number;
  members: RoundMember[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(transferOwnershipAction, initialRoundActionState);
  const targets = members.filter(
    (member) => member.role === "member" && member.status === "active",
  );
  if (!targets.length) return null;
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Besitz übertragen
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Besitz unwiderruflich übertragen"
        description="Danach bist du normales Mitglied. Es gibt weiterhin genau einen Besitzer."
      >
        <form action={action} className="admin-form">
          <input name="roundId" type="hidden" value={roundId} />
          <input name="expectedVersion" type="hidden" value={version} />
          <label className="field">
            <span className="field__label">Neuer Besitzer</span>
            <select className="field__control" name="targetMembershipId" required>
              <option value="">Bitte wählen</option>
              {targets.map((member) => (
                <option key={member.id!} value={member.id!}>
                  {member.nickname}
                </option>
              ))}
            </select>
          </label>
          <Button disabled={pending} type="submit">
            Übertragung bestätigen
          </Button>
          {state.status !== "idle" ? (
            <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
          ) : null}
        </form>
      </Dialog>
    </>
  );
}
