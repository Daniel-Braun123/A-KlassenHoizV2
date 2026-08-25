"use client";

import { useEffect, useRef } from "react";

import { getOpenTipBadgeCountAction } from "@/features/notifications/actions";
import {
  OPEN_TIP_BADGE_REFRESH_EVENT,
  setOpenTipAppBadge,
} from "@/features/notifications/browser-client";

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (callback: () => void) => number;
};

export function AppBadgeSync() {
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const sync = (): Promise<void> => {
      if (inFlight.current) return inFlight.current;
      const request = getOpenTipBadgeCountAction()
        .then(async (result) => {
          if (result.ok) await setOpenTipAppBadge(result.data.count);
        })
        .catch(() => undefined)
        .finally(() => {
          if (inFlight.current === request) inFlight.current = null;
        });
      inFlight.current = request;
      return request;
    };

    const handleRefresh = () => void sync();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const idleWindow = window as IdleWindow;
    const usesIdleCallback = typeof idleWindow.requestIdleCallback === "function";
    const idleHandle = usesIdleCallback
      ? idleWindow.requestIdleCallback(handleRefresh)
      : window.setTimeout(handleRefresh, 0);

    window.addEventListener(OPEN_TIP_BADGE_REFRESH_EVENT, handleRefresh);
    window.addEventListener("pageshow", handleRefresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (usesIdleCallback && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
      window.removeEventListener(OPEN_TIP_BADGE_REFRESH_EVENT, handleRefresh);
      window.removeEventListener("pageshow", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
