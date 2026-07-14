import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { Select } from "@/components/ui/select";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("accessible UI primitives", () => {
  it("renders a semantic button with the selected role styles", () => {
    render(<Button variant="danger">Endgültig löschen</Button>);
    expect(screen.getByRole("button", { name: "Endgültig löschen" })).toHaveClass(
      "ui-button",
      "ui-button--danger",
    );
  });

  it("associates input label, hint and live error", () => {
    render(<Input error="Name fehlt" hint="Maximal 40 Zeichen" label="Nickname" />);
    const input = screen.getByRole("textbox", { name: "Nickname" });
    expect(input).toHaveAccessibleDescription("Maximal 40 Zeichen Name fehlt");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Name fehlt");
  });

  it("keeps the select label and validation state explicit", () => {
    render(
      <Select label="Liga-Saison" required>
        <option value="">Bitte wählen</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: /Liga-Saison/ })).toBeRequired();
  });

  it("renders an internal link with a real href", () => {
    render(<Link href="/">Startseite</Link>);
    expect(screen.getByRole("link", { name: "Startseite" })).toHaveAttribute("href", "/");
  });

  it("uses a labelled modal and an explicit close control", () => {
    const onClose = vi.fn();
    render(
      <Dialog description="Bitte prüfen" onClose={onClose} open title="Ergebnis ändern">
        Inhalt
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Ergebnis ändern" })).toHaveAccessibleDescription(
      "Bitte prüfen",
    );
    fireEvent.click(screen.getByRole("button", { name: "Dialog schließen" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
