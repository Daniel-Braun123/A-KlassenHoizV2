import type { Metadata } from "next";

import { privacyCopy } from "@/features/privacy/copy";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten bei A-KlassenHoiz, einschließlich Google-Anmeldung, Push-Benachrichtigungen und technischer Dienste.",
};

export default function PrivacyPage() {
  return (
    <article className="content-page legal-copy">
      <div className="content-page__intro">
        <p className="product-mark">Privat & Datenschutz</p>
        <h1>Datenschutzerklärung</h1>
        <p>{privacyCopy.scope}</p>
        <p className="legal-copy__updated">Stand: {privacyCopy.updatedAt}</p>
      </div>

      <section aria-labelledby="controller-title">
        <h2 id="controller-title">Verantwortlicher und Kontakt</h2>
        <address>
          <span>{siteConfig.operatorName}</span>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
        </address>
        <p>
          Diese Kontaktadresse kannst du auch für Datenschutzanfragen und zur Ausübung deiner Rechte
          verwenden.
        </p>
      </section>

      <section aria-labelledby="data-title">
        <h2 id="data-title">Welche Daten verarbeitet werden</h2>
        <h3>Konto und Anmeldung</h3>
        <p>{privacyCopy.accountData}</p>
        <h3>Daten in privaten Tipprunden</h3>
        <p>{privacyCopy.appData}</p>
        <h3>Technische Betriebs- und Sicherheitsdaten</h3>
        <p>{privacyCopy.technicalData}</p>
      </section>

      <section aria-labelledby="google-title" id="google-anmeldung">
        <h2 id="google-title">Anmeldung mit Google</h2>
        <p>{privacyCopy.googleData}</p>
        <p>{privacyCopy.googleUse}</p>
      </section>

      <section aria-labelledby="purpose-title">
        <h2 id="purpose-title">Zwecke und Rechtsgrundlagen</h2>
        <p>{privacyCopy.purposes}</p>
      </section>

      <section aria-labelledby="services-title">
        <h2 id="services-title">Technische Dienste und Empfänger</h2>
        <ul className="legal-copy__services">
          {privacyCopy.services.map((service) => (
            <li key={service.name}>
              <strong>{service.name}:</strong> {service.text}
            </li>
          ))}
        </ul>
        <p>{privacyCopy.transfers}</p>
      </section>

      <section aria-labelledby="push-title">
        <h2 id="push-title">Push-Benachrichtigungen</h2>
        <p>{privacyCopy.pushData}</p>
      </section>

      <section aria-labelledby="browser-storage-title">
        <h2 id="browser-storage-title">Cookies, lokaler Speicher und PWA-Cache</h2>
        <p>{privacyCopy.storageData}</p>
      </section>

      <section aria-labelledby="performance-title">
        <h2 id="performance-title">Anonyme Leistungsmessung</h2>
        <p>{privacyCopy.analytics}</p>
      </section>

      <section aria-labelledby="retention-title">
        <h2 id="retention-title">Speicherdauer und Löschung</h2>
        <p>{privacyCopy.retention}</p>
        <p>{privacyCopy.deletion}</p>
      </section>

      <section aria-labelledby="rights-title">
        <h2 id="rights-title">Deine Rechte</h2>
        <p>{privacyCopy.rights}</p>
      </section>

      <section aria-labelledby="decisions-title">
        <h2 id="decisions-title">Keine Werbung oder automatisierten Entscheidungen</h2>
        <p>{privacyCopy.automatedDecisions}</p>
      </section>
    </article>
  );
}
