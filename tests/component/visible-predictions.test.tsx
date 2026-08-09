import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { VisiblePredictions } from "@/components/predictions/visible-predictions";
import type { VisiblePrediction } from "@/features/predictions/types";

afterEach(cleanup);

type VisiblePredictionWithPoints = VisiblePrediction & { points: number | null };

function prediction(overrides: Partial<VisiblePredictionWithPoints>): VisiblePredictionWithPoints {
  return {
    away_goals: 1,
    home_goals: 2,
    kickoff_at: "2026-07-24T17:00:00.000Z",
    match_id: "10000000-0000-4000-8000-000000000001",
    membership_id: "30000000-0000-4000-8000-000000000001",
    nickname: "Dän",
    points: null,
    round_id: "20000000-0000-4000-8000-000000000001",
    updated_at: "2026-07-24T16:00:00.000Z",
    ...overrides,
  } as VisiblePredictionWithPoints;
}

describe("VisiblePredictions", () => {
  it("shows the earned points beside every scored prediction", () => {
    render(
      <VisiblePredictions
        predictions={[
          prediction({ membership_id: "30000000-0000-4000-8000-000000000001", points: 4 }),
          prediction({
            membership_id: "30000000-0000-4000-8000-000000000002",
            nickname: "Max",
            points: 0,
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getByText("Tipps der Runde (2)"));
    const predictions = screen.getAllByRole("listitem");
    expect(within(predictions[0]!).getByText("+4 P")).toBeVisible();
    expect(within(predictions[1]!).getByText("0 P")).toBeVisible();
  });

  it("does not show a points label before a result was scored", () => {
    render(<VisiblePredictions predictions={[prediction({ points: null })]} />);

    expect(screen.queryByText(/P$/u)).not.toBeInTheDocument();
  });
});
