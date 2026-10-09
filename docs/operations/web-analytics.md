# Vercel-Besucherstatistik

Am 09.10.2026 wurde Vercel Web Analytics auf Wunsch des Projekteigentümers
wiederhergestellt. Der SEO-Commit `f8af12d` vom 09.08.2026 hatte Paket und
Layout-Einbindung entfernt. Speed Insights allein liefert keine Besucherzählung
für das Analytics-Dashboard.

`AppAnalytics` ist einmal im Produktions-Root-Layout eingebunden. Es verwendet
`@vercel/analytics/next` für vollständige Seitenladungen und Next.js-Navigation.
Das SDK wird im Entwicklungsmodus nicht eingebunden. Die Projektaktivierung in
Vercel muss bestehen; danach sind für zukünftige Messdaten neue Seitenaufrufe nötig.
Ausgefallene, damals nicht erfasste Seitenaufrufe können nicht rekonstruiert werden.

## Datengrenze

- Nur anonyme, aggregierte Besucher- und Seitenaufrufzahlen; keine App-Benutzerkennungen.
- Keine eigenen Produkt-Ereignisse, Tracking-Cookies oder Sitzungsaufzeichnungen.
- Einladungs-Tokens, interne Runden-/Liga-IDs, Query-Parameter und Fragmente werden
  vor der Übertragung aus der Seitenadresse entfernt.
- `Referrer-Policy: strict-origin` verhindert private Pfade in ausgehenden
  Referrern, auch bei Navigation zwischen Seiten derselben Domain.
- Die veröffentlichte Datenschutzerklärung beschreibt beide Vercel-Messdienste.

Die Zahl „Visitors“ ist keine Anzahl registrierter oder angemeldeter App-Konten.
Die anonymen Besucherkennungen werden laut Vercel nach 24 Stunden verworfen.

## Prüfung

Der Browser-Regressionscheck prüft das tatsächlich injizierte SDK-Skript und dessen
einmalige Einbindung über einen Seitenwechsel. Im lokalen Test wird der Collector
abgefangen; es werden keine synthetischen Produktionsbesuche erzeugt. Unit-Tests
prüfen die Redigierung sensibler Adressen und das Verwerfen eigener Produkt-Ereignisse.
Nach Veröffentlichung werden tatsächliche Skriptladung und Dashboard-Daten kontrolliert.

Referenzen: [Vercel-Einrichtung](https://vercel.com/docs/analytics/quickstart),
[Vercel-Datengrenze](https://vercel.com/docs/analytics/privacy-policy).
