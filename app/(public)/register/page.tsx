import { RegisterForm } from "@/components/auth/register-form";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { ConfirmationLinkRecovery } from "@/components/auth/registration-confirmation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  if (error === "confirmation")
    return (
      <AuthFormShell
        title="Neuen Link anfordern"
        description="Bestätige deine E-Mail-Adresse, um deine Registrierung abzuschließen."
      >
        <ConfirmationLinkRecovery next={next} />
      </AuthFormShell>
    );
  const errorNotice =
    error === "oauth"
      ? "Die Google-Anmeldung wurde abgebrochen oder konnte nicht abgeschlossen werden. Bitte versuche es erneut."
      : undefined;
  return <RegisterForm errorNotice={errorNotice} next={next} />;
}
