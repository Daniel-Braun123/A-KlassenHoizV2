import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageBackLink } from "@/components/patterns/page-back-link";

describe("PageBackLink", () => {
  it("uses a semantic link with an explicit destination", () => {
    render(<PageBackLink accessibleLabel="Zurück zur Übersicht" href="/start" label="Übersicht" />);

    const link = screen.getByRole("link", { name: "Zurück zur Übersicht" });
    expect(link).toHaveAttribute("href", "/start");
    expect(link).toHaveTextContent("Übersicht");
  });
});
