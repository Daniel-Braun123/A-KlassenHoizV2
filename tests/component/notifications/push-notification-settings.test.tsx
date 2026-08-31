import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";
import { removePushSubscriptionAction } from "@/features/notifications/actions";

vi.mock("@/features/notifications/actions", () => ({
  registerPushSubscriptionAction: vi.fn(),
  removePushSubscriptionAction: vi.fn(),
  sendTestPushNotificationAction: vi.fn(),
}));

describe("PushNotificationSettings", () => {
  afterEach(cleanup);

  beforeEach(() => {
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: class Notification {
        static permission = "granted";
        static requestPermission = vi.fn().mockResolvedValue("granted");
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    });
  });

  it("shows the active device preference and test action", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue({ endpoint: "https://push.test" }),
          },
        }),
      },
    });

    render(
      <PushNotificationSettings publicVapidKey="BEl6G4vapidPublicKeyFixture123456789012345678901234567890" />,
    );

    expect(await screen.findByText("Aktiv")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getByText(/neuen und vollständig ausgewerteten Spieltagen/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test senden" })).toBeInTheDocument();
  });

  it("requires a second confirmation before disabling notifications on this device", async () => {
    const subscription = {
      endpoint: "https://push.test/device",
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(subscription),
          },
        }),
      },
    });
    vi.mocked(removePushSubscriptionAction).mockResolvedValue({
      ok: true,
      data: { message: "Benachrichtigungen sind auf diesem Gerät deaktiviert.", removed: true },
    });

    render(
      <PushNotificationSettings publicVapidKey="BEl6G4vapidPublicKeyFixture123456789012345678901234567890" />,
    );

    expect(await screen.findByText("Aktiv")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Auf diesem Gerät deaktivieren" }));

    expect(screen.getByRole("heading", { name: "Benachrichtigungen deaktivieren?" })).toBeVisible();
    expect(removePushSubscriptionAction).not.toHaveBeenCalled();
    expect(subscription.unsubscribe).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(removePushSubscriptionAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Auf diesem Gerät deaktivieren" }));
    fireEvent.click(screen.getByRole("button", { name: "Jetzt deaktivieren" }));

    await waitFor(() =>
      expect(removePushSubscriptionAction).toHaveBeenCalledWith(subscription.endpoint),
    );
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(await screen.findByText("Inaktiv")).toBeInTheDocument();
  });

  it("checks the device subscription again when the installed app returns to the foreground", async () => {
    const getSubscription = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ endpoint: "https://push.test/device" });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({ pushManager: { getSubscription } }),
      },
    });

    render(
      <PushNotificationSettings publicVapidKey="BEl6G4vapidPublicKeyFixture123456789012345678901234567890" />,
    );

    await waitFor(() => expect(getSubscription).toHaveBeenCalledOnce());
    window.dispatchEvent(new Event("pageshow"));

    expect(await screen.findByText("Aktiv")).toBeInTheDocument();
    expect(getSubscription).toHaveBeenCalledTimes(2);
  });

  it("does not prompt when push is not configured", async () => {
    render(<PushNotificationSettings publicVapidKey={null} />);
    expect(
      await screen.findByText(/unterstützt Push-Benachrichtigungen hier nicht/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Benachrichtigungen aktivieren" }),
    ).not.toBeInTheDocument();
  });
});
