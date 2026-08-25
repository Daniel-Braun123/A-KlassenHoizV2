"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  isIosDevice,
  isPwaInstalled,
  readInstallPrompt,
  readInstallPromptDecision,
  rememberInstallPrompt,
  saveInstallPromptDecision,
  subscribeToInstallPrompt,
  type InstallPromptEvent,
} from "@/features/pwa/install-client";

export function ContextualInstallPrompt({ trigger }: Readonly<{ trigger: number }>) {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const ios = isIosDevice();
  const installed = isPwaInstalled();
  const decided = readInstallPromptDecision();
  const open = trigger > 0 && !closed && !installed && !decided && (ios || Boolean(installEvent));

  useEffect(() => {
    if (isPwaInstalled()) {
      saveInstallPromptDecision("installed");
      return;
    }

    const update = () => setInstallEvent(readInstallPrompt());
    const remember = (event: Event) => {
      event.preventDefault();
      rememberInstallPrompt(event as InstallPromptEvent);
    };
    update();
    const unsubscribe = subscribeToInstallPrompt(update);
    window.addEventListener("beforeinstallprompt", remember);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeinstallprompt", remember);
    };
  }, []);

  function dismiss(): void {
    saveInstallPromptDecision("dismissed");
    setClosed(true);
  }

  async function install(): Promise<void> {
    if (!installEvent) return;

    setBusy(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      saveInstallPromptDecision(choice.outcome === "accepted" ? "installed" : "dismissed");
      rememberInstallPrompt(null);
      setInstallEvent(null);
      setClosed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog
      description="Öffne deine Tipprunde künftig direkt vom Home-Bildschirm."
      onClose={dismiss}
      open={open}
      title="A-KlassenHoiz installieren"
    >
      <div className="pwa-install-prompt">
        <div className="pwa-install-prompt__intro">
          <Image
            alt=""
            className="pwa-install-prompt__icon"
            height={56}
            src="/icons/icon-192.png"
            width={56}
          />
          <div>
            <strong>Schneller zurück zu deinen Tipps</strong>
            <p>Direkter Zugriff wie bei einer App – ohne App Store.</p>
          </div>
        </div>

        {ios ? (
          <ol className="pwa-install-prompt__steps">
            <li>
              <span aria-hidden="true" className="pwa-install-prompt__step-number">
                1
              </span>
              <span>
                Im Browser unten auf <strong>Teilen</strong> tippen.
              </span>
            </li>
            <li>
              <span aria-hidden="true" className="pwa-install-prompt__step-number">
                2
              </span>
              <span>
                <strong>Zum Home-Bildschirm</strong> auswählen.
              </span>
            </li>
          </ol>
        ) : null}

        <div className="dialog-actions">
          {ios ? (
            <Button onClick={dismiss}>Verstanden</Button>
          ) : (
            <Button disabled={busy} onClick={() => void install()}>
              {busy ? "Installation wird geöffnet …" : "App installieren"}
            </Button>
          )}
          {!ios ? (
            <Button disabled={busy} onClick={dismiss} variant="secondary">
              Nicht jetzt
            </Button>
          ) : null}
        </div>
        <p className="pwa-install-prompt__note">
          Du kannst A-KlassenHoiz später jederzeit über dein Profil installieren.
        </p>
      </div>
    </Dialog>
  );
}
