import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScheduleWorkspace } from "@/components/competition/schedule-workspace";
import type { AdminLeagueRow, AdminScheduleRow } from "@/features/competition/schedule-service";

const mocks = vi.hoisted(() => ({ push: vi.fn(), reschedule: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/competition/bfv-schedule-import", () => ({ BfvScheduleImport: () => null }));
vi.mock("@/features/competition/schedule-actions", () => ({
  createMatchSimpleAction: vi.fn(),
  createMatchdayAutoAction: vi.fn(),
  deleteMatchSimpleAction: vi.fn(),
  deleteMatchdaySimpleAction: vi.fn(),
  moveMatchdayPhaseAction: vi.fn(),
  rescheduleMatchAction: mocks.reschedule,
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

function predictedMatch(overrides: Partial<AdminScheduleRow> = {}): AdminScheduleRow {
  return {
    ...day("first-1", 1, "first_leg"),
    match_id: "match-1",
    match_version: 3,
    match_status: "published",
    kickoff_at: "2026-07-01T13:00:00Z",
    home_club_id: "home",
    home_club_name: "FC Heim",
    away_club_id: "away",
    away_club_name: "SV Gast",
    match_has_predictions: true,
    matchday_has_predictions: true,
    decision: null,
    ...overrides,
  } as AdminScheduleRow;
}

describe("ScheduleWorkspace matchday navigation", () => {
  it("verschiebt ein bereits getipptes Spiel auf einen Termin außerhalb des Spieltags", async () => {
    mocks.reschedule.mockResolvedValue({
      status: "success",
      message: "Das Spiel wurde verschoben.",
    });
    const { container } = render(
      <ScheduleWorkspace
        basePath="/admin/competitions/league"
        clubs={[]}
        schedule={[predictedMatch()]}
        selectedLeague={league}
        selectedMatchdayId="first-1"
      />,
    );
    fireEvent.click(screen.getByText("Spiel verwalten: FC Heim gegen SV Gast"));
    const newKickoff = screen.getByLabelText(/^Neuer Anpfiff/);
    expect(newKickoff).not.toHaveAttribute("min");
    expect(newKickoff).not.toHaveAttribute("max");
    expect(
      screen.queryByRole("button", { name: "Spiel endgültig löschen" }),
    ).not.toBeInTheDocument();
    expect(container.querySelector('.match-admin-item__edit input[name="homeClubId"]')).toBeNull();
    fireEvent.change(newKickoff, { target: { value: "2026-08-15T16:00" } });
    fireEvent.submit(newKickoff.closest("form")!);
    await waitFor(() => expect(mocks.reschedule).toHaveBeenCalledOnce());
    const data = mocks.reschedule.mock.calls[0]![1] as FormData;
    expect(Object.fromEntries(data)).toEqual({
      leagueId: "league",
      id: "match-1",
      expectedVersion: "3",
      kickoffAt: "2026-08-15T16:00",
    });
    expect(await screen.findByText("Das Spiel wurde verschoben.")).toBeInTheDocument();
  });

  it.each(["official", "excluded"] as const)(
    "sperrt das Verschieben mit gespeichertem Ergebnis (%s)",
    (decision) => {
      render(
        <ScheduleWorkspace
          basePath="/admin/competitions/league"
          clubs={[]}
          schedule={[
            predictedMatch({
              decision,
              home_goals: decision === "official" ? 2 : null,
              away_goals: decision === "official" ? 1 : null,
            }),
          ]}
          selectedLeague={league}
          selectedMatchdayId="first-1"
        />,
      );
      fireEvent.click(screen.getByText("Spiel verwalten: FC Heim gegen SV Gast"));
      expect(screen.queryByLabelText(/^Neuer Anpfiff/)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Spiel verschieben" })).not.toBeInTheDocument();
      expect(screen.getByText(/bereits ein Ergebnis vor/)).toBeInTheDocument();
    },
  );

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
