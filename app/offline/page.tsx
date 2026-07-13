import { Link } from "@/components/ui/link";
export default function OfflinePage() {
  return (
    <section className="content-page">
      <div className="status-state status-state--offline">
        <span className="status-state__symbol" aria-hidden="true">
          ↯
        </span>
        <div>
          <h1>Du bist offline</h1>
          <p>
            Bereits eingegebene Werte in einer offenen Seite bleiben sichtbar, sind aber ohne
            Serverbestätigung nicht gespeichert. Stelle die Verbindung wieder her und versuche es
            erneut.
          </p>
          <Link href="/">Erneut verbinden</Link>
        </div>
      </div>
    </section>
  );
}
