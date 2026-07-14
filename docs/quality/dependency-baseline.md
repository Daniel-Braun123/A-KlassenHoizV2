# Laufzeit- und Dependency-Baseline

**Aufgabe:** T016  
**Prüfdatum:** 2026-07-13  
**Status:** BESTANDEN

## Abgleich mit `research.md`

| Bereich                              | Erwartet                                                     | Lockfile/Projekt                                             | Ergebnis |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | -------- |
| Node.js / npm                        | `24.18.0` / `11.18.0`                                        | `.nvmrc`, `engines`, `packageManager`, projektlokale Runtime | PASS     |
| Next.js / React / React DOM          | `16.2.10` / `19.2.7` / `19.2.7`                              | exakt gepinnt                                                | PASS     |
| TypeScript / Typen                   | `6.0.3`, Node `24.13.3`, React `19.2.17`, React DOM `19.2.3` | exakt gepinnt                                                | PASS     |
| Supabase Client / SSR / CLI          | `2.110.2` / `0.12.0` / `2.109.1`                             | exakt gepinnt                                                | PASS     |
| Zod / Tailwind / QR                  | `4.4.3` / `4.3.2` / `1.5.4`                                  | exakt gepinnt; QR-Typen `1.5.6`                              | PASS     |
| Vitest / RTL / jsdom                 | `4.1.10` / `16.3.2` / `29.1.1`                               | exakt gepinnt                                                | PASS     |
| Playwright / Axe                     | `1.61.1` / `4.12.1`                                          | exakt gepinnt                                                | PASS     |
| ESLint / Next / TS-ESLint / JSX-A11y | `9.39.5` / `16.2.10` / `8.63.0` / `6.10.2`                   | exakt gepinnt                                                | PASS     |
| Prettier                             | `3.9.5`                                                      | exakt gepinnt                                                | PASS     |

`package.json` enthält keine Semver-Bereiche für direkte Abhängigkeiten. `package-lock.json` liegt
in Lockfile-Version 3 vor und ist die reproduzierbare transitive Lieferquelle. `npm ci` ist der
einzige CI-Installationsweg.

## Verifizierte Projektlaufzeit

Die offizielle Windows-x64-Distribution von Node.js `24.18.0` wurde gegen die veröffentlichte
SHA-256-Liste geprüft und unter dem ignorierten Verzeichnis `.tools/` installiert. npm `11.18.0`
liegt ebenfalls projektlokal vor. `scripts/install-project-runtime.ps1` reproduziert die Installation
und `scripts/project-npm.ps1` erzwingt diese Runtime für Qualitätskommandos.

Der aktuelle vollständige Baseline-Lauf bestand:

- `npm run format:check`;
- `npm run lint` ohne Warnungen;
- `npm run typecheck` mit TypeScript strict;
- Unit/Component (46/46), Integration (17/17) und DB/RLS/Storage (201/201);
- `npm run build` mit Next.js Production Build;
- `scripts/audit-clean-room.ps1`.

`npm audit --omit=dev --audit-level=high` besteht mit 0 hohen oder kritischen Befunden. Zwei
moderate Meldungen betreffen das von Next.js intern gebündelte PostCSS; der von npm angebotene
`--force`-Pfad wäre ein unzulässiger Breaking-Downgrade und wird nicht angewendet.

## Änderungsregel

Jede Versionsänderung erfolgt in einem eigenen Dependency-PR, aktualisiert `research.md`,
`package.json`, Lockfile und diesen Nachweis, prüft offizielle Release-/Security-Hinweise und führt
die vollständige Qualitäts-, Datenbank- und E2E-Suite aus. Automatische Updates werden nicht ohne
grüne Gates gemergt.
