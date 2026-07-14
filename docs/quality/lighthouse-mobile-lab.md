# Lighthouse Mobile Lab

Stand: 13. Juli 2026. Konfiguration: `lighthouse.config.mjs`, Runner: `scripts/run-lighthouse-lab.mjs`.

- Node 24.18.0, Next.js 16.2.10 Production Build;
- Lighthouse 13.4.0 und Playwright Chromium 1228;
- 360×640 CSS-Pixel, DPR 2,625, 150 ms RTT, 1.638,4 Kbit/s, CPU×4;
- kaltes, separates Chromium-Profil je Lauf;
- deterministische lokale Supabase-Fixtures;
- Login, Rundenübersicht, acht Spiele, Gesamtrangliste und globale Ergebnisverwaltung;
- drei Läufe je Route, Median als Gate.

Der vollständige Dreifachlauf vom 13. Juli 2026 ist technisch reproduzierbar ausgeführt worden. Rohwerte liegen in `docs/quality/artifacts/lighthouse-mobile.json`.

| Oberfläche         | Performance-Median | LCP-Median | CLS-Median | TBT-Median | Ergebnis     |
| ------------------ | -----------------: | ---------: | ---------: | ---------: | ------------ |
| Login              |                 96 | 2.717,5 ms |          0 |      85 ms | LCP verfehlt |
| Rundenübersicht    |                 97 | 2.574,4 ms |          0 |    47,5 ms | LCP verfehlt |
| Acht Tipps         |                 97 | 2.586,8 ms |          0 |      63 ms | LCP verfehlt |
| Gesamtrangliste    |                 97 | 2.549,7 ms |          0 |    49,5 ms | LCP verfehlt |
| Globale Ergebnisse |                 97 | 2.582,9 ms |          0 |    58,5 ms | LCP verfehlt |

Damit ist die geforderte Messung vollständig ausgeführt (T250). Das Abnahmegate T251 bleibt offen. Isolierte Diagnosemessungen schreiben bewusst nur nach `lighthouse-mobile-debug.json` und können den kanonischen 15-Läufe-Nachweis nicht mehr überschreiben.
