"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  isPwaInstalled,
  readInstallPrompt,
  subscribeToInstallPrompt,
  type InstallPromptEvent,
} from "@/features/pwa/install-client";
export function InstallApp() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const update = () => {
      setEvent(readInstallPrompt());
      if (isPwaInstalled()) setInstalled(true);
    };
    const complete = () => setInstalled(true);
    update();
    const unsubscribe = subscribeToInstallPrompt(update);
    window.addEventListener("appinstalled", complete);
    return () => {
      unsubscribe();
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  if (installed) return <p role="status">A-KlassenHoiz ist installiert.</p>;
  return (
    <section className="install-app">
      <h2>App installieren</h2>
      {event ? (
        <Button onClick={() => void event.prompt()}>Auf diesem Gerät installieren</Button>
      ) : (
        <p>
          Auf iPhone oder iPad: Teilen → „Zum Home-Bildschirm“. Auf Android und Desktop: im
          Browsermenü „App installieren“ wählen.
        </p>
      )}
    </section>
  );
}
