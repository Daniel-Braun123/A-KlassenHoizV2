import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";

vi.mock("@/features/notifications/actions", () => ({
  registerPushSubscriptionAction: vi.fn(),
  removePushSubscriptionAction: vi.fn(),
  sendTestPushNotificationAction: vi.fn(),
  setMissingTipsPreferenceAction: vi.fn(),
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
      <PushNotificationSettings
        initialMissingTipsEnabled
        publicVapidKey="BEl6G4vapidPublicKeyFixture123456789012345678901234567890"
      />,
    );

    expect(await screen.findByText("Aktiv")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /An offene Tipps erinnern/i })).toBeChecked();
    expect(screen.getByRole("button", { name: "Test senden" })).toBeInTheDocument();
  });

  it("does not prompt when push is not configured", async () => {
    render(<PushNotificationSettings initialMissingTipsEnabled={false} publicVapidKey={null} />);
    expect(
      await screen.findByText(/unterstützt Push-Benachrichtigungen hier nicht/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Benachrichtigungen aktivieren" }),
    ).not.toBeInTheDocument();
  });
});
