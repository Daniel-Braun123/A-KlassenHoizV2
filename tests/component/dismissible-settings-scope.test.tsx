import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DismissibleSettingsScope } from "@/components/ui/dismissible-settings-scope";

afterEach(cleanup);

function SettingsFixture() {
  return (
    <>
      <button type="button">Außerhalb</button>
      <DismissibleSettingsScope>
        <details data-dismissible-settings open>
          <summary>Spiel verwalten</summary>
          <button type="button">Innerhalb</button>
        </details>
      </DismissibleSettingsScope>
    </>
  );
}

describe("DismissibleSettingsScope", () => {
  it("bleibt bei Interaktionen innerhalb geöffnet", () => {
    render(<SettingsFixture />);
    const details = screen.getByText("Spiel verwalten").closest("details")!;

    fireEvent.pointerDown(screen.getByRole("button", { name: "Innerhalb" }));

    expect(details).toHaveProperty("open", true);
  });

  it("schließt bei einem Klick außerhalb des Panels", () => {
    render(<SettingsFixture />);
    const details = screen.getByText("Spiel verwalten").closest("details")!;

    fireEvent.pointerDown(screen.getByRole("button", { name: "Außerhalb" }));

    expect(details).toHaveProperty("open", false);
  });

  it("schließt per Escape und setzt den Fokus auf den Auslöser zurück", () => {
    render(<SettingsFixture />);
    const summary = screen.getByText("Spiel verwalten");
    const details = summary.closest("details")!;

    fireEvent.keyDown(document, { key: "Escape" });

    expect(details).toHaveProperty("open", false);
    expect(summary).toHaveFocus();
  });
});
