"use client";

import type { Route } from "next";
import { useEffect, useId, useRef, useState } from "react";

import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { applyTheme, readThemePreference, type ThemePreference } from "@/lib/ui/theme";

const themeOptions = [
  { value: "system", label: "System", icon: "system" },
  { value: "light", label: "Hell", icon: "sun" },
  { value: "dark", label: "Dunkel", icon: "moon" },
] as const;

export function ProfileMenu({
  accountEnabled,
  accountLabel,
  displayName,
}: Readonly<{ accountEnabled: boolean; accountLabel: string; displayName: string }>) {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof document === "undefined") return "system";
    return readThemePreference();
  });
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    if (!open) return;
    surfaceRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      className="profile-menu"
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && !rootRef.current?.contains(nextTarget)) setOpen(false);
      }}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Profilmenü schließen" : "Profilmenü öffnen"}
        className="profile-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <Icon className="icon" name="user" />
      </button>
      {open ? (
        <section
          aria-label="Profil und Darstellung"
          className="profile-menu__surface"
          id={menuId}
          ref={surfaceRef}
          role="dialog"
        >
          <div className="profile-menu__identity">
            <span aria-hidden="true" className="profile-menu__avatar">
              <Icon className="icon" name="user" />
            </span>
            <span>
              <strong>{displayName}</strong>
              <small>{accountLabel}</small>
            </span>
          </div>

          <fieldset className="theme-picker">
            <legend>Darstellung</legend>
            <div className="theme-picker__options">
              {themeOptions.map((option) => (
                <button
                  aria-pressed={preference === option.value}
                  className="theme-picker__option"
                  key={option.value}
                  onClick={() => setPreference(option.value)}
                  type="button"
                >
                  <Icon className="icon" name={option.icon} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="profile-menu__actions">
            {accountEnabled ? (
              <Link
                className="profile-menu__action"
                href={"/profile" as Route}
                onClick={() => setOpen(false)}
              >
                <Icon className="icon" name="account" />
                <span>Konto & Datenschutz</span>
                <Icon className="icon profile-menu__chevron" name="chevron-right" />
              </Link>
            ) : null}
            <form action={signOutAction}>
              <Button
                className="profile-menu__action profile-menu__logout"
                type="submit"
                variant="ghost"
              >
                <Icon className="icon" name="logout" />
                <span>Abmelden</span>
              </Button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
