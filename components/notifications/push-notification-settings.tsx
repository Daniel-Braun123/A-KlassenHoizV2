"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ActionMessage, type ActionFeedbackState } from "@/components/ui/action-message";
import {
  registerPushSubscriptionAction,
  removePushSubscriptionAction,
  sendTestPushNotificationAction,
  setMissingTipsPreferenceAction,
} from "@/features/notifications/actions";

type BrowserStatus = "checking" | "available" | "install-required" | "unsupported";

function isIosDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function browserStatus(): BrowserStatus {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window) ||
    !window.isSecureContext
  ) {
    return "unsupported";
  }
  if (isIosDevice() && !isStandalone()) return "install-required";
  return "available";
}

function publicKeyBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
  return bytes.buffer;
}

function keyToBase64Url(value: ArrayBuffer | null): string | null {
  if (!value) return null;
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function subscriptionInput(subscription: PushSubscription) {
  const p256dhKey = keyToBase64Url(subscription.getKey("p256dh"));
  const authSecret = keyToBase64Url(subscription.getKey("auth"));
  if (!p256dhKey || !authSecret) throw new Error("Subscription keys unavailable");
  return {
    endpoint: subscription.endpoint,
    p256dhKey,
    authSecret,
    userAgent: navigator.userAgent,
  };
}

export function PushNotificationSettings({
  initialMissingTipsEnabled,
  publicVapidKey,
}: Readonly<{
  initialMissingTipsEnabled: boolean;
  publicVapidKey: string | null;
}>) {
  const [status, setStatus] = useState<BrowserStatus>("checking");
  const [active, setActive] = useState(false);
  const [missingTipsEnabled, setMissingTipsEnabled] = useState(initialMissingTipsEnabled);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedbackState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    const inspectBrowser = async () => {
      await Promise.resolve();
      if (cancelled) return;
      const nextStatus = publicVapidKey ? browserStatus() : "unsupported";
      setStatus(nextStatus);
      if (nextStatus !== "available") return;
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (!cancelled) setActive(Boolean(subscription));
      } catch {
        if (!cancelled) setActive(false);
      }
    };
    void inspectBrowser();
    return () => {
      cancelled = true;
    };
  }, [publicVapidKey]);

  const enable = async () => {
    if (!publicVapidKey) return;
    setBusy(true);
    setFeedback({ status: "idle" });
    let subscription: PushSubscription | null = null;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setFeedback({
          status: "error",
          message: "Benachrichtigungen wurden im Browser nicht erlaubt.",
        });
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKeyBuffer(publicVapidKey),
        }));
      const result = await registerPushSubscriptionAction(subscriptionInput(subscription));
      if (!result.ok) {
        await subscription.unsubscribe();
        throw new Error(result.error.message);
      }
      setActive(true);
      setFeedback({ status: "success", message: result.data.message });
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

  const disable = async () => {
    setBusy(true);
    setFeedback({ status: "idle" });
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const result = await removePushSubscriptionAction(subscription.endpoint);
        if (!result.ok) throw new Error(result.error.message);
        await subscription.unsubscribe();
        setFeedback({ status: "success", message: result.data.message });
      }
      setActive(false);
    } catch (error) {
      setFeedback({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Benachrichtigungen konnten nicht deaktiviert werden.",
      });
    } finally {
      setBusy(false);
    }
  };

  const updatePreference = async (enabled: boolean) => {
    const previous = missingTipsEnabled;
    setMissingTipsEnabled(enabled);
    setBusy(true);
    setFeedback({ status: "idle" });
    const result = await setMissingTipsPreferenceAction({ missingTipsEnabled: enabled });
    if (result.ok) {
      setFeedback({ status: "success", message: result.data.message });
    } else {
      setMissingTipsEnabled(previous);
      setFeedback({ status: "error", message: result.error.message });
    }
    setBusy(false);
  };

  const sendTest = async () => {
    setBusy(true);
    setFeedback({ status: "idle" });
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      setActive(false);
      setFeedback({ status: "error", message: "Auf diesem Gerät ist kein Push-Abo aktiv." });
      setBusy(false);
      return;
    }
    const result = await sendTestPushNotificationAction(subscription.endpoint);
    setFeedback(
      result.ok
        ? { status: "success", message: result.data.message }
        : { status: "error", message: result.error.message },
    );
    setBusy(false);
  };

  return (
    <section className="push-settings" aria-labelledby="push-settings-title">
      <div className="push-settings__heading">
        <div>
          <h2 id="push-settings-title">Benachrichtigungen</h2>
          <p>Erhalte auf diesem Gerät eine Erinnerung, wenn vor dem Anpfiff Tipps fehlen.</p>
        </div>
        <span className="push-settings__status" data-active={active ? "true" : undefined}>
          {status === "checking" ? "Wird geprüft" : active ? "Aktiv" : "Inaktiv"}
        </span>
      </div>

      {status === "unsupported" ? (
        <p className="push-settings__notice">
          Dieser Browser unterstützt Push-Benachrichtigungen hier nicht oder die Funktion ist noch
          nicht eingerichtet.
        </p>
      ) : null}
      {status === "install-required" ? (
        <p className="push-settings__notice">
          Auf iPhone und iPad funktionieren Push-Benachrichtigungen in der installierten App. Füge
          A-KlassenHoiz zuerst über „Teilen“ zum Home-Bildschirm hinzu.
        </p>
      ) : null}

      {status === "available" && !active ? (
        <Button disabled={busy} onClick={() => void enable()}>
          {busy ? "Wird aktiviert …" : "Benachrichtigungen aktivieren"}
        </Button>
      ) : null}

      {status === "available" && active ? (
        <div className="push-settings__controls">
          <label className="push-settings__preference">
            <span>
              <strong>An offene Tipps erinnern</strong>
              <small>Höchstens 24 Stunden und 60 Minuten vor dem nächsten Anpfiff.</small>
            </span>
            <input
              checked={missingTipsEnabled}
              disabled={busy}
              onChange={(event) => void updatePreference(event.target.checked)}
              role="switch"
              type="checkbox"
            />
          </label>
          <div className="push-settings__actions">
            <Button disabled={busy} onClick={() => void sendTest()} variant="secondary">
              Test senden
            </Button>
            <Button disabled={busy} onClick={() => void disable()} variant="ghost">
              Auf diesem Gerät deaktivieren
            </Button>
          </div>
        </div>
      ) : null}

      <ActionMessage state={feedback} />
      {active ? (
        <p className="push-settings__privacy">
          Es werden nur der offene Tippbedarf und der nächste Anpfiff übertragen – keine Namen,
          E-Mail-Adressen oder Tippinhalte.
        </p>
      ) : null}
    </section>
  );
}
