import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteAccount: vi.fn(), google: vi.fn() }));
vi.mock("@/features/privacy/actions", () => ({
  deleteAccountAction: mocks.deleteAccount,
  startGoogleDeletionAction: mocks.google,
}));
import { DeleteAccountForm } from "@/components/profile/delete-account-form";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const props = {
  google: true,
  verified: false,
  email: "own@example.test",
  verificationError: false,
};

it("offers Google confirmation without an app password or premature delete button", async () => {
  mocks.google.mockResolvedValue({ status: "error", message: "Bitte erneut versuchen." });
  render(<DeleteAccountForm {...props} />);
  expect(screen.queryByLabelText(/Aktuelles Passwort/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Konto endgültig löschen" })).not.toBeInTheDocument();
  fireEvent.submit(screen.getByRole("form", { name: "Google-Konto bestätigen" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Bitte erneut versuchen."),
  );
  expect(mocks.deleteAccount).not.toHaveBeenCalled();
});

it("requires explicit final confirmation after Google returns and submits no password", async () => {
  mocks.deleteAccount.mockResolvedValue({
    status: "error",
    message: "Bitte bestätige dein Konto zuerst erneut mit Google.",
  });
  render(<DeleteAccountForm {...props} verified />);
  expect(screen.getByRole("status")).toHaveTextContent("Google-Konto wurde bestätigt");
  expect(screen.queryByLabelText(/Aktuelles Passwort/)).not.toBeInTheDocument();
  expect(mocks.deleteAccount).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Zur Bestätigung/), {
    target: { value: "KONTO LÖSCHEN" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Kontolöschung bestätigen" }));
  await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledOnce());
  const form = mocks.deleteAccount.mock.calls[0]![1] as FormData;
  expect(form.get("confirmation")).toBe("KONTO LÖSCHEN");
  expect(form.has("password")).toBe(false);
  expect(await screen.findByRole("alert")).toHaveTextContent("erneut mit Google");
  expect(screen.getByRole("button", { name: "Erneut mit Google bestätigen" })).toBeEnabled();
});

it("retains password confirmation for email-only accounts", () => {
  render(<DeleteAccountForm {...props} google={false} />);
  expect(screen.getByLabelText(/Aktuelles Passwort/)).toBeRequired();
  expect(screen.getByRole("button", { name: "Konto endgültig löschen" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Mit Google bestätigen" })).not.toBeInTheDocument();
});

it("explains cancellation and offers a retry", () => {
  render(<DeleteAccountForm {...props} verificationError />);
  expect(screen.getByRole("alert")).toHaveTextContent("abgebrochen oder ist abgelaufen");
  expect(screen.getByRole("button", { name: "Mit Google bestätigen" })).toBeEnabled();
});
