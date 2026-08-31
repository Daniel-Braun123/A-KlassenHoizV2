"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { signOutAction } from "@/features/auth/actions";
import { removePushSubscriptionAction } from "@/features/notifications/actions";
import {
  clearOpenTipAppBadge,
  clearPushSubscriptionSync,
} from "@/features/notifications/browser-client";

export function PushAwareSignOut({ userId }: Readonly<{ userId: string | null }>) {
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          try {
            const result = await removePushSubscriptionAction(subscription.endpoint);
            if (!result.ok || result.data.removed !== true) await subscription.unsubscribe();
          } catch {
            await subscription.unsubscribe();
          }
        }
      }
    } finally {
      if (userId) clearPushSubscriptionSync(userId);
      await clearOpenTipAppBadge();
      await signOutAction();
    }
  };

  return (
    <Button
      className="profile-menu__action profile-menu__logout"
      disabled={pending}
      onClick={() => void signOut()}
      type="button"
      variant="ghost"
    >
      <Icon className="icon" name="logout" />
      <span>{pending ? "Wird abgemeldet …" : "Abmelden"}</span>
    </Button>
  );
}
