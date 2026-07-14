import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DestructiveState } from "@/components/patterns/destructive-state";
import { StatusState } from "@/components/patterns/status-state";

describe("complete state patterns", () => {
  it("announces errors without relying on color", () => {
    render(
      <StatusState description="Bitte erneut versuchen." kind="error" title="Nicht gespeichert" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Nicht gespeichert");
    expect(screen.getByText("!", { selector: "span" })).toHaveAttribute("aria-hidden", "true");
  });

  it("marks loading states as busy", () => {
    render(<StatusState description="Einen Moment." kind="loading" title="Wird geladen" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("requires an exact object-name confirmation for destructive actions", () => {
    const onConfirm = vi.fn();
    render(
      <DestructiveState
        actionLabel="Tipprunde endgültig löschen"
        confirmationName="Freunde 2026"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={onConfirm}
        title="Tipprunde löschen"
      />,
    );

    const button = screen.getByRole("button", { name: "Tipprunde endgültig löschen" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Freunde 2026" } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
