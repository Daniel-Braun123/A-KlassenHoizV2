import type { Route } from "next";
import { redirect } from "next/navigation";

import { Link } from "@/components/ui/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims.sub) redirect("/start" as Route);

  return (
    <div className="launch-shell">
      <section className="launch-copy" aria-labelledby="launch-title">
        <p className="product-mark">A-KlassenHoiz</p>
        <h1 id="launch-title">Deine private Tipprunde mit Freunden.</h1>
        <p className="launch-copy__description">
          Runde erstellen, Freunde einladen und Spieltag für Spieltag gemeinsam tippen.
        </p>
        <div className="launch-actions">
          <Link href={"/login" as Route} variant="button">
            Anmelden
          </Link>
          <Link href={"/register" as Route}>Konto erstellen</Link>
        </div>
        <p className="launch-footnote">Privat, kostenlos und ohne E-Mail-Bestätigung.</p>
      </section>
    </div>
  );
}
