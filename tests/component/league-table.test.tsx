import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LeagueTable } from "@/components/standings/league-table";

afterEach(cleanup);

describe("LeagueTable", () => {
  it("zeigt die kompakte Ligatabelle mit Logo und allen Kennzahlen", () => {
    render(
      <LeagueTable
        rows={[
          {
            clubId: "club-1",
            clubName: "SV Beispiel",
            logoUrl: "https://images.example.test/club.png",
            played: 4,
            goalsFor: 9,
            goalsAgainst: 3,
            points: 10,
            rank: 1,
          },
          {
            clubId: "club-2",
            clubName: "FC Gegenbeispiel",
            logoUrl: null,
            played: 4,
            goalsFor: 3,
            goalsAgainst: 9,
            points: 1,
            rank: 2,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ligatabelle" })).toBeInTheDocument();
    expect(screen.getByText("4 gewertete Spiele")).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /SV Beispiel/ });
    expect(row).toHaveTextContent("1.");
    expect(row).toHaveTextContent("4");
    expect(row).toHaveTextContent("9:3");
    expect(row).toHaveTextContent("10");
    expect(row.querySelector("img")).toHaveAttribute("src", "https://images.example.test/club.png");
  });
});
