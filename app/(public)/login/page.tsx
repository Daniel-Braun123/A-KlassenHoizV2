import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; passwordChanged?: string }>;
}) {
  const { error, next, passwordChanged } = await searchParams;
  const notice =
    passwordChanged === "1"
      ? "Dein Passwort wurde geändert. Melde dich jetzt mit deinem neuen Passwort an."
      : undefined;
  const errorNotice =
    error === "oauth"
      ? "Die Google-Anmeldung wurde abgebrochen oder konnte nicht abgeschlossen werden. Bitte versuche es erneut."
      : undefined;
  return (
    <AuthFormShell
      description="Melde dich an und mach dort weiter, wo deine Freunde schon tippen."
      title="Willkommen zurück"
    >
      <LoginForm errorNotice={errorNotice} next={next} notice={notice} />
    </AuthFormShell>
  );
}
