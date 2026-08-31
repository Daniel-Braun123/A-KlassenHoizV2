"use client";

import { useEffect, useRef } from "react";

import { registerPushSubscriptionAction } from "@/features/notifications/actions";
import {
  getCurrentPushSubscription,
  getPushBrowserStatus,
  markPushSubscriptionSynced,
  pushSubscriptionInput,
  wasPushSubscriptionSynced,
} from "@/features/notifications/browser-client";

export function PushSubscriptionSync({ userId }: Readonly<{ userId: string }>) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || wasPushSubscriptionSynced(userId)) return;
    if (getPushBrowserStatus() !== "available" || Notification.permission !== "granted") return;
    started.current = true;

    const reconnect = async () => {
      try {
        const subscription = await getCurrentPushSubscription();
        if (!subscription) return;
        const result = await registerPushSubscriptionAction(pushSubscriptionInput(subscription));
        if (result.ok) markPushSubscriptionSynced(userId);
      } catch {
        // A later authenticated app start can retry without interrupting the user.
      }
    };

    void reconnect();
  }, [userId]);

  return null;
}
