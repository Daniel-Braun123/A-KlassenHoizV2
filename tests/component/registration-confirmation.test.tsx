import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  resend: vi.fn(),
  destination: vi.fn(),
  replace: vi.fn(),
  google: vi.fn(),
}));
vi.mock("@/features/auth/actions", () => ({
  registerAction: mocks.register,
  resendRegistrationAction: mocks.resend,
  registrationDestinationAction: mocks.destination,
  startGoogleSignInAction: mocks.google,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
import { RegisterForm } from "@/components/auth/register-form";
import {
  RegistrationConfirmation,
  ConfirmationLinkRecovery,
} from "@/components/auth/registration-confirmation";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.destination.mockResolvedValue(null);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const props = {
  email: "friend@example.test",
  message:
    "Wenn für diese E-Mail-Adresse noch kein Konto besteht, erhältst du gleich einen Bestätigungslink.",
  next: "/invite/friends",
  onCorrectEmail: vi.fn(),
};

it("makes the next step, email and mail providers visible and focuses the instruction", () => {
  render(<RegistrationConfirmation {...props} />);
  expect(screen.getByRole("heading", { name: "Prüfe dein Postfach" })).toHaveFocus();
  expect(screen.getByText(props.email)).toBeVisible();
  expect(screen.getByRole("link", { name: "Gmail öffnen" })).toHaveAttribute(
    "href",
    "https://mail.google.com/mail/u/0/#inbox",
  );
  expect(screen.getByRole("link", { name: "Outlook öffnen" })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("button", { name: "E-Mail erneut senden" })).toBeDisabled();
  expect(screen.queryByRole("link", { name: "Passwort zurücksetzen" })).not.toBeInTheDocument();
});

it("enables resend after the cooldown and resends with the invitation destination", async () => {
  vi.useFakeTimers();
  render(<RegistrationConfirmation {...props} />);
  await act(async () => {
    vi.advanceTimersByTime(60_000);
  });
  expect(screen.getByRole("button", { name: "E-Mail erneut senden" })).toBeEnabled();
  vi.useRealTimers();
  mocks.resend.mockResolvedValue({ status: "success", message: "Neuer Link angefordert." });
  fireEvent.click(screen.getByRole("button", { name: "E-Mail erneut senden" }));
  await waitFor(() => expect(mocks.resend).toHaveBeenCalledOnce());
  const form = mocks.resend.mock.calls[0]![1] as FormData;
  expect(form.get("email")).toBe(props.email);
  expect(form.get("next")).toBe(props.next);
  await screen.findByText("Neuer Link angefordert.");
  expect(screen.getByRole("button", { name: "E-Mail erneut senden" })).toBeDisabled();
});

it("resumes the original tab only after a verified matching session is available", async () => {
  render(<RegistrationConfirmation {...props} />);
  fireEvent.focus(window);
  await waitFor(() => expect(mocks.destination).toHaveBeenCalledOnce());
  expect(mocks.replace).not.toHaveBeenCalled();
  mocks.destination.mockResolvedValue("/invite/friends");
  fireEvent.focus(window);
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/invite/friends"));
});

it("lets the user correct the email without retaining their password or losing the invitation", async () => {
  mocks.register.mockResolvedValue({
    status: "success",
    email: props.email,
    displayName: "Freund",
    message: props.message,
  });
  const { container } = render(<RegisterForm next={props.next} />);
  fireEvent.change(screen.getByLabelText(/Anzeigename/), { target: { value: "Freund" } });
  fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/), { target: { value: props.email } });
  fireEvent.change(container.querySelector('input[name="password"]')!, {
    target: { value: "SecretPassword42!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Konto erstellen" }));
  await screen.findByRole("heading", { name: "Bestätige deine E-Mail-Adresse" });
  fireEvent.click(screen.getByRole("button", { name: "E-Mail-Adresse korrigieren" }));
  expect(screen.getByRole("textbox", { name: "E-Mail-Adresse" })).toHaveValue(props.email);
  expect(screen.getByRole("textbox", { name: "E-Mail-Adresse" })).toHaveFocus();
  expect(screen.getByLabelText(/Anzeigename/)).toHaveValue("Freund");
  expect(container.querySelector('input[name="password"]')).toHaveValue("");
  expect(container.querySelector('input[name="next"]')).toHaveValue(props.next);
});

it("requests a replacement for an expired link without asking for a password", async () => {
  mocks.resend.mockResolvedValue({ status: "success", message: "Neuer Link angefordert." });
  render(<ConfirmationLinkRecovery next={props.next} />);
  fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/), { target: { value: props.email } });
  fireEvent.click(screen.getByRole("button", { name: "Neuen Bestätigungslink anfordern" }));
  await screen.findByRole("status");
  expect(mocks.resend.mock.calls[0]![1].get("next")).toBe(props.next);
  expect(screen.getByRole("link", { name: "Gmail öffnen" })).toBeVisible();
});
