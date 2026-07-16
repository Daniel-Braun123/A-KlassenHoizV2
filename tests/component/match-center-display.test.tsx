import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchCenterDisplay } from "@/components/competition/match-center-display";
import type { AdminScheduleRow } from "@/features/competition/schedule-service";

const kickoffAt = "2026-07-24T17:00:00.000Z";
const kickoffTime = new Date(kickoffAt).getTime();

function match(overrides: Partial<AdminScheduleRow> = {}): AdminScheduleRow {
  return {
    away_goals: null,
    decision: null,
    home_goals: null,
    kickoff_at: kickoffAt,
    match_status: "published",
    ...overrides,
  } as AdminScheduleRow;
}

describe("MatchCenterDisplay", () => {
  it("zeigt vor dem Anpfiff die kompakte Berliner Uhrzeit", () => {
    render(<MatchCenterDisplay now={kickoffTime - 1} row={match()} />);
    expect(screen.getByText("19:00")).toBeInTheDocument();
  });

  it("zeigt während des Spiels LIVE mit rotem Statuspunkt", () => {
    render(<MatchCenterDisplay now={kickoffTime + 30 * 60 * 1000} row={match()} />);
    const live = screen.getByLabelText("Live");
    expect(live).toHaveTextContent("LIVE");
    expect(live.querySelector(".match-center-display__live-dot")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("zeigt ein vorhandenes Ergebnis statt der Uhrzeit", () => {
    render(
      <MatchCenterDisplay
        now={kickoffTime + 120 * 60 * 1000}
        row={match({ away_goals: 3, decision: "official", home_goals: 2 })}
      />,
    );
    expect(screen.getByLabelText("Ergebnis")).toHaveTextContent("2 : 3");
  });

  it("kennzeichnet beendete Spiele ohne Ergebnis", () => {
    render(<MatchCenterDisplay now={kickoffTime + 90 * 60 * 1000} row={match()} />);
    expect(screen.getByText("Ergebnis fehlt")).toBeInTheDocument();
  });
});
