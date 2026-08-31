import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushAwareSignOut } from "@/components/notifications/push-aware-sign-out";
import { signOutAction } from "@/features/auth/actions";
import { removePushSubscriptionAction } from "@/features/notifications/actions";

vi.mock("@/features/auth/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/features/notifications/actions", () => ({ removePushSubscriptionAction: vi.fn() }));
vi.mock("@/features/notifications/browser-client", () => ({
  clearOpenTipAppBadge: vi.fn(),
  clearPushSubscriptionSync: (userId: string) =>
    window.sessionStorage.removeItem(`ak-push-subscription-sync:v1:${userId}`),
}));

describe("PushAwareSignOut", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("detaches the account but keeps the browser subscription for the next login", async () => {
    const subscription = {
      endpoint: "https://push.test/device",
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
        }),
      },
    });
    window.sessionStorage.setItem("ak-push-subscription-sync:v1:user-1", "synced");
    vi.mocked(removePushSubscriptionAction).mockResolvedValue({
      ok: true,
      data: { message: "Benachrichtigungen sind auf diesem Gerät deaktiviert.", removed: true },
    });

    render(<PushAwareSignOut userId="user-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));

    await waitFor(() => expect(signOutAction).toHaveBeenCalledOnce());
    expect(removePushSubscriptionAction).toHaveBeenCalledWith(subscription.endpoint);
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("ak-push-subscription-sync:v1:user-1")).toBeNull();
  });

  it("unsubscribes locally when the server cannot detach the account", async () => {
    const subscription = {
      endpoint: "https://push.test/device",
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
        }),
      },
    });
    vi.mocked(removePushSubscriptionAction).mockResolvedValue({
      ok: false,
      error: { code: "UNAVAILABLE", message: "Push notification operation failed" },
    });

    render(<PushAwareSignOut userId="user-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));

    await waitFor(() => expect(signOutAction).toHaveBeenCalledOnce());
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });
});
