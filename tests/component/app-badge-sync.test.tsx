import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppBadgeSync } from "@/components/notifications/app-badge-sync";

const mocks = vi.hoisted(() => ({
  getCount: vi.fn(),
  setBadge: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/notifications/actions", () => ({
  getOpenTipBadgeCountAction: mocks.getCount,
}));

vi.mock("@/features/notifications/browser-client", () => ({
  OPEN_TIP_BADGE_REFRESH_EVENT: "aklassenhoiz:open-tip-badge-refresh",
  setOpenTipAppBadge: mocks.setBadge,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AppBadgeSync", () => {
  it("synchronisiert den offenen Tippzähler initial und nach einem Speicherereignis", async () => {
    mocks.getCount.mockResolvedValue({ ok: true, data: { count: 5 } });
    render(<AppBadgeSync />);

    await waitFor(() => expect(mocks.setBadge).toHaveBeenCalledWith(5));

    mocks.getCount.mockResolvedValue({ ok: true, data: { count: 0 } });
    window.dispatchEvent(new Event("aklassenhoiz:open-tip-badge-refresh"));

    await waitFor(() => expect(mocks.setBadge).toHaveBeenLastCalledWith(0));
  });
});
