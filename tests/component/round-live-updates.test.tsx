import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RoundLiveUpdates } from "@/components/realtime/round-live-updates";

const mocks = vi.hoisted(() => {
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return {
    channel,
    channelFactory: vi.fn(() => channel),
    refresh: vi.fn(),
    removeChannel: vi.fn().mockResolvedValue(undefined),
    requestBadgeRefresh: vi.fn(),
    setAuth: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    channel: mocks.channelFactory,
    realtime: { setAuth: mocks.setAuth },
    removeChannel: mocks.removeChannel,
  }),
}));

vi.mock("@/features/notifications/browser-client", () => ({
  requestOpenTipBadgeRefresh: mocks.requestBadgeRefresh,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  mocks.channel.on.mockReturnValue(mocks.channel);
  mocks.channel.subscribe.mockReturnValue(mocks.channel);
  mocks.setAuth.mockResolvedValue(undefined);
});

describe("RoundLiveUpdates", () => {
  it("abonniert ausschließlich den privaten Kanal der aktuellen Runde", async () => {
    render(<RoundLiveUpdates roundId="20000000-0000-4000-8000-000000000001" />);

    await waitFor(() => expect(mocks.setAuth).toHaveBeenCalledTimes(1));
    expect(mocks.channelFactory).toHaveBeenCalledWith(
      "round:20000000-0000-4000-8000-000000000001",
      { config: { private: true } },
    );
    expect(mocks.channel.on).toHaveBeenCalledWith(
      "broadcast",
      { event: "result_changed" },
      expect.any(Function),
    );
  });

  it("bündelt Ergebnisereignisse und aktualisiert Daten sowie Badge", async () => {
    vi.useFakeTimers();
    render(<RoundLiveUpdates roundId="20000000-0000-4000-8000-000000000001" />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const listener = mocks.channel.on.mock.calls[0]?.[2] as (() => void) | undefined;

    act(() => {
      listener?.();
      listener?.();
      vi.advanceTimersByTime(300);
    });

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.requestBadgeRefresh).toHaveBeenCalledTimes(1);
  });
});
