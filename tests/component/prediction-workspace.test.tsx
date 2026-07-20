import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PredictionWorkspace } from "@/components/predictions/prediction-workspace";
import type { PredictionSheetRow } from "@/features/predictions/types";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  saveBatch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh, replace: mocks.replace }),
}));

vi.mock("@/features/predictions/actions", () => ({
  savePredictionsBatchAction: mocks.saveBatch,
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

function match(overrides: Partial<PredictionSheetRow>): PredictionSheetRow {
  return {
    away_club_name: "SV Auswärts",
    away_logo_path: null,
    away_logo_url: null,
    home_club_name: "FC Heim",
    home_logo_path: null,
    home_logo_url: null,
    is_open: true,
    kickoff_at: "2099-07-24T17:00:00.000Z",
    match_id: "10000000-0000-4000-8000-000000000001",
    match_status: "published",
    predicted_away_goals: null,
    predicted_home_goals: null,
    round_id: "20000000-0000-4000-8000-000000000001",
    ...overrides,
  } as PredictionSheetRow;
}

const matches = [
  match({}),
  match({
    away_club_name: "DJK Zwei",
    home_club_name: "TSV Zwei",
    kickoff_at: "2099-07-24T19:00:00.000Z",
    match_id: "10000000-0000-4000-8000-000000000002",
  }),
];

describe("PredictionWorkspace", () => {
  it("zeigt ein Spieltag-Dropdown und gruppiert Spiele unter einem gemeinsamen Datum", () => {
    render(
      <PredictionWorkspace
        matches={matches}
        options={[
          {
            id: "30000000-0000-4000-8000-000000000001",
            incomplete: true,
            label: "Hinrunde · Spieltag 1",
            number: 1,
          },
        ]}
        roundId="20000000-0000-4000-8000-000000000001"
        selectedId="30000000-0000-4000-8000-000000000001"
        visible={[]}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Spieltag" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "24.07.2099" })).toHaveLength(1);
    expect(screen.queryByText("Geplant")).not.toBeInTheDocument();
    expect(screen.queryByText("Tipp unvollständig")).not.toBeInTheDocument();
  });

  it("speichert geänderte Tipps erst nach Klick auf den gemeinsamen Button", async () => {
    mocks.saveBatch.mockResolvedValue({
      ok: true,
      data: { savedAt: "2099-07-24T17:00:00.000Z", savedCount: 1 },
    });
    render(
      <PredictionWorkspace
        matches={matches}
        options={[
          {
            id: "30000000-0000-4000-8000-000000000001",
            incomplete: true,
            label: "Hinrunde · Spieltag 1",
            number: 1,
          },
        ]}
        roundId="20000000-0000-4000-8000-000000000001"
        selectedId="30000000-0000-4000-8000-000000000001"
        visible={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tore FC Heim"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Tore SV Auswärts"), { target: { value: "1" } });
    expect(mocks.saveBatch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Tipps speichern" }));

    await waitFor(() => expect(mocks.saveBatch).toHaveBeenCalledTimes(1));
    expect(mocks.saveBatch.mock.calls[0]?.[0]).toEqual({
      predictions: [
        expect.objectContaining({
          awayGoals: 1,
          homeGoals: 2,
          matchId: "10000000-0000-4000-8000-000000000001",
        }),
      ],
      roundId: "20000000-0000-4000-8000-000000000001",
    });
    expect(await screen.findByText("Der Tipp wurde gespeichert.")).toBeInTheDocument();
    expect(mocks.replace).toHaveBeenCalledWith(
      "/rounds/20000000-0000-4000-8000-000000000001/predictions?matchday=30000000-0000-4000-8000-000000000001",
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
