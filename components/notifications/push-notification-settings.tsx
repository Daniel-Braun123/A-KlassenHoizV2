"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ActionMessage, type ActionFeedbackState } from "@/components/ui/action-message";
import {
  registerPushSubscriptionAction,
  removePushSubscriptionAction,
  sendTestPushNotificationAction,
} from "@/features/notifications/actions";
import {
  getCurrentPushSubscription,
  getPushBrowserStatus,
  pushSubscriptionInput,
  subscribeBrowserToPush,
} from "@/features/notifications/browser-client";

type BrowserStatus = "checking" | "available" | "install-required" | "unsupported";

export function PushNotificationSettings({
  publicVapidKey,
}: Readonly<{
  publicVapidKey: string | null;
}>) {
  const [status, setStatus] = useState<BrowserStatus>("checking");
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedbackState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    const inspectBrowser = async () => {
      await Promise.resolve();
      if (cancelled) return;
      const nextStatus = publicVapidKey ? getPushBrowserStatus() : "unsupported";
      setStatus(nextStatus);
      if (nextStatus !== "available") return;
      const nextPermission = Notification.permission;
      setPermission(nextPermission);
      try {
        const subscription = await getCurrentPushSubscription();
        if (!cancelled) setActive(nextPermission === "granted" && Boolean(subscription));
      } catch {
        if (!cancelled) setActive(false);
      }
    };

    const inspectWhenVisible = () => {
      if (document.visibilityState === "visible") void inspectBrowser();
    };

    void inspectBrowser();
    window.addEventListener("pageshow", inspectBrowser);
    document.addEventListener("visibilitychange", inspectWhenVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", inspectBrowser);
      document.removeEventListener("visibilitychange", inspectWhenVisible);
    };
  }, [publicVapidKey]);

  const enable = async () => {
    if (!publicVapidKey) return;
    setBusy(true);
    setFeedback({ status: "idle" });
    let subscription: PushSubscription | null = null;
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== "granted") {
        setFeedback({
          status: "error",
          message: "Benachrichtigungen wurden im Browser nicht erlaubt.",
        });
        return;
      }
      subscription = await subscribeBrowserToPush(publicVapidKey);
      const result = await registerPushSubscriptionAction(pushSubscriptionInput(subscription));
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
    setDisableError(null);
    setFeedback({ status: "idle" });
    try {
      const subscription = await getCurrentPushSubscription();
      if (subscription) {
        const result = await removePushSubscriptionAction(subscription.endpoint);
        if (!result.ok) throw new Error(result.error.message);
        await subscription.unsubscribe();
        setFeedback({ status: "success", message: result.data.message });
      }
      setActive(false);
      setDisableDialogOpen(false);
    } catch (error) {
      setDisableError(
        error instanceof Error
          ? error.message
          : "Benachrichtigungen konnten nicht deaktiviert werden.",
      );
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setFeedback({ status: "idle" });
    const subscription = await getCurrentPushSubscription();
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
          <p>
            Du erhältst Erinnerungen an offene Tipps sowie Hinweise zu neuen und vollständig
            ausgewerteten Spieltagen.
          </p>
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

      {status === "available" && !active && permission === "denied" ? (
        <p className="push-settings__notice">
          Benachrichtigungen sind in den Geräte- oder Browser-Einstellungen blockiert. Erlaube sie
          dort und öffne diese Ansicht anschließend erneut.
        </p>
      ) : null}

      {status === "available" && !active && permission !== "denied" ? (
        <Button disabled={busy} onClick={() => void enable()}>
          {busy ? "Wird aktiviert …" : "Benachrichtigungen aktivieren"}
        </Button>
      ) : null}

      {status === "available" && active ? (
        <div className="push-settings__actions">
          <Button disabled={busy} onClick={() => void sendTest()} variant="secondary">
            Test senden
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setDisableError(null);
              setFeedback({ status: "idle" });
              setDisableDialogOpen(true);
            }}
            variant="ghost"
          >
            Auf diesem Gerät deaktivieren
          </Button>
        </div>
      ) : null}

      <ActionMessage state={feedback} />

      <Dialog
        description="Diese Änderung betrifft nur die aktuell verwendete App auf diesem Gerät."
        onClose={() => {
          if (!busy) setDisableDialogOpen(false);
        }}
        open={disableDialogOpen}
        title="Benachrichtigungen deaktivieren?"
      >
        <div className="push-settings__disable-confirmation">
          <p>
            Du erhältst hier danach weder Erinnerungen an offene Tipps noch Neuigkeiten zu
            Spieltagen. Auf anderen Geräten eingerichtete Benachrichtigungen bleiben aktiv.
          </p>
          {disableError ? (
            <p className="form-error" role="alert">
              {disableError}
            </p>
          ) : null}
          <div className="dialog-actions">
            <Button
              autoFocus
              disabled={busy}
              onClick={() => setDisableDialogOpen(false)}
              variant="secondary"
            >
              Abbrechen
            </Button>
            <Button disabled={busy} onClick={() => void disable()} variant="danger">
              {busy ? "Wird deaktiviert …" : "Jetzt deaktivieren"}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
