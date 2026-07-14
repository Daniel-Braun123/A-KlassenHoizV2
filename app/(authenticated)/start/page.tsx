import type { Route } from "next";
import { Link } from "@/components/ui/link";
import { RoundSwitcher } from "@/components/rounds/round-switcher";
import { getMyProfile } from "@/features/profile/service";
import { listMyRounds } from "@/features/rounds/service";
export default async function StartPage() {
  const profile = await getMyProfile();

  if (profile?.app_role === "app_admin") {
    return (
      <section className="start-page">
        <div className="start-page__intro">
          <h1>Globale Verwaltung</h1>
          <p>Pflege Ligen, Saisons, Vereine, Spieltage, Spiele und Ergebnisse zentral.</p>
        </div>
        <div className="role-panel">
          <div>
            <h2>Wettbewerbsdaten verwalten</h2>
            <p>Diese Daten stehen anschließend allen privaten Tipprunden zur Verfügung.</p>
          </div>
          <Link href={"/admin/competitions" as Route} variant="button">
            Verwaltung öffnen
          </Link>
          <p className="role-panel__note">
            App-Admins verwalten keine privaten Tipprunden. Verwende dafür ein separates normales
            Benutzerkonto.
          </p>
        </div>
      </section>
    );
  }

  const rounds = await listMyRounds();

  return (
    <section className="start-page">
      <div className="start-page__intro">
        <h1>Willkommen zurück</h1>
        <p>Wähle eine Tipprunde oder erstelle eine neue Runde für deine Freunde.</p>
      </div>
      <RoundSwitcher rounds={rounds} />
    </section>
  );
}
