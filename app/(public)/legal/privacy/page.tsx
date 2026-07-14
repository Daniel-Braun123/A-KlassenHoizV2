import { privacyCopy } from "@/features/privacy/copy";
export default function PrivacyPage() {
  return (
    <article className="content-page legal-copy">
      <div className="content-page__intro">
        <p className="product-mark">Privat & Datenschutz</p>
        <h1>Hinweise zur privaten Nutzung</h1>
        <p>{privacyCopy.scope}</p>
      </div>
      <section>
        <h2>Welche Daten die App braucht</h2>
        <p>{privacyCopy.data}</p>
      </section>
      <section>
        <h2>Technische Dienste</h2>
        <p>{privacyCopy.services}</p>
      </section>
      <section>
        <h2>Keine Verhaltensmessung</h2>
        <p>{privacyCopy.analytics}</p>
      </section>
      <section>
        <h2>Löschen</h2>
        <p>{privacyCopy.deletion}</p>
      </section>
      <section>
        <h2>Nutzungsgrenze</h2>
        <p>
          Die App ist nicht öffentlich, nicht geschäftlich und nicht kostenpflichtig. Bei einer
          späteren Öffnung oder Monetarisierung müssen die sichtbaren Hinweise und Pflichten vorab
          neu geprüft werden.
        </p>
      </section>
    </article>
  );
}
