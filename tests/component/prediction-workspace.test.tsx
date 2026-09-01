import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PredictionWorkspace } from "@/components/predictions/prediction-workspace";
import type { PredictionSheetRow } from "@/features/predictions/types";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  requestBadgeRefresh: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  saveBatch: vi.fn(),
}));

vi.mock("@/features/notifications/browser-client", () => ({
  requestOpenTipBadgeRefresh: mocks.requestBadgeRefresh,
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
  window.localStorage.clear();
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
  it("zeigt bei einer einzelnen Saisonhälfte nur das Spieltags-Dropdown", () => {
    render(
      <PredictionWorkspace
        matches={matches}
        options={[
          {
            id: "30000000-0000-4000-8000-000000000001",
            incomplete: true,
            label: "Hinrunde · Spieltag 1",
            number: 1,
            phase: "first_leg",
            startsOn: "2099-07-24",
            endsOn: "2099-07-26",
          },
        ]}
        roundId="20000000-0000-4000-8000-000000000001"
        selectedId="30000000-0000-4000-8000-000000000001"
        visible={[]}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Spieltag" })).toHaveValue(
      "30000000-0000-4000-8000-000000000001",
    );
    expect(screen.queryByRole("combobox", { name: "Runde" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "24.07.2099" })).toHaveLength(1);
    expect(screen.queryByText("Geplant")).not.toBeInTheDocument();
    expect(screen.queryByText("Tipp unvollständig")).not.toBeInTheDocument();
  });

  it("filtert das Dropdown nach Saisonhälfte und wechselt mit den Pfeilen über deren Grenze", () => {
    const options = [
      {
        id: "30000000-0000-4000-8000-000000000001",
        incomplete: false,
        label: "Hinrunde · Spieltag 1",
        number: 1,
        phase: "first_leg" as const,
        startsOn: "2099-07-24",
        endsOn: "2099-07-26",
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        incomplete: true,
        label: "Hinrunde · Spieltag 2",
        number: 2,
        phase: "first_leg" as const,
        startsOn: "2099-07-31",
        endsOn: "2099-08-02",
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        incomplete: true,
        label: "Rückrunde · Spieltag 1",
        number: 1,
        phase: "second_leg" as const,
        startsOn: "2100-01-22",
        endsOn: "2100-01-24",
      },
    ];

    const view = render(
      <PredictionWorkspace
        matches={matches}
        options={options}
        roundId="20000000-0000-4000-8000-000000000001"
        selectedId="30000000-0000-4000-8000-000000000002"
        visible={[]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Nächster Spieltag: Rückrunde · Spieltag 1, offen",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/rounds/20000000-0000-4000-8000-000000000001/predictions?matchday=30000000-0000-4000-8000-000000000003",
    );

    const phaseSelect = screen.getByRole("combobox", { name: "Runde" });
    const matchdaySelect = screen.getByRole("combobox", { name: "Spieltag" });
    expect(phaseSelect).toHaveValue("first_leg");
    expect(within(matchdaySelect).getAllByRole("option")).toHaveLength(2);
    expect(within(matchdaySelect).queryByText("Rückrunde · Spieltag 1")).not.toBeInTheDocument();

    fireEvent.change(phaseSelect, { target: { value: "second_leg" } });
    expect(mocks.push).toHaveBeenLastCalledWith(
      "/rounds/20000000-0000-4000-8000-000000000001/predictions?matchday=30000000-0000-4000-8000-000000000003",
    );

    view.rerender(
      <PredictionWorkspace
        matches={matches}
        options={options}
        roundId="20000000-0000-4000-8000-000000000001"
        selectedId="30000000-0000-4000-8000-000000000003"
        visible={[]}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Runde" })).toHaveValue("second_leg");
    expect(
      within(screen.getByRole("combobox", { name: "Spieltag" })).getAllByRole("option"),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: "Vorheriger Spieltag: Hinrunde · Spieltag 2, offen",
      }),
    ).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Spieltag" })).toHaveValue(
      "30000000-0000-4000-8000-000000000003",
    );
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
            phase: "first_leg",
            startsOn: "2099-07-24",
            endsOn: "2099-07-26",
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
    expect(mocks.requestBadgeRefresh).toHaveBeenCalledTimes(1);
  });

  it("bietet die Installation erst nach einem erfolgreich gespeicherten Tipp an", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(installEvent, {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
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
            phase: "first_leg",
            startsOn: "2099-07-24",
            endsOn: "2099-07-26",
          },
        ]}
        roundId="20000000-0000-4000-8000-000000000001"
        selectedId="30000000-0000-4000-8000-000000000001"
        visible={[]}
      />,
    );

    window.dispatchEvent(installEvent);
    expect(screen.queryByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Tore FC Heim"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Tore SV Auswärts"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Tipps speichern" }));

    expect(await screen.findByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "App installieren" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  });
});
