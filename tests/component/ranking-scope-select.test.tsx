import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RankingScopeSelect,
  type RankingScopeOption,
} from "@/components/rankings/ranking-scope-select";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const options: RankingScopeOption[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    label: "Hinrunde · Spieltag 1",
    number: 1,
    phase: "first_leg",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    label: "Hinrunde · Spieltag 2",
    number: 2,
    phase: "first_leg",
  },
];

describe("RankingScopeSelect", () => {
  it("ordnet beide Runden und navigiert mit Pfeilen über die Rundengrenze", async () => {
    const secondLeg: RankingScopeOption = {
      id: "return-1",
      label: "Rückrunde · Spieltag 1",
      number: 1,
      phase: "second_leg",
    };
    const { rerender } = render(
      <RankingScopeSelect
        options={[secondLeg, options[1]!, options[0]!]}
        roundId="round"
        selected={options[1]!.id}
      />,
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Gesamt",
      "Hinrunde · Spieltag 1",
      "Hinrunde · Spieltag 2",
      "Rückrunde · Spieltag 1",
    ]);
    fireEvent.click(
      screen.getByRole("button", { name: "Nächster Spieltag: Rückrunde · Spieltag 1" }),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenLastCalledWith("/rounds/round/rankings?matchday=return-1"),
    );
    rerender(
      <RankingScopeSelect options={[secondLeg, ...options]} roundId="round" selected="return-1" />,
    );
    expect(screen.getByRole("button", { name: "Kein nächster Spieltag" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Vorheriger Spieltag: Hinrunde · Spieltag 2" }),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenLastCalledWith(
        `/rounds/round/rankings?matchday=${options[1]!.id}`,
      ),
    );
  });

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
