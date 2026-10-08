import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/features/rounds/actions", () => ({
  rolloverRoundAction: vi.fn(),
}));
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
  render(
    <SeasonReviewView
      isOwner={false}
      hasSuccessor={false}
      options={[]}
      review={review}
      roundId="round"
      roundVersion={1}
      successorRoundId={null}
    />,
  );
  expect(screen.getByRole("heading", { name: "Saison abgeschlossen" })).toBeInTheDocument();
  for (const name of ["Alex", "Ben", "Chris", "Daniel"])
    expect(screen.getByText(name, { exact: false })).toBeInTheDocument();
  expect(screen.getByText("Dein Saisonergebnis")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Gesamte Endrangliste ansehen" })).toHaveAttribute(
    "href",
    "/rounds/round/rankings",
  );
});

it("offers the owner a later published season without hiding the final table", () => {
  const review = buildSeasonReview([]);
  render(
    <SeasonReviewView
      isOwner
      hasSuccessor={false}
      options={[
        {
          ends_on: "2028-06-30",
          league_name: "A-Klasse Vilshofen",
          league_season_id: "20000000-0000-4000-8000-000000000001",
          league_short_name: null,
          season_label: "27/28",
          source_round_id: "10000000-0000-4000-8000-000000000001",
          starts_on: "2027-07-01",
        },
      ]}
      review={review}
      roundId="10000000-0000-4000-8000-000000000001"
      roundVersion={3}
      successorRoundId={null}
    />,
  );

  expect(screen.getByText("Tipprunde in neue Saison übernehmen")).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "A-Klasse Vilshofen · 27/28" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Gesamte Endrangliste ansehen" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Neue Tipprunde erstellen" })).toBeInTheDocument();
});

it("links all members to the already created successor season", () => {
  render(
    <SeasonReviewView
      isOwner={false}
      hasSuccessor
      options={[]}
      review={buildSeasonReview([])}
      roundId="round"
      roundVersion={1}
      successorRoundId="next-round"
    />,
  );

  expect(screen.getByRole("link", { name: "Neue Saison öffnen" })).toHaveAttribute(
    "href",
    "/rounds/next-round",
  );
});

it("does not offer another rollover when the successor is inaccessible", () => {
  render(
    <SeasonReviewView
      isOwner
      hasSuccessor
      options={[]}
      review={buildSeasonReview([])}
      roundId="round"
      roundVersion={1}
      successorRoundId={null}
    />,
  );
  expect(
    screen.getByText("Diese Tipprunde wurde bereits in die nächste Saison übernommen."),
  ).toBeVisible();
  expect(screen.queryByText("Tipprunde in neue Saison übernehmen")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Neue Saison öffnen" })).not.toBeInTheDocument();
});
