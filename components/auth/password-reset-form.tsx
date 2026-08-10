"use client";

import { useActionState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { completePasswordResetAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

export function PasswordResetForm() {
  const [state, action, pending] = useActionState(
    completePasswordResetAction,
    initialAuthActionState,
  );
  return (
    <form action={action} className="auth-form">
      <PasswordField
        autoComplete="new-password"
        label="Neues Passwort"
        maxLength={128}
        minLength={8}
        name="password"
        required
      />
      <PasswordField
        autoComplete="new-password"
        label="Neues Passwort wiederholen"
        maxLength={128}
        minLength={8}
        name="passwordConfirmation"
        required
      />
      {state.status === "error" ? (
        <p className="auth-form__message auth-form__message--error" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} fullWidth type="submit">
        {pending ? "Speichern …" : "Passwort speichern"}
      </Button>
    </form>
  );
}
