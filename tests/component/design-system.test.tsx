import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/patterns/form-status";
import { StatusState } from "@/components/patterns/status-state";
import {
  PredictionsSkeleton,
  RankingSkeleton,
  ScheduleSkeleton,
} from "@/components/patterns/route-loading";
describe("design system states", () => {
  it("exposes disabled buttons without removing their name", () => {
    render(<Button disabled>Speichern</Button>);
    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled();
  });
  it("uses assertive error and polite success semantics", () => {
    const { rerender } = render(<FormStatus status="error">Fehler</FormStatus>);
    expect(screen.getByRole("alert")).toHaveTextContent("Fehler");
    rerender(<FormStatus status="success">Gespeichert</FormStatus>);
    expect(screen.getByRole("status")).toHaveTextContent("Gespeichert");
  });
  it("never relies on the status symbol as its accessible name", () => {
    render(
      <StatusState kind="locked" title="Geschlossen" description="Die Frist ist abgelaufen." />,
    );
    expect(screen.getByRole("heading", { name: "Geschlossen" })).toBeVisible();
    expect(screen.queryByText("—")).toHaveAttribute("aria-hidden", "true");
  });
  it("announces streamed page loading without exposing decorative placeholders", () => {
    render(<PredictionsSkeleton />);
    const status = screen.getByRole("status", { name: "Tipps werden geladen" });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status.querySelectorAll(".route-loading__match-row")).toHaveLength(4);
    expect(status.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });
  it("uses distinct geometry and descriptions for different route types", () => {
    const { rerender } = render(<RankingSkeleton />);
    const rankingStatus = screen.getByRole("status", { name: "Rangliste wird geladen" });
    expect(rankingStatus).toBeVisible();
    expect(rankingStatus.querySelectorAll(".route-loading__table-row")).toHaveLength(5);

    rerender(<ScheduleSkeleton />);
    const scheduleStatus = screen.getByRole("status", { name: "Spielplan wird geladen" });
    expect(scheduleStatus).toBeVisible();
    expect(scheduleStatus.querySelector(".route-loading__schedule-grid")).toBeInTheDocument();
    expect(scheduleStatus.querySelectorAll(".route-loading__match-row")).toHaveLength(4);
  });
});
