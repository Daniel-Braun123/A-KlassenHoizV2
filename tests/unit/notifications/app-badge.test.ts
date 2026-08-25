import { afterEach, describe, expect, it, vi } from "vitest";

import { clearOpenTipAppBadge, setOpenTipAppBadge } from "@/features/notifications/browser-client";

const originalSetAppBadge = navigator.setAppBadge;
const originalClearAppBadge = navigator.clearAppBadge;

afterEach(() => {
  Object.defineProperty(navigator, "setAppBadge", {
    configurable: true,
    value: originalSetAppBadge,
  });
  Object.defineProperty(navigator, "clearAppBadge", {
    configurable: true,
    value: originalClearAppBadge,
  });
});

describe("App-Badge", () => {
  it("setzt eine ganzzahlige Anzahl offener Tipps", async () => {
    const setAppBadge = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "setAppBadge", { configurable: true, value: setAppBadge });

    await setOpenTipAppBadge(3.8);

    expect(setAppBadge).toHaveBeenCalledWith(3);
  });

  it("leert den Badge, sobald kein offener Tipp mehr vorhanden ist", async () => {
    const clearAppBadge = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clearAppBadge", {
      configurable: true,
      value: clearAppBadge,
    });

    await setOpenTipAppBadge(0);
    await clearOpenTipAppBadge();

    expect(clearAppBadge).toHaveBeenCalledTimes(2);
  });

  it("beeinträchtigt die App nicht, wenn das Betriebssystem den Badge ablehnt", async () => {
    Object.defineProperty(navigator, "setAppBadge", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("Not allowed")),
    });

    await expect(setOpenTipAppBadge(2)).resolves.toBeUndefined();
  });
});
