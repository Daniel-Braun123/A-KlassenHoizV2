"use client";

import { useEffect } from "react";

import {
  applyTheme,
  isThemePreference,
  readThemePreference,
  themeStorageKey,
} from "@/lib/ui/theme";

export function ThemeSync() {
  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      const preference = readThemePreference();
      if (preference === "system") applyTheme(preference, false);
    };
    const syncStoredTheme = (event: StorageEvent) => {
      if (event.key === themeStorageKey && isThemePreference(event.newValue)) {
        applyTheme(event.newValue, false);
      }
    };

    syncSystemTheme();
    colorScheme.addEventListener("change", syncSystemTheme);
    window.addEventListener("storage", syncStoredTheme);
    return () => {
      colorScheme.removeEventListener("change", syncSystemTheme);
      window.removeEventListener("storage", syncStoredTheme);
    };
  }, []);

  return null;
}
