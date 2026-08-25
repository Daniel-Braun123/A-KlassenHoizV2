"use client";

import { useEffect } from "react";

import {
  isPwaInstalled,
  rememberInstallPrompt,
  saveInstallPromptDecision,
  type InstallPromptEvent,
} from "@/features/pwa/install-client";

export function InstallEventCapture() {
  useEffect(() => {
    if (isPwaInstalled()) {
      saveInstallPromptDecision("installed");
      return;
    }

    const remember = (event: Event) => {
      event.preventDefault();
      rememberInstallPrompt(event as InstallPromptEvent);
    };
    const finish = () => {
      rememberInstallPrompt(null);
      saveInstallPromptDecision("installed");
    };

    window.addEventListener("beforeinstallprompt", remember);
    window.addEventListener("appinstalled", finish);
    return () => {
      window.removeEventListener("beforeinstallprompt", remember);
      window.removeEventListener("appinstalled", finish);
    };
  }, []);

  return null;
}
