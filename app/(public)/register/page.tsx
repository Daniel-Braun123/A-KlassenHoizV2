import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const errorNotice =
    error === "oauth"
      ? "Die Google-Anmeldung wurde abgebrochen oder konnte nicht abgeschlossen werden. Bitte versuche es erneut."
      : undefined;
  return (
    <AuthFormShell
      description="Erstelle dein Konto mit Google oder E-Mail. Bei der Registrierung per E-Mail bestätigst du anschließend deine Adresse."
      title="Konto erstellen"
    >
      <RegisterForm errorNotice={errorNotice} next={next} />
    </AuthFormShell>
  );
}
