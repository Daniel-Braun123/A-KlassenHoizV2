"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { signOutAction } from "@/features/auth/actions";
import { removePushSubscriptionAction } from "@/features/notifications/actions";

export function PushAwareSignOut() {
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          try {
            await removePushSubscriptionAction(subscription.endpoint);
          } finally {
            await subscription.unsubscribe();
          }
        }
      }
    } finally {
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
