import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Link from "next/link";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ResultManager } from "@/components/competition/result-manager";
import type { AdminScheduleRow } from "@/features/competition/schedule-service";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  saveBatch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/features/competition/result-actions", () => ({
  setMatchResultsBatchAction: mocks.saveBatch,
}));

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterAll(() => {
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalClose;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function match(overrides: Partial<AdminScheduleRow>): AdminScheduleRow {
  return {
    away_club_id: "20000000-0000-4000-8000-000000000001",
    away_club_logo_url: null,
    away_club_name: "SV Auswärts",
    away_goals: null,
    decision: null,
    display_name: "Hinrunde · Spieltag 1",
    home_club_id: "10000000-0000-4000-8000-000000000001",
    home_club_logo_url: null,
    home_club_name: "FC Heim",
    home_goals: null,
    kickoff_at: "2000-07-01T13:00:00.000Z",
    league_id: "30000000-0000-4000-8000-000000000001",
    league_name: "A-Klasse Test",
    match_id: "40000000-0000-4000-8000-000000000001",
    match_status: "published",
    match_version: 1,
    matchday_id: "50000000-0000-4000-8000-000000000001",
    matchday_number: 1,
    phase: "first_leg",
    revision_no: 0,
    starts_on: "2000-07-01",
    ends_on: "2000-07-02",
    year_label: "26/27",
    ...overrides,
  } as AdminScheduleRow;
}

const schedule = [
  match({}),
  match({
    away_club_id: "20000000-0000-4000-8000-000000000002",
    away_club_name: "DJK Zwei",
    home_club_id: "10000000-0000-4000-8000-000000000002",
    home_club_name: "TSV Zwei",
    kickoff_at: "2000-07-01T15:00:00.000Z",
    match_id: "40000000-0000-4000-8000-000000000002",
  }),
];

describe("ResultManager", () => {
  it("sortiert beide Runden und schützt ungespeicherte Ergebnisse beim Pfeilwechsel", async () => {
    const firstLeg = match({
      display_name: "Hinrunde · Spieltag 2",
      matchday_number: 2,
      starts_on: "2099-01-01",
      ends_on: "2099-01-02",
    });
    const secondLeg = match({
      display_name: "Rückrunde · Spieltag 1",
      phase: "second_leg",
      matchday_id: "return-1",
      match_id: "return-match",
      home_club_name: "FC Rückrunde",
      starts_on: "2099-01-08",
      ends_on: "2099-01-09",
    });
    render(<ResultManager schedule={[secondLeg, firstLeg]} />);
    const select = screen.getByRole("combobox", { name: "Spieltag" });
    expect(screen.queryByRole("combobox", { name: "Runde" })).not.toBeInTheDocument();
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Hinrunde · Spieltag 2", "Rückrunde · Spieltag 1"]);
    expect(select).toHaveValue(firstLeg.matchday_id);
    fireEvent.change(screen.getByLabelText("Tore FC Heim"), { target: { value: "1" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Nächster Spieltag: Rückrunde · Spieltag 1" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Ungespeicherte Änderungen" }),
    ).toBeInTheDocument();
    expect(select).toHaveValue(firstLeg.matchday_id);
    fireEvent.click(screen.getByRole("button", { name: "Änderungen verwerfen" }));
    await waitFor(() => expect(select).toHaveValue("return-1"));
    expect(screen.getByRole("button", { name: "Kein nächster Spieltag" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Vorheriger Spieltag: Hinrunde · Spieltag 2" }),
    );
    expect(select).toHaveValue(firstLeg.matchday_id);
  });

  it("zeigt Spiele datumsweise kompakt und nur einen gemeinsamen Speicherbutton", () => {
    const { container } = render(<ResultManager schedule={schedule} />);

    expect(screen.getByRole("heading", { name: "01.07.2000" })).toBeInTheDocument();
    expect(container.querySelectorAll(".result-match-item")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Ergebnisse speichern" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Nur dieses/i })).not.toBeInTheDocument();
  });

  it("speichert vollständige Spiele, obwohl andere Spiele leer bleiben", async () => {
    mocks.saveBatch.mockResolvedValue({ status: "success", message: "Ergebnis gespeichert." });
    render(<ResultManager schedule={schedule} />);

    fireEvent.change(screen.getByLabelText("Tore FC Heim"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Tore SV Auswärts"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Ergebnisse speichern" }));

    await waitFor(() => expect(mocks.saveBatch).toHaveBeenCalledTimes(1));
    const submittedData = mocks.saveBatch.mock.calls[0]![1] as FormData;
    const payload = JSON.parse(String(submittedData.get("results"))) as Array<{
      matchId: string;
      homeGoals: number;
      awayGoals: number;
    }>;
    expect(payload).toEqual([
      expect.objectContaining({
        awayGoals: 1,
        homeGoals: 2,
        matchId: "40000000-0000-4000-8000-000000000001",
      }),
    ]);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("speichert vollständige Änderungen und lässt unvollständige Spiele aus", async () => {
    mocks.saveBatch.mockResolvedValue({ status: "success", message: "Ergebnis gespeichert." });
    render(<ResultManager schedule={schedule} />);

    fireEvent.change(screen.getByLabelText("Tore FC Heim"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Tore TSV Zwei"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Tore DJK Zwei"), { target: { value: "0" } });

    const saveButton = screen.getByRole("button", { name: "Ergebnisse speichern" });
    expect(saveButton).toBeEnabled();
    expect(screen.getByText(/1 unvollständige Eingabe wird nicht gespeichert/)).toBeInTheDocument();
    fireEvent.click(saveButton);

    await waitFor(() => expect(mocks.saveBatch).toHaveBeenCalledTimes(1));
    const submittedData = mocks.saveBatch.mock.calls[0]![1] as FormData;
    const payload = JSON.parse(String(submittedData.get("results"))) as Array<{ matchId: string }>;
    expect(payload).toHaveLength(1);
    expect(payload[0]?.matchId).toBe("40000000-0000-4000-8000-000000000002");
  });

  it("warnt vor interner Navigation bei ungespeicherten Änderungen", async () => {
    render(
      <>
        <Link href="/admin/competitions">Andere Seite</Link>
        <ResultManager schedule={schedule} />
      </>,
    );

    fireEvent.change(screen.getByLabelText("Tore FC Heim"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("link", { name: "Andere Seite" }));

    expect(
      await screen.findByRole("heading", { name: "Ungespeicherte Änderungen" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter bearbeiten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Änderungen verwerfen" })).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
