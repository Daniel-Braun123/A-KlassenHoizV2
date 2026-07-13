"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function AppUpdateNotice() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const refreshRequested = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onController = () => {
      if (refreshRequested.current) window.location.reload();
    };
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").then((value) => {
        if (value.waiting) setWaiting(value.waiting);
        value.addEventListener("updatefound", () => {
          const worker = value.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller)
              setWaiting(worker);
          });
        });
      });
    };
    register();
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };
  }, []);

  if (!waiting) return null;
  return (
    <aside className="app-update" role="status">
      <span>Eine neue Version ist bereit. Offene Eingaben zuerst speichern.</span>
      <Button
        variant="secondary"
        onClick={() => {
          refreshRequested.current = true;
          waiting.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        Jetzt neu laden
      </Button>
    </aside>
  );
}
