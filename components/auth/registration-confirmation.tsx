"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Input } from "@/components/ui/input";
import { registrationDestinationAction, resendRegistrationAction } from "@/features/auth/actions";
import { authHrefWithContext } from "@/features/auth/invitation-context";
import { initialAuthActionState } from "@/features/auth/state";

function MailProviderLinks() {
  return (
    <div className="registration-confirmation__providers" aria-label="E-Mail-Postfach öffnen">
      <a
        className="ui-button ui-button--primary"
        href="https://mail.google.com/mail/u/0/#inbox"
        target="_blank"
        rel="noopener noreferrer"
      >
        Gmail öffnen
      </a>
      <a
        className="ui-button ui-button--secondary"
        href="https://outlook.live.com/mail/0/inbox"
        target="_blank"
        rel="noopener noreferrer"
      >
        Outlook öffnen
      </a>
    </div>
  );
}

export function ConfirmationLinkRecovery({ next }: { next?: string | undefined }) {
  const [state, action, pending] = useActionState(resendRegistrationAction, initialAuthActionState);
  return (
    <div className="auth-form">
      <p role="alert">
        Dieser Bestätigungslink ist abgelaufen oder wurde bereits verwendet. Fordere einen neuen
        Link für deine E-Mail-Adresse an.
      </p>
      <form className="auth-form__credentials" action={action}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Input
          name="email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          maxLength={254}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "E-Mail wird angefordert …" : "Neuen Bestätigungslink anfordern"}
        </Button>
      </form>
      {state.status !== "idle" ? (
        <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
      ) : null}
      {state.status === "success" ? <MailProviderLinks /> : null}
      <Link href={authHrefWithContext("/login", next) as Route}>Bereits bestätigt? Anmelden</Link>
      <Link href={authHrefWithContext("/register", next) as Route}>Zur Registrierung</Link>
    </div>
  );
}

export function RegistrationConfirmation({
  email,
  message,
  next,
  onCorrectEmail,
  initialCooldown = 60,
}: {
  email: string;
  message: string;
  next?: string | undefined;
  onCorrectEmail: () => void;
  initialCooldown?: number;
}) {
  const [state, action, pending] = useActionState(resendRegistrationAction, initialAuthActionState);
  const [remaining, setRemaining] = useState(initialCooldown);
  const heading = useRef<HTMLHeadingElement>(null);
  const retryAt = useRef(0);
  const router = useRouter();

  useEffect(() => {
    retryAt.current = Date.now() + initialCooldown * 1000;
    heading.current?.focus();
  }, [initialCooldown]);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(
      () => setRemaining(Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1000))),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [remaining]);

  useEffect(() => {
    let active = true;
    let checking = false;
    async function resume() {
      if (document.visibilityState !== "visible" || checking) return;
      checking = true;
      try {
        const destination = await registrationDestinationAction({ email, next });
        if (active && destination) router.replace(destination as Route);
      } catch {
        // A temporary network failure must not interrupt the confirmation screen.
      } finally {
        checking = false;
      }
    }
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [email, next, router]);

  function beginResend() {
    retryAt.current = Date.now() + 60_000;
    setRemaining(60);
  }

  return (
    <section className="auth-form registration-confirmation" aria-labelledby="confirmation-heading">
      <div className="registration-confirmation__intro">
        <span className="registration-confirmation__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <h2 id="confirmation-heading" ref={heading} tabIndex={-1}>
          Prüfe dein Postfach
        </h2>
        <p className="registration-confirmation__email">{email}</p>
        <p role="status">{message}</p>
        <p>Öffne den Link in der E-Mail. Danach bist du direkt angemeldet und kannst loslegen.</p>
      </div>
      <MailProviderLinks />
      <div className="registration-confirmation__help">
        <p>
          <strong>Keine E-Mail erhalten?</strong>
          <br />
          Die Nachricht kann einen Moment dauern. Prüfe auch deinen Spam-Ordner.
        </p>
        <form action={action} onSubmit={beginResend}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next ?? ""} />
          <Button fullWidth type="submit" variant="secondary" disabled={pending || remaining > 0}>
            {pending ? "E-Mail wird angefordert …" : "E-Mail erneut senden"}
          </Button>
          {remaining > 0 ? (
            <p className="registration-confirmation__cooldown">
              Erneut senden in {remaining} Sekunden
            </p>
          ) : null}
        </form>
        {state.status !== "idle" ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error"
                ? "auth-form__message auth-form__message--error"
                : "auth-form__message"
            }
          >
            {state.message}
          </p>
        ) : null}
        <Button fullWidth variant="ghost" onClick={onCorrectEmail} disabled={pending}>
          E-Mail-Adresse korrigieren
        </Button>
      </div>
      <Link href={authHrefWithContext("/login", next) as Route}>Schon registriert? Anmelden</Link>
    </section>
  );
}
