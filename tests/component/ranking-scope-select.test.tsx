import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RankingScopeSelect } from "@/components/rankings/ranking-scope-select";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const options = [
  { id: "30000000-0000-4000-8000-000000000001", label: "Hinrunde · Spieltag 1" },
  { id: "30000000-0000-4000-8000-000000000002", label: "Hinrunde · Spieltag 2" },
];

describe("RankingScopeSelect", () => {
  it("bietet Gesamt- und Spieltagsranglisten in genau einem Dropdown an", () => {
    render(
      <RankingScopeSelect
        options={options}
        roundId="20000000-0000-4000-8000-000000000001"
        selected="overall"
      />,
    );

    const select = screen.getByRole("combobox", { name: "Rangliste" });
    expect(select).toHaveValue("overall");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: "Gesamt" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hinrunde · Spieltag 1" })).toBeInTheDocument();
  });

  it("navigiert direkt zum gewählten Spieltag und zurück zur Gesamtansicht", async () => {
    const { rerender } = render(
      <RankingScopeSelect
        options={options}
        roundId="20000000-0000-4000-8000-000000000001"
        selected="overall"
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Rangliste" }), {
      target: { value: options[1]!.id },
    });
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/rounds/20000000-0000-4000-8000-000000000001/rankings?matchday=30000000-0000-4000-8000-000000000002",
      ),
    );

    rerender(
      <RankingScopeSelect
        options={options}
        roundId="20000000-0000-4000-8000-000000000001"
        selected={options[1]!.id}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Rangliste" }), {
      target: { value: "overall" },
    });
    await waitFor(() =>
      expect(mocks.push).toHaveBeenLastCalledWith(
        "/rounds/20000000-0000-4000-8000-000000000001/rankings",
      ),
    );
  });
});
