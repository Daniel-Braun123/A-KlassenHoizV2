import type { Route } from "next";
import { redirect } from "next/navigation";

import { PushPermissionPrompt } from "@/components/notifications/push-permission-prompt";
import { RoundSwitcher } from "@/components/rounds/round-switcher";
import { Link } from "@/components/ui/link";
import { getMissingTipsPreference } from "@/features/notifications/service";
import { getMyProfile } from "@/features/profile/service";
import { listMyRounds } from "@/features/rounds/service";
import { readServerEnvironment } from "@/lib/config/env";
export default async function StartPage() {
  const profile = await getMyProfile();

  if (!profile || profile.status !== "active") redirect("/login" as Route);

  if (profile.app_role === "app_admin") {
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
            <p>Du bist als App-Admin angemeldet.</p>
          </div>
          <Link href="/admin/competitions" variant="button">
            Zur globalen Verwaltung
          </Link>
          <p className="role-panel__note">
            App-Admins verwalten keine privaten Tipprunden. Verwende dafür ein separates normales
            Benutzerkonto.
          </p>
        </div>
      </section>
    );
  }

  const [rounds, missingTipsEnabled] = await Promise.all([
    listMyRounds(),
    getMissingTipsPreference(),
  ]);
  const publicVapidKey = readServerEnvironment().NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const shouldOfferPush =
    Boolean(publicVapidKey) &&
    missingTipsEnabled &&
    rounds.some((round) => round.status === "active");

  return (
    <section className="start-page">
      <div className="start-page__intro">
        <p className="product-mark">Übersicht</p>
        <h1>Willkommen zurück</h1>
        <p>Wähle eine Tipprunde oder erstelle eine neue Runde für deine Freunde.</p>
      </div>
      <RoundSwitcher rounds={rounds} />
      {shouldOfferPush && publicVapidKey && profile.user_id ? (
        <PushPermissionPrompt publicVapidKey={publicVapidKey} userId={profile.user_id} />
      ) : null}
    </section>
  );
}
