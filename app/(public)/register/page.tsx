import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthFormShell
      description="Ein Anzeigename, deine E-Mail-Adresse und ein Passwort – danach bist du direkt drin."
      title="Konto erstellen"
    >
      <RegisterForm next={next} />
    </AuthFormShell>
  );
}
