import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushSubscriptionSync } from "@/components/notifications/push-subscription-sync";
import { registerPushSubscriptionAction } from "@/features/notifications/actions";

vi.mock("@/features/notifications/actions", () => ({ registerPushSubscriptionAction: vi.fn() }));

const subscription = {
  endpoint: "https://push.test/device",
  getKey: vi.fn(
    (name: PushEncryptionKeyName) =>
      new Uint8Array(name === "auth" ? [1, 2, 3, 4, 5, 6, 7, 8] : Array(16).fill(4)).buffer,
  ),
} as unknown as PushSubscription;

function installPushBrowser(currentSubscription: PushSubscription | null) {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(window, "PushManager", {
    configurable: true,
    value: class PushManager {},
  });
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: class Notification {
      static permission = "granted";
    },
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue({
        pushManager: { getSubscription: vi.fn().mockResolvedValue(currentSubscription) },
      }),
    },
  });
}

describe("PushSubscriptionSync", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("reconnects an existing browser subscription to the signed-in account", async () => {
    installPushBrowser(subscription);
    vi.mocked(registerPushSubscriptionAction).mockResolvedValue({
      ok: true,
      data: { message: "Benachrichtigungen sind auf diesem Gerät aktiv." },
    });

    const { container } = render(<PushSubscriptionSync userId="user-1" />);

    await waitFor(() => expect(registerPushSubscriptionAction).toHaveBeenCalledOnce());
    expect(registerPushSubscriptionAction).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: subscription.endpoint }),
    );
    expect(window.sessionStorage.getItem("ak-push-subscription-sync:v1:user-1")).toBe("synced");
    expect(container).toBeEmptyDOMElement();
  });

  it("does not recreate a subscription that the user explicitly disabled", async () => {
    installPushBrowser(null);

    render(<PushSubscriptionSync userId="user-1" />);

    await waitFor(() => expect(registerPushSubscriptionAction).not.toHaveBeenCalled());
  });

  it("avoids duplicate registration within the same browser session", async () => {
    installPushBrowser(subscription);
    window.sessionStorage.setItem("ak-push-subscription-sync:v1:user-1", "synced");

    render(<PushSubscriptionSync userId="user-1" />);

    await waitFor(() => expect(registerPushSubscriptionAction).not.toHaveBeenCalled());
  });
});
