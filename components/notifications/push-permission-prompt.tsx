"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ActionMessage, type ActionFeedbackState } from "@/components/ui/action-message";
import { registerPushSubscriptionAction } from "@/features/notifications/actions";
import {
  getCurrentPushSubscription,
  getPushBrowserStatus,
  pushSubscriptionInput,
  subscribeBrowserToPush,
} from "@/features/notifications/browser-client";

const PROMPT_DELAY_MS = 1_500;

function storageKey(userId: string): string {
  return `ak-push-permission-prompt:v1:${userId}`;
}

function readPromptDecision(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function savePromptDecision(key: string, decision: "dismissed" | "enabled"): void {
  try {
    window.localStorage.setItem(key, decision);
  } catch {
    // Storage can be unavailable in strict privacy modes. Push remains usable from the profile.
  }
}

export function PushPermissionPrompt({
  publicVapidKey,
  userId,
}: Readonly<{
  publicVapidKey: string;
  userId: string;
}>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedbackState>({ status: "idle" });
  const completedDecision = useRef<"dismissed" | "enabled" | null>(null);
  const key = storageKey(userId);

  useEffect(() => {
    let cancelled = false;

    const inspect = async () => {
      if (readPromptDecision(key) || getPushBrowserStatus() !== "available") return;
      if (Notification.permission === "denied") return;

      try {
        const subscription = await getCurrentPushSubscription();
        if (subscription) {
          savePromptDecision(key, "enabled");
          return;
        }
      } catch {
        return;
      }

      if (!cancelled) setOpen(true);
    };

    const timeoutId = setTimeout(() => void inspect(), PROMPT_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [key]);

  const dismiss = () => {
    const decision = completedDecision.current ?? "dismissed";
    completedDecision.current = decision;
    savePromptDecision(key, decision);
    setFeedback({ status: "idle" });
    setOpen(false);
  };

  const enable = async () => {
    setBusy(true);
    setFeedback({ status: "idle" });
    let subscription: PushSubscription | null = null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        completedDecision.current = "dismissed";
        savePromptDecision(key, "dismissed");
        setOpen(false);
        return;
      }

      subscription = await subscribeBrowserToPush(publicVapidKey);
      const result = await registerPushSubscriptionAction(pushSubscriptionInput(subscription));
      if (!result.ok) {
        await subscription.unsubscribe();
        throw new Error(result.error.message);
      }

      completedDecision.current = "enabled";
      savePromptDecision(key, "enabled");
      setOpen(false);
    } catch (error) {
      setFeedback({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Benachrichtigungen konnten nicht aktiviert werden.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      description="A-KlassenHoiz kann dich rechtzeitig benachrichtigen, wenn vor einem Anpfiff noch Tipps fehlen."
      onClose={dismiss}
      open={open}
      title="Keine Tippfrist mehr verpassen"
    >
      <div className="push-permission-prompt">
        <p>
          Du erhältst höchstens zwei Erinnerungen: 24 Stunden und 60 Minuten vor dem nächsten
          Anpfiff. Keine Werbung und keine Tippinhalte in der Nachricht.
        </p>
        <ActionMessage state={feedback} />
        <div className="dialog-actions">
          <Button disabled={busy} onClick={() => void enable()}>
            {busy ? "Wird aktiviert …" : "Benachrichtigungen aktivieren"}
          </Button>
          <Button disabled={busy} onClick={dismiss} variant="secondary">
            Später
          </Button>
        </div>
        <p className="push-permission-prompt__note">
          Du kannst Benachrichtigungen jederzeit in deinem Profil verwalten.
        </p>
      </div>
    </Dialog>
  );
}
