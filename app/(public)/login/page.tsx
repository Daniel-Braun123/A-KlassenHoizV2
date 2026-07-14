import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthFormShell
      description="Melde dich an und mach dort weiter, wo deine Freunde schon tippen."
      title="Willkommen zurück"
    >
      <LoginForm next={next} />
    </AuthFormShell>
  );
}
