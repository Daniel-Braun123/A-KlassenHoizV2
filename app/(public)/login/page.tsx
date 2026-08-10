import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; passwordChanged?: string }>;
}) {
  const { next, passwordChanged } = await searchParams;
  const notice =
    passwordChanged === "1"
      ? "Dein Passwort wurde geändert. Melde dich jetzt mit deinem neuen Passwort an."
      : undefined;
  return (
    <AuthFormShell
      description="Melde dich an und mach dort weiter, wo deine Freunde schon tippen."
      title="Willkommen zurück"
    >
      <LoginForm next={next} notice={notice} />
    </AuthFormShell>
  );
}
