import { RoundSwitcher } from "@/components/rounds/round-switcher";
import { getMyProfile } from "@/features/profile/service";
import { listMyRounds } from "@/features/rounds/service";
export default async function StartPage() {
  const profile = await getMyProfile();

  if (profile?.app_role === "app_admin") {
    return (
      <section className="start-page">
        <div className="start-page__intro">
          <p className="product-mark">Zentrale Ligadaten</p>
          <h1>Globale Verwaltung</h1>
          <p>Pflege Ligen, Vereine, Spieltage, Spiele und Ergebnisse zentral.</p>
        </div>
        <div className="role-panel">
          <div>
            <h2>Administratorkonto</h2>
            <p>Der Administrationsbereich ist nicht in der normalen Navigation verlinkt.</p>
          </div>
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
        <p className="product-mark">Übersicht</p>
        <h1>Willkommen zurück</h1>
        <p>Wähle eine Tipprunde oder erstelle eine neue Runde für deine Freunde.</p>
      </div>
      <RoundSwitcher rounds={rounds} />
    </section>
  );
}
