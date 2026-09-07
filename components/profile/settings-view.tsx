import { Link } from "@/components/ui/link";
import { InstallApp } from "@/components/patterns/install-app";
import { PageBackLink } from "@/components/patterns/page-back-link";
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";

export function SettingsView({ publicVapidKey }: Readonly<{ publicVapidKey: string | null }>) {
  return (
    <section
      className="content-page content-page--compact profile-page"
      aria-labelledby="settings-title"
    >
      <div className="content-page__heading">
        <PageBackLink accessibleLabel="Zurück zur Übersicht" href="/start" label="Übersicht" />
        <div className="content-page__intro">
          <p className="product-mark">Deine App</p>
          <h1 id="settings-title">Einstellungen</h1>
        </div>
      </div>
      <div className="profile-page__sections">
        <InstallApp />
        <PushNotificationSettings publicVapidKey={publicVapidKey} />
        <section className="account-panel">
          <div>
            <h2>Datenschutz</h2>
            <p>Erfahre, wie deine Daten verarbeitet und geschützt werden.</p>
          </div>
          <div className="account-panel__actions">
            <Link href="/legal/privacy">Datenschutzerklärung</Link>
          </div>
        </section>
      </div>
    </section>
  );
}
