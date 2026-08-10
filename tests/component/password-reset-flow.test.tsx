import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

describe("password reset completion", () => {
  it("shows the persistent completion notice on the login form", () => {
    render(
      <LoginForm notice="Dein Passwort wurde geändert. Melde dich jetzt mit deinem neuen Passwort an." />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Dein Passwort wurde geändert. Melde dich jetzt mit deinem neuen Passwort an.",
    );
  });

  it("does not offer a second navigation action inside the reset form", () => {
    render(<PasswordResetForm />);

    expect(screen.queryByRole("link", { name: "Jetzt anmelden" })).not.toBeInTheDocument();
  });
});
