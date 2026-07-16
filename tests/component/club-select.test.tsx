import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ClubSelect, type ClubSelectOption } from "@/components/competition/club-select";

afterEach(cleanup);

const clubs: ClubSelectOption[] = [
  {
    id: "alpha",
    logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    name: "FC Alpha",
  },
  { id: "beta", logoUrl: null, name: "SV Beta" },
];

function ClubSelectFixture({ disabledIds = new Set<string>() }: { disabledIds?: Set<string> }) {
  const [value, setValue] = useState("");
  return (
    <form>
      <ClubSelect
        clubs={clubs}
        disabledIds={disabledIds}
        label="Heimverein"
        name="homeClubId"
        onChange={setValue}
        value={value}
      />
    </form>
  );
}

describe("ClubSelect", () => {
  it("zeigt für jede Vereinsoption Logo oder Initialen-Fallback", () => {
    const { container } = render(<ClubSelectFixture />);

    expect(container.querySelectorAll(".club-select__option .club-logo")).toHaveLength(2);
    expect(container.querySelector(".club-select__option img")).toHaveAttribute("alt", "");
    expect(container.querySelector(".club-select__option .club-logo--fallback")).toHaveTextContent(
      "SB",
    );
  });

  it("übernimmt Verein und Logo in den geschlossenen Auslöser", () => {
    const { container } = render(<ClubSelectFixture />);

    fireEvent.click(screen.getByRole("button", { name: "FC Alpha" }));

    expect(container.querySelector('input[name="homeClubId"]')).toHaveValue("alpha");
    expect(container.querySelector(".club-select__value")).toHaveTextContent("FC Alpha");
    expect(container.querySelector(".club-select__value img")).toBeInTheDocument();
  });

  it("verhindert die Auswahl bereits belegter Vereine", () => {
    const { container } = render(<ClubSelectFixture disabledIds={new Set(["beta"])} />);
    const blockedOption = screen.getByRole("button", { name: "SV Beta" });

    expect(blockedOption).toBeDisabled();
    fireEvent.click(blockedOption);

    expect(container.querySelector('input[name="homeClubId"]')).toHaveValue("");
  });
});
