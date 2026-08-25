import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentPushSubscription } from "@/features/notifications/browser-client";

describe("getCurrentPushSubscription", () => {
  afterEach(() => vi.restoreAllMocks());

  it("registers the service worker before inspecting push when startup registration has not run yet", async () => {
    const subscription = { endpoint: "https://push.test/device" } as PushSubscription;
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(subscription),
      },
    } as unknown as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        register,
      },
    });

    await expect(getCurrentPushSubscription()).resolves.toBe(subscription);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
  });
});
