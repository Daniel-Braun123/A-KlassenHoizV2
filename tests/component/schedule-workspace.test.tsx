import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScheduleWorkspace } from "@/components/competition/schedule-workspace";
import type { AdminLeagueRow, AdminScheduleRow } from "@/features/competition/schedule-service";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/competition/bfv-schedule-import", () => ({ BfvScheduleImport: () => null }));
vi.mock("@/features/competition/schedule-actions", () => ({
  createMatchSimpleAction: vi.fn(),
  createMatchdayAutoAction: vi.fn(),
  deleteMatchSimpleAction: vi.fn(),
  deleteMatchdaySimpleAction: vi.fn(),
  moveMatchdayPhaseAction: vi.fn(),
  updateMatchdayPeriodAction: vi.fn(),
  updateMatchSimpleAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function day(id: string, number: number, phase: AdminScheduleRow["phase"]): AdminScheduleRow {
  return {
    matchday_id: id,
    matchday_number: number,
    phase,
    display_name: `${phase === "first_leg" ? "Hinrunde" : "Rückrunde"} · Spieltag ${number}`,
    matchday_version: 1,
    matchday_status: "published",
    starts_on: "2026-07-01",
    ends_on: "2026-07-02",
    match_id: null,
  } as AdminScheduleRow;
}

const league = { id: "league", year_label: "26/27" } as AdminLeagueRow;

describe("ScheduleWorkspace matchday navigation", () => {
  it("bietet ein gemeinsames Dropdown und Pfeile für beide Runden an", () => {
    render(
      <ScheduleWorkspace
        basePath="/admin/competitions/league"
        clubs={[]}
        schedule={[
          day("return-1", 1, "second_leg"),
          day("first-2", 2, "first_leg"),
          day("first-1", 1, "first_leg"),
        ]}
        selectedLeague={league}
        selectedMatchdayId="first-2"
      />,
    );
    const select = screen.getByRole("combobox", { name: "Spieltag" });
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Hinrunde · Spieltag 1", "Hinrunde · Spieltag 2", "Rückrunde · Spieltag 1"]);
    fireEvent.click(
      screen.getByRole("button", { name: "Nächster Spieltag: Rückrunde · Spieltag 1" }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/admin/competitions/league?matchday=return-1#selected-matchday-heading",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Vorheriger Spieltag: Hinrunde · Spieltag 1" }),
    );
    expect(mocks.push).toHaveBeenLastCalledWith(
      "/admin/competitions/league?matchday=first-1#selected-matchday-heading",
    );
    expect(screen.getAllByRole("button", { name: "Spieltag hinzufügen" })).toHaveLength(2);
  });

  it("sperrt die Auswahl bei leerem Spielplan und erlaubt weiterhin das Anlegen", () => {
    render(
      <ScheduleWorkspace
        basePath="/admin/competitions/league"
        clubs={[]}
        schedule={[]}
        selectedLeague={league}
        selectedMatchdayId={undefined}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Spieltag" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kein vorheriger Spieltag" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kein nächster Spieltag" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Spieltag hinzufügen" })).toHaveLength(2);
  });
});
