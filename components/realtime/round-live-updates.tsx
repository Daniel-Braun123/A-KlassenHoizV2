"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { requestOpenTipBadgeRefresh } from "@/features/notifications/browser-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const REFRESH_DELAY_MS = 250;

export function RoundLiveUpdates({ roundId }: Readonly<{ roundId: string }>) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const scheduleRefresh = () => {
      if (!active || refreshTimer.current !== null) return;
      refreshTimer.current = window.setTimeout(() => {
        refreshTimer.current = null;
        requestOpenTipBadgeRefresh();
        startTransition(() => router.refresh());
      }, REFRESH_DELAY_MS);
    };

    void supabase.realtime
      .setAuth()
      .then(() => {
        if (!active) return;
        channel = supabase
          .channel(`round:${roundId}`, { config: { private: true } })
          .on("broadcast", { event: "result_changed" }, scheduleRefresh)
          .subscribe();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roundId, router]);

  return null;
}
