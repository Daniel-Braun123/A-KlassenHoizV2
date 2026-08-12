"use client";

import type { Route } from "next";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { startGoogleSignInAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";
import type { OAuthEntryPoint } from "@/features/auth/types";

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="google-auth-button__mark"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.25-2.53c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.53l3.35-2.61Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  entryPoint,
  next,
}: {
  entryPoint: OAuthEntryPoint;
  next?: string | undefined;
}) {
  const [state, action, pending] = useActionState(startGoogleSignInAction, initialAuthActionState);

  return (
    <div className="google-auth">
      <form action={action}>
        <input name="entryPoint" type="hidden" value={entryPoint} />
        <input name="next" type="hidden" value={next ?? ""} />
        <Button
          className="google-auth-button"
          disabled={pending}
          fullWidth
          type="submit"
          variant="secondary"
        >
          <GoogleMark />
          <span>{pending ? "Google wird geöffnet …" : "Mit Google fortfahren"}</span>
        </Button>
      </form>
      {state.status === "error" ? (
        <p className="auth-form__message auth-form__message--error" role="alert">
          Google-Anmeldung konnte nicht gestartet werden. Bitte versuche es erneut.
        </p>
      ) : null}
      <p className="google-auth__privacy">
        Google übermittelt nur die für Anmeldung und Konto erforderlichen Profildaten. Weitere
        Google-Dienste werden nicht ausgelesen.{" "}
        <Link href={"/legal/privacy#google-anmeldung" as Route}>Datenschutzerklärung</Link>
      </p>
    </div>
  );
}
