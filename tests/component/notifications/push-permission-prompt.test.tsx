import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushPermissionPrompt } from "@/components/notifications/push-permission-prompt";
import { registerPushSubscriptionAction } from "@/features/notifications/actions";

vi.mock("@/features/notifications/actions", () => ({
  registerPushSubscriptionAction: vi.fn(),
}));

const publicVapidKey = Buffer.from(Uint8Array.from([4, ...Array<number>(64).fill(1)])).toString(
  "base64url",
);

function setupBrowser(subscription: PushSubscription | null = null) {
  const getSubscription = vi.fn().mockResolvedValue(subscription);
  const subscribe = vi.fn().mockResolvedValue(subscription);
  const registration = { pushManager: { getSubscription, subscribe } };

  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(window, "PushManager", {
    configurable: true,
    value: class PushManager {},
  });
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: class Notification {
      static permission = "default";
      static requestPermission = vi.fn().mockResolvedValue("granted");
    },
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      register: vi.fn().mockResolvedValue(registration),
    },
  });

  return { getSubscription, subscribe };
}

describe("PushPermissionPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("explains the benefit once without opening native permission on page load", async () => {
    setupBrowser();

    render(<PushPermissionPrompt publicVapidKey={publicVapidKey} userId="user-1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1_500));

    expect(screen.getByRole("heading", { name: "Keine Tippfrist mehr verpassen" })).toBeVisible();
    expect(Notification.requestPermission).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Später" }));
    expect(window.localStorage.getItem("ak-push-permission-prompt:v1:user-1")).toBe("dismissed");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requests browser permission only after confirmation and stores the subscription", async () => {
    const subscription = {
      endpoint: "https://push.example/subscription",
      getKey: vi.fn(
        (name: PushEncryptionKeyName) =>
          new Uint8Array(name === "auth" ? [1, 2, 3] : [4, 5, 6]).buffer,
      ),
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    const browser = setupBrowser();
    browser.subscribe.mockResolvedValue(subscription);
    vi.mocked(registerPushSubscriptionAction).mockResolvedValue({
      ok: true,
      data: { message: "Benachrichtigungen sind aktiv." },
    });

    render(<PushPermissionPrompt publicVapidKey={publicVapidKey} userId="user-2" />);
    await act(() => vi.advanceTimersByTimeAsync(1_500));
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Benachrichtigungen aktivieren" }));

    await waitFor(() => expect(registerPushSubscriptionAction).toHaveBeenCalledOnce());
    expect(Notification.requestPermission).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem("ak-push-permission-prompt:v1:user-2")).toBe("enabled");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not appear again after a saved decision", async () => {
    setupBrowser();
    window.localStorage.setItem("ak-push-permission-prompt:v1:user-3", "dismissed");

    render(<PushPermissionPrompt publicVapidKey={publicVapidKey} userId="user-3" />);
    await act(() => vi.advanceTimersByTimeAsync(1_500));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
