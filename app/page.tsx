import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";

import { HomepageContent } from "@/components/marketing/homepage-content";
import { HomepageSteps } from "@/components/marketing/homepage-steps";
import { HomepageStructuredData } from "@/components/seo/homepage-structured-data";
import { Link } from "@/components/ui/link";
import { getMyProfile } from "@/features/profile/service";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export default async function HomePage() {
  const profile = await getMyProfile();
  if (profile?.status === "active") redirect("/start" as Route);

  return (
    <div className="landing-page">
      <HomepageStructuredData />

      <section className="launch-shell" aria-labelledby="launch-title">
        <div className="launch-layout">
          <div className="launch-copy">
            <p className="product-mark">Tippen unter Freunden</p>
            <h1 id="launch-title">Das Fußball-Tippspiel für dich und deine Freunde</h1>
            <p className="launch-copy__description">
              Erstelle eine private Tipprunde, lade deine Freunde ein und tippt jedes Spiel bis zum
              Anpfiff – einfach, kostenlos und gemeinsam.
            </p>
            <div className="launch-actions">
              <Link href={"/register" as Route} variant="button">
                Kostenlose Tipprunde starten
              </Link>
              <Link href={"/login" as Route}>Schon dabei? Anmelden</Link>
            </div>
            <p className="launch-footnote">Privat, kostenlos und ohne E-Mail-Bestätigung.</p>
          </div>

          <HomepageSteps />
        </div>
      </section>

      <HomepageContent />
    </div>
  );
}
