import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BfvScheduleImport } from "@/components/competition/bfv-schedule-import";
import {
  importBfvScheduleAction,
  previewBfvScheduleAction,
} from "@/features/competition/bfv-import-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/competition/bfv-import-actions", () => ({
  importBfvScheduleAction: vi.fn(),
  previewBfvScheduleAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BFV schedule import", () => {
  it("is a compact, optional admin workflow with an accessible PDF input", () => {
    const { container } = render(
      <BfvScheduleImport
        clubs={[
          { id: "home", logoUrl: null, name: "SV Hofkirchen 2" },
          { id: "away", logoUrl: null, name: "SV Beutelsbach" },
        ]}
        leagueId="00000000-0000-4000-8000-000000000001"
        schedule={[]}
        yearLabel="26/27"
      />,
    );

    const disclosure = container.querySelector("details");
    expect(screen.getByText("BFV-Spielplan importieren")).toBeInTheDocument();
    expect(disclosure).not.toHaveAttribute("open");

    fireEvent.click(container.querySelector("summary")!);

    const fileInput = screen.getByLabelText(/BFV-Spielplan-PDF/);
    expect(fileInput).toHaveAttribute("accept", "application/pdf,.pdf");
    expect(screen.getByRole("button", { name: "PDF auswählen" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "PDF prüfen und Vorschau erstellen" }),
    ).toBeDisabled();

    const pdf = new File(["pdf"], "spielplan.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    expect(screen.queryByRole("button", { name: "PDF auswählen" })).toBeNull();
    expect(screen.getByText("spielplan.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ändern" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entfernen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF prüfen und Vorschau erstellen" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Entfernen" }));
    expect(screen.getByRole("button", { name: "PDF auswählen" })).toBeInTheDocument();
    expect(screen.queryByText("spielplan.pdf")).toBeNull();
    expect(screen.queryByRole("button", { name: "Spielplan jetzt importieren" })).toBeNull();
  });

  it("accepts one PDF by drag and drop and rejects unsupported files", () => {
    const { container } = render(
      <BfvScheduleImport
        clubs={[]}
        leagueId="00000000-0000-4000-8000-000000000001"
        schedule={[]}
        yearLabel="26/27"
      />,
    );

    fireEvent.click(container.querySelector("summary")!);
    const dropzone = container.querySelector<HTMLElement>(".bfv-import-dropzone")!;
    const previewButton = screen.getByRole("button", {
      name: "PDF prüfen und Vorschau erstellen",
    });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File(["text"], "spielplan.txt", { type: "text/plain" })],
        types: ["Files"],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Bitte wähle eine PDF-Datei aus.");
    expect(previewButton).toBeDisabled();

    const pdf = new File(["pdf"], "bfv-spielplan.pdf", { type: "application/pdf" });
    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [pdf], types: ["Files"] },
    });
    expect(dropzone).toHaveAttribute("data-dragging", "true");

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [pdf], types: ["Files"] },
    });
    expect(dropzone).not.toHaveAttribute("data-dragging");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("bfv-spielplan.pdf")).toBeInTheDocument();
    expect(previewButton).toBeEnabled();
  });

  it("groups the preview by date, shows club logos and confirms a completed import", async () => {
    vi.mocked(previewBfvScheduleAction).mockResolvedValue({
      status: "success",
      document: {
        documentDate: "2026-08-31",
        leagueName: "A-Klasse Vilshofen",
        leagueNumber: "312541",
        matchdays: [
          {
            endsOn: "2026-07-26",
            matches: [
              {
                awayClubName: "SV Beutelsbach",
                date: "2026-07-26",
                homeClubName: "SV Hofkirchen 2",
                kickoffAt: "2026-07-26T13:00:00.000Z",
                result: null,
                sourceMarkedChanged: false,
                sourceMatchNumber: "312540002",
                sourceMatchdayNumber: 1,
                time: "15:00",
              },
              {
                awayClubName: "SV Beutelsbach",
                date: "2026-07-24",
                homeClubName: "SV Hofkirchen 2",
                kickoffAt: "2026-07-24T17:00:00.000Z",
                result: null,
                sourceMarkedChanged: false,
                sourceMatchNumber: "312540001",
                sourceMatchdayNumber: 1,
                time: "19:00",
              },
            ],
            phase: "first_leg",
            phaseNumber: 1,
            sourceNumber: 1,
            startsOn: "2026-07-24",
          },
        ],
        pageCount: 1,
        seasonLabel: "26/27",
        sourceClubNames: ["SV Beutelsbach", "SV Hofkirchen 2"],
        sourceMarkedChangedCount: 0,
        sourceResultCount: 0,
        warnings: [],
      },
      initialMappings: { "SV Beutelsbach": "away", "SV Hofkirchen 2": "home" },
      seasonMatches: true,
    });
    vi.mocked(importBfvScheduleAction).mockResolvedValue({
      status: "success",
      message: "1 Spieltag und 2 Spiele wurden neu angelegt.",
      result: {
        createdMatches: 2,
        createdMatchdays: 1,
        unchangedMatches: 0,
        updatedMatches: 0,
        updatedMatchdays: 0,
      },
    });

    const { container } = render(
      <BfvScheduleImport
        clubs={[
          { id: "home", logoUrl: "https://example.com/home.png", name: "SV Hofkirchen 2" },
          { id: "away", logoUrl: "https://example.com/away.png", name: "SV Beutelsbach" },
        ]}
        leagueId="00000000-0000-4000-8000-000000000001"
        schedule={[]}
        yearLabel="26/27"
      />,
    );

    fireEvent.click(container.querySelector("summary")!);
    fireEvent.change(screen.getByLabelText(/BFV-Spielplan-PDF/), {
      target: { files: [new File(["pdf"], "spielplan.pdf", { type: "application/pdf" })] },
    });
    fireEvent.submit(container.querySelector("form")!);

    await screen.findByRole("button", { name: "Spielplan jetzt importieren" });
    expect(container.querySelectorAll(".bfv-import-matchday__chevron")).toHaveLength(1);
    expect(
      [...container.querySelectorAll(".bfv-import-match-date-group h5")].map(
        (heading) => heading.textContent,
      ),
    ).toEqual(["24.07.2026", "26.07.2026"]);
    expect(container.querySelectorAll(".bfv-import-match__logo")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Spielplan jetzt importieren" }));
    await waitFor(() => expect(importBfvScheduleAction).toHaveBeenCalledOnce());
    expect(await screen.findByRole("button", { name: "Spielplan importiert" })).toBeDisabled();
  });
});
