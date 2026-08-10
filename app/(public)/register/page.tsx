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
      description="Erstelle dein Konto und bestätige anschließend deine E-Mail-Adresse über den zugesandten Link."
      title="Konto erstellen"
    >
      <RegisterForm next={next} />
    </AuthFormShell>
  );
}
