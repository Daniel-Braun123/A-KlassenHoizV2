"use client";

import type { Route } from "next";
import { useActionState } from "react";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { registerAction } from "@/features/auth/actions";
import { authHrefWithContext } from "@/features/auth/invitation-context";
import { initialAuthActionState } from "@/features/auth/state";

export function RegisterForm({
  errorNotice,
  next,
}: {
  errorNotice?: string | undefined;
  next?: string | undefined;
}) {
  const [state, action, pending] = useActionState(registerAction, initialAuthActionState);

  if (state.status === "success") {
    return (
      <div className="auth-form">
        <p className="auth-form__message" role="status">
          {state.message}
        </p>
        <p className="auth-form__hint">
          Die Nachricht kann einen Moment brauchen. Prüfe gegebenenfalls auch deinen Spam-Ordner.
        </p>
        <div className="auth-form__links">
          <Link href={authHrefWithContext("/login", next) as Route}>Zur Anmeldung</Link>
          <Link href="/password/forgot">Passwort zurücksetzen</Link>
        </div>
      </div>
    );
  }

  return (
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
        <Input autoComplete="name" label="Anzeigename" maxLength={80} name="displayName" required />
        <Input
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          label="E-Mail-Adresse"
          maxLength={254}
          name="email"
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
        <Link href={authHrefWithContext("/login", next) as Route}>Schon registriert? Anmelden</Link>
      </form>
    </div>
  );
}
