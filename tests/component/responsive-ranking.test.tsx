import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ResponsiveRanking } from "@/components/rankings/responsive-ranking";

afterEach(cleanup);

describe("ResponsiveRanking", () => {
  it("shows five compact columns including the scored tip count", () => {
    render(
      <ResponsiveRanking
        title="Gesamt"
        rows={[
          {
            round_id: "20000000-0000-4000-8000-000000000001",
            membership_id: "30000000-0000-4000-8000-000000000001",
            nickname: "Dän",
            membership_status: "active",
            points: 7,
            exact_scores: 1,
            scored_tips: 3,
            rank: 2,
            is_current_user: true,
          },
        ]}
      />,
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.getByRole("columnheader", { name: "Exakte Ergebnisse" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Gewertete Tipps" })).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /Dän/ });
    expect(within(row).getAllByRole("cell")).toHaveLength(4);
    expect(within(row).getByRole("cell", { name: "3" })).toBeInTheDocument();
  });
});
