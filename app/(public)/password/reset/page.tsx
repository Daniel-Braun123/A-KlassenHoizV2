import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function PasswordResetPage() {
  return (
    <AuthFormShell
      description="Wähle ein neues Passwort. Einfügen und Passwortmanager bleiben ausdrücklich erlaubt."
      title="Neues Passwort festlegen"
    >
      <PasswordResetForm />
    </AuthFormShell>
  );
}
