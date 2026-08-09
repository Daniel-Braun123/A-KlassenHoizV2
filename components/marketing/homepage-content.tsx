import type { Route } from "next";

import { Icon, type IconName } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { homepageFaqs } from "@/lib/seo/homepage-content";

const features: ReadonlyArray<{
  title: string;
  description: string;
  icon: IconName;
}> = [
  {
    title: "Private Tipprunden",
    description:
      "Erstelle eure eigene Runde und teile den Zugang nur mit den Freunden, die dazugehören.",
    icon: "lock",
  },
  {
    title: "Kostenlos spielen",
    description:
      "Runde erstellen, gemeinsam tippen und die Rangliste verfolgen – ohne kostenpflichtige Mitgliedschaft.",
    icon: "check-circle",
  },
  {
    title: "Einfach Freunde einladen",
    description:
      "Versende einen privaten Einladungslink oder lass deine Freunde den passenden QR-Code scannen.",
    icon: "qr",
  },
  {
    title: "Tipps bis zum Anpfiff",
    description:
      "Passe deine Ergebnisse bis zum jeweiligen Spielbeginn an und speichere sie gemeinsam ab.",
    icon: "clock",
  },
  {
    title: "Gemeinsam mitfiebern",
    description:
      "Verfolge Ergebnisse, Punkte sowie Gesamt- und Spieltagsranglisten direkt in eurer Runde.",
    icon: "rankings",
  },
];

export function HomepageContent() {
  return (
    <>
      <section className="landing-section landing-about" aria-labelledby="about-title">
        <div className="landing-section__header">
          <p className="product-mark">Eine Runde, die euch gehört</p>
          <h2 id="about-title">Das kostenlose Fußball-Tippspiel für deine Freunde</h2>
        </div>
        <div className="landing-about__copy">
          <p>
            Mit A-KlassenHoiz erstellst du eine private Fußball-Tipprunde für deinen Freundeskreis.
            Du wählst eine verfügbare Liga, lädst die passenden Leute ein und ihr tippt die
            Ergebnisse gemeinsam online.
          </p>
          <p>
            Jeder Tipp kann bis zum jeweiligen Anpfiff geändert werden. Danach seht ihr Ergebnisse,
            Punkte und Platzierungen innerhalb eurer eigenen Runde – übersichtlich auf dem
            Smartphone und am Desktop.
          </p>
          <p>
            Im Mittelpunkt steht der gemeinsame Spaß: keine komplizierte Einrichtung, keine
            kostenpflichtige Mitgliedschaft und eine klare Bedienung für eure nächste Fußballsaison.
          </p>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="benefits-title">
        <div className="landing-section__header">
          <p className="product-mark">Warum A-KlassenHoiz?</p>
          <h2 id="benefits-title">Alles für eure private Fußball-Tipprunde</h2>
          <p>
            Die wichtigsten Funktionen sind auf einen unkomplizierten Wettbewerb im Freundeskreis
            ausgerichtet.
          </p>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article className="landing-feature-card" key={feature.title}>
              <span className="landing-feature-card__icon">
                <Icon name={feature.icon} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-faq" aria-labelledby="faq-title" id="faq">
        <div className="landing-section__header">
          <p className="product-mark">Fragen und Antworten</p>
          <h2 id="faq-title">Häufige Fragen zum Fußball-Tippspiel</h2>
          <p>Die wichtigsten Antworten für den Start mit deiner eigenen Tipprunde.</p>
        </div>
        <div className="landing-faq__list">
          {homepageFaqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-cta" aria-labelledby="cta-title">
        <div>
          <p className="product-mark">Bereit für den nächsten Spieltag?</p>
          <h2 id="cta-title">Erstellt eure private Tipprunde</h2>
          <p>Konto anlegen, Liga wählen, Freunde einladen – und gemeinsam loslegen.</p>
        </div>
        <div className="landing-cta__actions">
          <Link href={"/register" as Route} variant="button">
            Kostenlos starten
          </Link>
          <Link href={"/login" as Route}>Anmelden</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>A-KlassenHoiz – das private Fußball-Tippspiel für Freunde.</p>
        <nav aria-label="Rechtliche Hinweise">
          <Link href={"/legal/privacy" as Route}>Hinweise zu Datenschutz und privater Nutzung</Link>
        </nav>
      </footer>
    </>
  );
}
