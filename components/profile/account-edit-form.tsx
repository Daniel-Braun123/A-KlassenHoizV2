"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { PasswordField } from "@/components/auth/password-field";
import { initialAccountEditState, type AccountEditState } from "@/features/profile/account-edit";
import {
  changeDisplayNameAction,
  changeAccountEmailAction,
  changeAccountPasswordAction,
} from "@/features/profile/account-edit-actions";

export type AccountEditKind = "name" | "email" | "password";
const actions = {
  name: changeDisplayNameAction,
  email: changeAccountEmailAction,
  password: changeAccountPasswordAction,
};

export function AccountEditForm({
  kind,
  value,
  onClose,
  onSaved,
}: {
  kind: AccountEditKind;
  value: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const root = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState(value);
  const [state, action, pending] = useActionState(
    async (previous: AccountEditState, form: FormData) => {
      const result = await actions[kind](previous, form);
      if (result.status === "success") onSaved(result.message ?? "Gespeichert.");
      return result;
    },
    initialAccountEditState,
  );

  useEffect(() => {
    root.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);
  useEffect(() => {
    if (state.status === "error")
      root.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  return (
    <form
      ref={root}
      action={action}
      className="account-edit-form"
      aria-label={
        kind === "name"
          ? "Anzeigename ändern"
          : kind === "email"
            ? "E-Mail-Adresse ändern"
            : "Passwort ändern"
      }
    >
      <fieldset disabled={pending}>
        {kind === "name" ? (
          <Input
            label="Neuer Anzeigename"
            name="displayName"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="nickname"
            required
            maxLength={80}
            error={state.fieldErrors?.displayName}
            hint="Deine Nicknames in bestehenden Tipprunden bleiben unverändert."
          />
        ) : null}
        {kind === "email" ? (
          <>
            <p>
              Bestätige die Änderung über die E-Mails an deine bisherige und deine neue Adresse. Bis
              dahin meldest du dich mit deiner bisherigen Adresse an.
            </p>
            <Input
              label="Neue E-Mail-Adresse"
              name="email"
              type="email"
              autoComplete="email"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              required
              maxLength={254}
              error={state.fieldErrors?.email}
            />
          </>
        ) : null}
        {kind !== "name" ? (
          <PasswordField
            label="Aktuelles Passwort"
            name="currentPassword"
            autoComplete="current-password"
            required
            maxLength={128}
            error={state.fieldErrors?.currentPassword}
          />
        ) : null}
        {kind === "password" ? (
          <>
            <PasswordField
              label="Neues Passwort"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              hint="Mindestens 8 Zeichen. Nach dem Speichern meldest du dich neu an."
              error={state.fieldErrors?.password}
            />
            <PasswordField
              label="Neues Passwort wiederholen"
              name="passwordConfirmation"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              error={state.fieldErrors?.passwordConfirmation}
            />
          </>
        ) : null}
        {state.status === "error" && !Object.keys(state.fieldErrors ?? {}).length ? (
          <p className="auth-form__message auth-form__message--error" role="alert">
            {state.message}
          </p>
        ) : null}
        <div className="account-edit-form__actions">
          <Button type="submit">
            {pending
              ? "Wird gespeichert …"
              : kind === "email"
                ? "Bestätigung anfordern"
                : "Änderung speichern"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
        {kind !== "name" ? <Link href="/password/forgot">Passwort vergessen?</Link> : null}
      </fieldset>
    </form>
  );
}
