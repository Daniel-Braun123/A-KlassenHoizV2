"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  accessSupportMetadataAction,
  revokeSupportAccessAction,
  type SupportState,
} from "@/features/support/actions";
const initialSupportState: SupportState = { status: "idle" };
export function SupportAccessForm() {
  const [state, action, pending] = useActionState(accessSupportMetadataAction, initialSupportState);
  const [revokeState, revokeAction, revoking] = useActionState(
    revokeSupportAccessAction,
    initialSupportState,
  );
  return (
    <>
      <form action={action} className="admin-form">
        <h2>Begründeten Supportzugriff starten</h2>
        <p className="admin-form__warning">
          Maximal 15 Minuten. Nur nicht sprechende Metadaten; keine Namen, E-Mails oder Tipps.
        </p>
        <Input label="Nicht sprechende Runden-ID" name="roundId" required />
        <Input label="Fallreferenz" name="caseReference" required maxLength={80} />
        <label className="field">
          <span className="field__label">Begründung</span>
          <textarea
            className="field__control"
            name="reason"
            required
            minLength={10}
            maxLength={500}
          />
        </label>
        <Input
          label="Dauer in Minuten"
          name="durationMinutes"
          type="number"
          min={1}
          max={15}
          defaultValue={15}
          required
        />
        <Button disabled={pending} type="submit">
          Zugriff starten und einmal lesen
        </Button>
        {state.status === "error" ? <p role="alert">{state.message}</p> : null}
      </form>
      {state.metadata ? (
        <section className="support-metadata" aria-labelledby="support-result">
          <h2 id="support-result">Support-Metadaten</h2>
          <dl>
            <div>
              <dt>Objekt-ID</dt>
              <dd>{state.metadata.object_id}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{state.metadata.round_status}</dd>
            </div>
            <div>
              <dt>Liga-Saison-ID</dt>
              <dd>{state.metadata.league_season_id}</dd>
            </div>
            <div>
              <dt>Mitgliedschaften</dt>
              <dd>{state.metadata.member_count}</dd>
            </div>
            <div>
              <dt>Aktive Mitglieder</dt>
              <dd>{state.metadata.active_member_count}</dd>
            </div>
            <div>
              <dt>Aktive Einladung</dt>
              <dd>{state.metadata.active_invitation ? "Ja" : "Nein"}</dd>
            </div>
            <div>
              <dt>Tippaktivität vorhanden</dt>
              <dd>{state.metadata.has_prediction_activity ? "Ja" : "Nein"}</dd>
            </div>
            <div>
              <dt>Läuft ab</dt>
              <dd>{new Date(state.metadata.expires_at).toLocaleString("de-DE")}</dd>
            </div>
          </dl>
          <form action={revokeAction}>
            <input type="hidden" name="grantId" value={state.grantId} />
            <Button disabled={revoking} variant="danger" type="submit">
              Sofort widerrufen
            </Button>
          </form>
          {revokeState.status !== "idle" ? (
            <p role={revokeState.status === "error" ? "alert" : "status"}>{revokeState.message}</p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
