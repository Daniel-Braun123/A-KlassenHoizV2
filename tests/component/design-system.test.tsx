import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/patterns/form-status";
import { StatusState } from "@/components/patterns/status-state";
import { ContentLoading } from "@/components/patterns/content-loading";
describe("design system states", () => {
  it("exposes disabled buttons without removing their name", () => {
    render(<Button disabled>Speichern</Button>);
    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled();
  });
  it("uses assertive error and polite success semantics", () => {
    const { rerender } = render(<FormStatus status="error">Fehler</FormStatus>);
    expect(screen.getByRole("alert")).toHaveTextContent("Fehler");
    rerender(<FormStatus status="success">Gespeichert</FormStatus>);
    expect(screen.getByRole("status")).toHaveTextContent("Gespeichert");
  });
  it("never relies on the status symbol as its accessible name", () => {
    render(
      <StatusState kind="locked" title="Geschlossen" description="Die Frist ist abgelaufen." />,
    );
    expect(screen.getByRole("heading", { name: "Geschlossen" })).toBeVisible();
    expect(screen.queryByText("—")).toHaveAttribute("aria-hidden", "true");
  });
  it("announces streamed page loading without exposing decorative placeholders", () => {
    render(<ContentLoading label="Tipprunde wird geladen" rows={3} />);
    const status = screen.getByRole("status", { name: "Tipprunde wird geladen" });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status.querySelectorAll(".content-loading__row")).toHaveLength(3);
  });
});
