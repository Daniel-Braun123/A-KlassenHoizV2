"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export function InstallApp() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const before = (value: Event) => {
      value.preventDefault();
      setEvent(value as InstallEvent);
    };
    const complete = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", complete);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
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
