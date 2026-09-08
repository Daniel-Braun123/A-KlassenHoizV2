import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ name: vi.fn(), email: vi.fn(), password: vi.fn() }));
vi.mock("@/features/profile/account-edit-actions", () => ({
  changeDisplayNameAction: mocks.name,
  changeAccountEmailAction: mocks.email,
  changeAccountPasswordAction: mocks.password,
}));
import { AccountDetailsView } from "@/components/profile/account-details";

afterEach(cleanup);

const account = {
  displayName: "Testperson",
  email: "test@example.test",
  createdAt: "2026-07-13T12:00:00Z",
  emailConfirmed: true,
  providers: ["email"],
};

it("shows only available edits for a Google-only account", () => {
  render(<AccountDetailsView account={{ ...account, providers: ["google"] }} />);
  expect(screen.getByRole("button", { name: "Anzeigename ändern" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "E-Mail-Adresse ändern" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Passwort ändern" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Google-Konto verwalten/ })).toHaveAttribute(
    "href",
    "https://myaccount.google.com/",
  );
});

it("saves a name inline and restores focus to its edit button", async () => {
  mocks.name.mockResolvedValue({
    status: "success",
    message: "Dein Anzeigename wurde gespeichert.",
  });
  render(<AccountDetailsView account={account} />);
  fireEvent.click(screen.getByRole("button", { name: "Anzeigename ändern" }));
  const input = screen.getByLabelText(/Neuer Anzeigename/);
  expect(input).toHaveValue("Testperson");
  fireEvent.change(input, { target: { value: "Neuer Name" } });
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("gespeichert"));
  expect(mocks.name.mock.calls.at(-1)?.[1].get("displayName")).toBe("Neuer Name");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Anzeigename ändern" })).toHaveFocus();
});

it("keeps the requested email in the form when current-password validation fails", async () => {
  mocks.email.mockResolvedValue({
    status: "error",
    fieldErrors: { currentPassword: "Das aktuelle Passwort stimmt nicht." },
  });
  render(<AccountDetailsView account={account} />);
  fireEvent.click(screen.getByRole("button", { name: "E-Mail-Adresse ändern" }));
  fireEvent.change(screen.getByLabelText(/Neue E-Mail-Adresse/), {
    target: { value: "neu@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/Aktuelles Passwort/), {
    target: { value: "Falsch123!" },
  });
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("stimmt nicht"));
  expect(screen.getByLabelText(/Neue E-Mail-Adresse/)).toHaveValue("neu@example.test");
  expect(screen.getByLabelText(/Aktuelles Passwort/)).toHaveFocus();
});

it("lets a pending email be corrected or confirmed again without displaying it as current", () => {
  render(<AccountDetailsView account={{ ...account, pendingEmail: "pending@example.test" }} />);
  expect(screen.getByText("test@example.test")).toBeVisible();
  expect(screen.getByText(/Bestätigung ausstehend für pending@example.test/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "E-Mail-Adresse ändern" }));
  expect(screen.getByLabelText(/Neue E-Mail-Adresse/)).toHaveValue("pending@example.test");
  fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
});

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
