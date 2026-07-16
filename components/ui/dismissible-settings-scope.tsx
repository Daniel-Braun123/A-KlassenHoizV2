"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef } from "react";

const openSettingsSelector = "details[data-dismissible-settings][open]";

export function DismissibleSettingsScope({ children, ...props }: ComponentPropsWithoutRef<"div">) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function openSettings(): HTMLDetailsElement[] {
      return Array.from(
        scopeRef.current?.querySelectorAll<HTMLDetailsElement>(openSettingsSelector) ?? [],
      );
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;

      for (const details of openSettings()) {
        if (!details.contains(event.target)) details.open = false;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const opened = openSettings();
      if (!opened.length) return;

      event.preventDefault();
      const focusTarget = opened.at(-1)?.querySelector<HTMLElement>("summary");
      for (const details of opened) details.open = false;
      focusTarget?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={scopeRef} {...props}>
      {children}
    </div>
  );
}
