import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/patterns/app-shell";
import { FocusBoundary } from "@/components/patterns/focus-boundary";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(1 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.14 0.01 160)" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="de">
      <body>
        <AppShell>
          <FocusBoundary>{children}</FocusBoundary>
        </AppShell>
        <script defer src="/pwa-register.js" />
      </body>
    </html>
  );
}
