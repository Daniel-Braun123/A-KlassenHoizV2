"use client";

import type { Route } from "next";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { passwordResetRequestAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(
    passwordResetRequestAction,
    initialAuthActionState,
  );
  return (
    <form action={action} className="auth-form">
      <Input
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        label="E-Mail-Adresse"
        name="email"
        required
        type="email"
      />
      {state.status === "success" ? (
        <p className="auth-form__message" role="status">
          {state.message}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="auth-form__message auth-form__message--error" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} fullWidth type="submit">
        {pending ? "Anfrage läuft …" : "Link anfordern"}
      </Button>
      <Link href={"/login" as Route}>Zur Anmeldung</Link>
    </form>
  );
}
