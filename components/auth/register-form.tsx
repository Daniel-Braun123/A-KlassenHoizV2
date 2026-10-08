"use client";

import type { Route } from "next";
import { useActionState, useEffect, useRef, useState } from "react";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegistrationConfirmation } from "@/components/auth/registration-confirmation";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { registerAction } from "@/features/auth/actions";
import { authHrefWithContext } from "@/features/auth/invitation-context";
import { initialRegistrationActionState } from "@/features/auth/state";

export function RegisterForm({
  errorNotice,
  next,
}: {
  errorNotice?: string | undefined;
  next?: string | undefined;
}) {
  const [revision, setRevision] = useState(0);
  const [defaults, setDefaults] = useState({ email: "", displayName: "" });
  return (
    <RegistrationAttempt
      key={revision}
      errorNotice={errorNotice}
      next={next}
      defaults={defaults}
      correcting={revision > 0}
      onCorrectEmail={(email, displayName) => {
        setDefaults({ email, displayName });
        setRevision((value) => value + 1);
      }}
    />
  );
}

function RegistrationAttempt({
  errorNotice,
  next,
  defaults,
  correcting,
  onCorrectEmail,
}: {
  errorNotice?: string | undefined;
  next?: string | undefined;
  defaults: { email: string; displayName: string };
  correcting: boolean;
  onCorrectEmail: (email: string, displayName: string) => void;
}) {
  const [state, action, pending] = useActionState(registerAction, initialRegistrationActionState);
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (correcting) emailInput.current?.focus();
  }, [correcting]);

  if (state.status === "success") {
    return (
      <AuthFormShell
        title="Bestätige deine E-Mail-Adresse"
        description="Nur noch ein Schritt bis zu deinem Tippspiel."
      >
        <RegistrationConfirmation
          email={state.email}
          message={state.message}
          next={next}
          onCorrectEmail={() => onCorrectEmail(state.email, state.displayName)}
        />
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      title={correcting ? "E-Mail-Adresse korrigieren" : "Konto erstellen"}
      description={
        correcting
          ? "Korrigiere deine Adresse und gib dein Passwort erneut ein. Wir schicken den Bestätigungslink an die neue Adresse."
          : "Erstelle dein Konto mit Google oder E-Mail. Bestätige anschließend deine Adresse und leg direkt los."
      }
    >
      <div className="auth-form">
        {errorNotice ? (
          <p className="auth-form__message auth-form__message--error" role="alert">
            {errorNotice}
          </p>
        ) : null}
        <GoogleAuthButton entryPoint="register" next={next} />
        <div className="auth-form__divider" role="separator">
          <span>oder mit E-Mail</span>
        </div>
        <form action={action} className="auth-form__credentials">
          <input name="next" type="hidden" value={next ?? ""} />
          <Input
            autoComplete="name"
            label="Anzeigename"
            maxLength={80}
            name="displayName"
            defaultValue={defaults.displayName}
            required
          />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            label="E-Mail-Adresse"
            maxLength={254}
            name="email"
            defaultValue={defaults.email}
            ref={emailInput}
            required
            type="email"
          />
          <PasswordField
            autoComplete="new-password"
            hint="Mindestens 8 Zeichen. Passwortmanager und Einfügen sind erlaubt."
            label="Passwort"
            maxLength={128}
            minLength={8}
            name="password"
            required
          />
          {state.status === "error" ? (
            <p className="auth-form__message auth-form__message--error" role="alert">
              {state.message}
            </p>
          ) : null}
          <Button disabled={pending} fullWidth type="submit">
            {pending ? "Konto wird erstellt …" : "Konto erstellen"}
          </Button>
          <Link href={authHrefWithContext("/login", next) as Route}>
            Schon registriert? Anmelden
          </Link>
        </form>
      </div>
    </AuthFormShell>
  );
}
