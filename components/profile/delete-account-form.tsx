"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccountAction, startGoogleDeletionAction } from "@/features/privacy/actions";
import { initialDeleteAccountState } from "@/features/privacy/state";

export function DeleteAccountForm({
  google,
  verified,
  email,
  verificationError,
}: {
  google: boolean;
  verified: boolean;
  email: string;
  verificationError: boolean;
}) {
  const [state, action, pending] = useActionState(deleteAccountAction, initialDeleteAccountState);
  const [googleState, googleAction, googlePending] = useActionState(
    startGoogleDeletionAction,
    initialDeleteAccountState,
  );
  return (
    <div className="destructive-state">
      <h2>Unwiderrufliche Kontolöschung</h2>
      <p>
        Deine Mitgliedschaften werden anonymisiert und anschließend weder in Mitgliederlisten noch
        in Ranglisten oder den Tipps der Runde angezeigt. Danach wird dein Login gelöscht.
      </p>
      <p>
        Konto: <strong>{email}</strong>
      </p>
      {google ? (
        <form
          action={googleAction}
          className="auth-form__credentials"
          aria-label="Google-Konto bestätigen"
        >
          {verified ? (
            <p role="status">
              Dein Google-Konto wurde bestätigt. Du kannst die Löschung jetzt abschließen.
            </p>
          ) : (
            <p>
              Bestätige zuerst dein Konto mit Google. Danach bestätigst du hier die endgültige
              Löschung.
            </p>
          )}
          {verificationError ? (
            <p role="alert">
              Die Google-Bestätigung wurde abgebrochen oder ist abgelaufen. Bitte bestätige dein
              Konto erneut.
            </p>
          ) : null}
          <Button disabled={googlePending || pending} type="submit">
            {googlePending
              ? "Weiter zu Google …"
              : verified
                ? "Erneut mit Google bestätigen"
                : "Mit Google bestätigen"}
          </Button>
          {googleState.status === "error" ? <p role="alert">{googleState.message}</p> : null}
        </form>
      ) : null}
      {!google || verified ? (
        <form
          action={action}
          className="auth-form__credentials"
          aria-label="Kontolöschung bestätigen"
        >
          {!google ? (
            <Input
              label="Aktuelles Passwort"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          ) : null}
          <Input
            label="Zur Bestätigung KONTO LÖSCHEN eingeben"
            name="confirmation"
            autoComplete="off"
            required
          />
          <Button disabled={pending || googlePending} type="submit" variant="danger">
            {pending ? "Konto wird gelöscht …" : "Konto endgültig löschen"}
          </Button>
          {state.status === "error" ? <p role="alert">{state.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
