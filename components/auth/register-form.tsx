"use client";

import type { Route } from "next";
import { useActionState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { registerAction } from "@/features/auth/actions";
import { authHrefWithContext } from "@/features/auth/invitation-context";
import { initialAuthActionState } from "@/features/auth/state";

export function RegisterForm({ next }: { next?: string | undefined }) {
  const [state, action, pending] = useActionState(registerAction, initialAuthActionState);
  return (
    <form action={action} className="auth-form">
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
  );
}
