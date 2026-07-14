import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/patterns/app-shell";
import { FocusBoundary } from "@/components/patterns/focus-boundary";
import { ProfileMenu } from "@/components/patterns/profile-menu";
import { ThemeSync } from "@/components/patterns/theme-sync";
import { getMyProfile } from "@/features/profile/service";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "A-KlassenHoiz",
    template: "%s · A-KlassenHoiz",
  },
  description: "Das private Tippspiel für lokale Fußballligen.",
  applicationName: "A-KlassenHoiz",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "oklch(0.982 0.007 155)",
};

const themeScript = `
  (() => {
    const key = "ak-theme:v1";
    let preference = "system";
    try {
      const stored = localStorage.getItem(key);
      if (stored === "light" || stored === "dark" || stored === "system") preference = stored;
    } catch {}
    const theme = preference === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "oklch(0.155 0.018 155)" : "oklch(0.982 0.007 155)"
    );
  })();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getMyProfile();
  const profileMenu = profile ? (
    <ProfileMenu
      accountEnabled={profile.status === "active"}
      accountLabel={
        profile.status === "active"
          ? profile.app_role === "app_admin"
            ? "Administratorkonto"
            : "Privates Konto"
          : profile.status === "deletion_pending"
            ? "Löschung ausstehend"
            : "Konto nicht aktiv"
      }
      displayName={profile.display_name?.trim() || "Dein Konto"}
    />
  ) : null;

  return (
    <html data-scroll-behavior="smooth" lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeSync />
        <AppShell utility={profileMenu}>
          <FocusBoundary>{children}</FocusBoundary>
        </AppShell>
        <script defer src="/pwa-register.js" />
      </body>
    </html>
  );
}
