"use client";

import { useEffect, useState, type ComponentType } from "react";

export function AppUpdateLoader() {
  const [Notice, setNotice] = useState<ComponentType | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import("./app-update-notice").then((module) => setNotice(() => module.AppUpdateNotice));
    }, 2_500);
    return () => window.clearTimeout(timer);
  }, []);
  return Notice ? <Notice /> : null;
}
