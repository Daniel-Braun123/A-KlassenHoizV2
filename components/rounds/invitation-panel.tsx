"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { rotateInvitationAction, revokeInvitationAction } from "@/features/invitations/actions";
import { initialInvitationActionState } from "@/features/invitations/types";
import { InvitationQr } from "./invitation-qr";
export function InvitationPanel({ roundId }: { roundId: string }) {
  const [rotateState, rotateAction, rotating] = useActionState(
    rotateInvitationAction,
    initialInvitationActionState,
  );
  const [revokeState, revokeAction, revoking] = useActionState(
    revokeInvitationAction,
    initialInvitationActionState,
  );
  const [copied, setCopied] = useState(false);
  const url = rotateState.invitationUrl;
  return (
    <section className="invitation-panel">
      <div>
        <h2>Freunde einladen</h2>
        <p>Es ist immer nur ein Link aktiv. Ein neuer Link widerruft den bisherigen.</p>
      </div>
      <form action={rotateAction}>
        <input name="roundId" type="hidden" value={roundId} />
        <Button disabled={rotating} type="submit">
          Neuen 7-Tage-Link erzeugen
        </Button>
      </form>
      {rotateState.status === "error" ? <p role="alert">{rotateState.message}</p> : null}
      {url ? (
        <div className="invitation-share">
          <p className="invitation-share__url">{url}</p>
          <div className="invitation-share__actions">
            <Button
              onClick={() => void navigator.clipboard.writeText(url).then(() => setCopied(true))}
              variant="secondary"
            >
              {copied ? "Kopiert" : "Link kopieren"}
            </Button>
            {typeof navigator.share === "function" ? (
              <Button
                onClick={() => void navigator.share({ title: "A-KlassenHoiz-Einladung", url })}
                variant="secondary"
              >
                Teilen
              </Button>
            ) : null}
          </div>
          <InvitationQr url={url} />
          <p>Gültig bis {new Date(rotateState.expiresAt!).toLocaleString("de-DE")}</p>
        </div>
      ) : null}
      <form action={revokeAction}>
        <input name="roundId" type="hidden" value={roundId} />
        <Button disabled={revoking} type="submit" variant="danger">
          Aktiven Link widerrufen
        </Button>
      </form>
      {revokeState.status !== "idle" ? (
        <p role={revokeState.status === "error" ? "alert" : "status"}>{revokeState.message}</p>
      ) : null}
    </section>
  );
}
