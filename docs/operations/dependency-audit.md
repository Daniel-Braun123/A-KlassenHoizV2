# Paketprüfung vom 08.10.2026

Next.js und die zugehörige ESLint-Konfiguration wurden von 16.3.4 auf 16.3.8
aktualisiert. Vitest und Coverage wurden auf 4.1.11, Lighthouse auf 13.5.0
aktualisiert. Kompatible transitive Sicherheitsupdates sind im Lockfile enthalten.

`npm audit --omit=dev` meldet für diese Fassung keine bekannten Schwachstellen.
Der Qualitätsworkflow führt diese Prüfung künftig bei jedem Release aus.
Der Produktionsbuild und alle 339 Unit-/Komponententests bestanden lokal mit
Next.js 16.3.8 und Vitest 4.1.11.

Die vollständige Paketprüfung meldet weiterhin fünf hohe Warnungen für die
Entwicklungswerkzeuge: `braces` sowie die abhängigen Pakete `micromatch`,
`fast-glob`, `@next/eslint-plugin-next` und `eslint-config-next`. Der betroffene
Pfad gehört zur Dateisuche beim Linting und wird nicht als Produktionsabhängigkeit
ausgeliefert. Zum Prüfzeitpunkt nennt die Paketprüfung keine reparierte Version
von `braces`; ihr automatischer Vorschlag würde die Next.js-Lint-Konfiguration
auf Version 14 zurückstufen. Dieser inkompatible Downgrade wurde nicht angewendet.

Referenzen: [Next.js ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j),
[Next.js Image Optimization](https://github.com/advisories/GHSA-cjq9-62q9-8jv4),
[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
