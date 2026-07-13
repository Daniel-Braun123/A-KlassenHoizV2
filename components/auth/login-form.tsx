"use client";

import type { Route } from "next";
import { useActionState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { signInAction } from "@/features/auth/actions";
import { authHrefWithContext } from "@/features/auth/invitation-context";
import { initialAuthActionState } from "@/features/auth/state";

export function LoginForm({ next }: { next?: string | undefined }) {
  const [state, action, pending] = useActionState(signInAction, initialAuthActionState);
  return (
    <form action={action} className="auth-form">
      <input name="next" type="hidden" value={next ?? ""} />
      <Input
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        label="E-Mail-Adresse"
        name="email"
        required
        type="email"
      />
      <PasswordField
        autoComplete="current-password"
        label="Passwort"
        maxLength={128}
        name="password"
        required
      />
      {state.status === "error" ? (
        <p className="auth-form__message auth-form__message--error" role="alert">
          E-Mail-Adresse oder Passwort stimmen nicht. Bitte versuche es erneut.
        </p>
      ) : null}
      <Button disabled={pending} fullWidth type="submit">
        {pending ? "Anmeldung läuft …" : "Anmelden"}
      </Button>
      <div className="auth-form__links">
        <Link href={"/password/forgot" as Route}>Passwort vergessen</Link>
        <Link href={authHrefWithContext("/register", next) as Route}>Konto erstellen</Link>
      </div>
    </form>
  );
}
