"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccountAction } from "@/features/privacy/actions";
import { initialDeleteAccountState } from "@/features/privacy/state";
export default function DeleteAccountPage() {
  const [state, action, pending] = useActionState(deleteAccountAction, initialDeleteAccountState);
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">Datenschutz</p>
        <h1>Konto löschen</h1>
        <p>
          Du musst zuerst den Besitz jeder aktiven Tipprunde übertragen oder die Runde endgültig
          löschen.
        </p>
      </div>
      <form action={action} className="destructive-state">
        <h2>Unwiderrufliche Kontolöschung</h2>
        <p>
          Deine Mitgliedschaften werden anonymisiert, damit historische Ranglisten ohne Kontobezug
          nachvollziehbar bleiben. Danach wird dein Login gelöscht.
        </p>
        <Input
          label="Aktuelles Passwort"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Input
          label="Zur Bestätigung KONTO LÖSCHEN eingeben"
          name="confirmation"
          autoComplete="off"
          required
        />
        <Button disabled={pending} type="submit" variant="danger">
          Konto endgültig löschen
        </Button>
        {state.status === "error" ? <p role="alert">{state.message}</p> : null}
      </form>
    </section>
  );
}
