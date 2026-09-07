import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AccountDetailsView } from "@/components/profile/account-details";

afterEach(cleanup);

it("shows account details and links to the existing deletion confirmation", () => {
  render(
    <AccountDetailsView
      account={{
        displayName: "Testperson",
        email: "test@example.test",
        createdAt: "2026-07-13T12:00:00Z",
        emailConfirmed: true,
        providers: ["email", "google"],
      }}
    />,
  );
  expect(screen.getByText("Testperson")).toBeVisible();
  expect(screen.getByText("test@example.test")).toBeVisible();
  expect(screen.getByText("13. Juli 2026")).toBeVisible();
  expect(screen.getByText("E-Mail und Google")).toBeVisible();
  expect(screen.getByRole("link", { name: "Zur Kontolöschung" })).toHaveAttribute(
    "href",
    "/profile/delete-account",
  );
});
