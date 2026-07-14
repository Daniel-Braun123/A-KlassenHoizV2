import type { Route } from "next";
import { redirect } from "next/navigation";

import { Link } from "@/components/ui/link";
import { getMyProfile } from "@/features/profile/service";

export default async function HomePage() {
  const profile = await getMyProfile();
  if (profile?.status === "active") redirect("/start" as Route);

  return (
    <div className="launch-shell">
      <div className="launch-layout">
        <section className="launch-copy" aria-labelledby="launch-title">
          <p className="product-mark">Tippen unter Freunden</p>
          <h1 id="launch-title">Eure Liga. Eure Runde. Eure Tipps.</h1>
          <p className="launch-copy__description">
            Erstelle eine private Tipprunde, lade deine Freunde ein und tippt jedes Spiel bis zum
            Anpfiff.
          </p>
          <div className="launch-actions">
            <Link href={"/login" as Route} variant="button">
              Anmelden
            </Link>
            <Link href={"/register" as Route}>Kostenloses Konto erstellen</Link>
          </div>
          <p className="launch-footnote">Privat, kostenlos und ohne E-Mail-Bestätigung.</p>
        </section>
        <aside className="launch-steps" aria-label="So funktioniert A-KlassenHoiz">
          <h2>In drei Schritten dabei</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Runde erstellen</strong>
                <p>Wähle die passende Liga-Saison für eure Gruppe.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Freunde einladen</strong>
                <p>Teile einen privaten Link oder den QR-Code.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Gemeinsam tippen</strong>
                <p>Jeder Tipp bleibt bis zum jeweiligen Anpfiff änderbar.</p>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
