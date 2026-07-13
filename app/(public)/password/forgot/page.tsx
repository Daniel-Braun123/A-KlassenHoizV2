import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export default function PasswordForgotPage() {
  return (
    <AuthFormShell
      description="Wir senden den nächsten Schritt an deine E-Mail-Adresse, falls dafür ein Konto existiert."
      title="Passwort zurücksetzen"
    >
      <PasswordResetRequestForm />
    </AuthFormShell>
  );
}
