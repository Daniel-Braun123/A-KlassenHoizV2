import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ClubLogoField } from "@/components/competition/club-logo-field";

afterEach(cleanup);

describe("ClubLogoField", () => {
  it("bietet Upload, URL und einen Initialen-Fallback als klare Quellen an", () => {
    const { container } = render(<ClubLogoField name="SV Beispiel" />);

    expect(screen.getByRole("radio", { name: "Bild hochladen" })).toBeChecked();
    expect(screen.getByText("Logo hier ablegen")).toBeInTheDocument();
    expect(screen.getByText(/Strg \+ V/)).toBeInTheDocument();
    expect(
      container.querySelector(".club-logo-field__preview .club-logo--fallback"),
    ).toHaveTextContent("SB");
  });

  it("zeigt eine eingegebene HTTPS-Adresse unmittelbar in der Vorschau", () => {
    const { container } = render(<ClubLogoField name="FC Vorschau" />);

    fireEvent.click(screen.getByRole("radio", { name: "Bild-URL" }));
    const urlInput = screen.getByRole("textbox", { name: "Logo-URL" });
    fireEvent.change(urlInput, { target: { value: "https://example.test/logo.webp" } });

    expect(urlInput).toBeRequired();
    expect(container.querySelector(".club-logo-field__preview img")).toHaveAttribute(
      "src",
      "https://example.test/logo.webp",
    );
  });

  it("kann ein bestehendes Logo bewusst entfernen", () => {
    const { container } = render(
      <ClubLogoField initialLogoUrl="https://example.test/logo.webp" name="TSV Beispiel" />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Kein Logo" }));

    expect(container.querySelector(".club-logo-field__preview img")).not.toBeInTheDocument();
    expect(
      container.querySelector(".club-logo-field__preview .club-logo--fallback"),
    ).toHaveTextContent("TB");
    expect(screen.getByText("Initialen werden als Platzhalter angezeigt")).toBeInTheDocument();
  });
});
