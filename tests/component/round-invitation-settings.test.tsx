import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/features/invitations/actions", () => ({
  rotateInvitationAction: vi.fn(),
  revokeInvitationAction: vi.fn(),
}));
vi.mock("@/components/ui/navigation-pending-indicator", () => ({
  NavigationPendingIndicator: () => null,
}));
import { RoundInvitationSettings } from "@/components/rounds/round-invitation-settings";
afterEach(cleanup);

it("offers invitations while the round has no successor", () => {
  render(<RoundInvitationSettings roundId="old" hasSuccessor={false} successorRoundId={null} />);
  expect(screen.getByRole("button", { name: "Neuen 7-Tage-Link erzeugen" })).toBeVisible();
});

it("replaces invitations with a link to the accessible successor", () => {
  render(<RoundInvitationSettings roundId="old" hasSuccessor successorRoundId="new" />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Neue Saison öffnen" })).toHaveAttribute(
    "href",
    "/rounds/new",
  );
});

it("keeps invitations disabled when the owner cannot access the successor", () => {
  render(<RoundInvitationSettings roundId="old" hasSuccessor successorRoundId={null} />);
  expect(screen.getByRole("heading", { name: "Einladungen zur neuen Saison" })).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
