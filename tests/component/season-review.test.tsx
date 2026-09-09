import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/components/ui/navigation-pending-indicator", () => ({
  NavigationPendingIndicator: () => null,
}));
import { SeasonReviewView } from "@/components/rounds/season-review";
import { buildSeasonReview } from "@/features/rounds/season-review";
afterEach(cleanup);
it("renders all tied winners, own result and the overall ranking link", () => {
  const review = buildSeasonReview(
    ["Alex", "Ben", "Chris", "Daniel"].map((nickname, i) => ({
      nickname,
      membership_id: String(i),
      round_id: "round",
      rank: 1,
      points: 100,
      membership_status: "active",
      is_current_user: i === 3,
      exact_scores: 1,
      scored_tips: 4,
    })),
  );
  render(<SeasonReviewView review={review} roundId="round" />);
  expect(screen.getByRole("heading", { name: "Saison abgeschlossen" })).toBeInTheDocument();
  for (const name of ["Alex", "Ben", "Chris", "Daniel"])
    expect(screen.getByText(name, { exact: false })).toBeInTheDocument();
  expect(screen.getByText("Dein Saisonergebnis")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Gesamte Endrangliste ansehen" })).toHaveAttribute(
    "href",
    "/rounds/round/rankings",
  );
});
