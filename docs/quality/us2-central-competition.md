# US2-Abnahme: zentrale Wettbewerbsverwaltung

**Stand:** 13. Juli 2026  
**Ergebnis:** PASS (lokal, frisches V2-Schema)

## Abgenommener Umfang

- globale Ligen, Saisons, Liga-Saisons, Vereine, Zuordnungen, Spieltage, Spiele und Ergebnisse;
- ausschließlich App-Admin-geschützte Mutations-RPCs, keine direkten Browser-DML-Rechte;
- erzwungenes RLS auf jeder globalen Basistabelle und `security_invoker`-Read-Models;
- Lifecycle- und Optimistic-Concurrency-Prüfungen für Katalog, Spielplan und Ergebnisse;
- append-only Ergebnisrevisionen und globale Ergebniskorrektur ohne private Tipprundenrechte;
- versionierte Vereinslogo-Pfade, MIME-Allowlist und 2-MiB-Grenze;
- mobile Admin-Oberflächen mit sichtbaren Konflikt-, Warn- und Statusmeldungen.

US2 ist unabhängig von Break-Glass- oder anderen privaten Supportfunktionen abnehmbar. Die globale
App-Admin-Rolle vermittelt keine Tipprunden-, Mitglieder-, Einladungs- oder Tippberechtigung.

## Reproduzierbare Nachweise

| Prüfung                                                            |   Ergebnis |
| ------------------------------------------------------------------ | ---------: |
| lokaler Schema-Neuaufbau (`npm run db:reset`)                      |       PASS |
| pgTAP/RLS/Storage (`npm run test:db`)                              | 71/71 PASS |
| echte lokale Supabase-Integration (`npm run test:integration`)     |   5/5 PASS |
| TypeScript strict (`npm run typecheck`)                            |       PASS |
| ESLint (`npm run lint`)                                            |       PASS |
| Next.js Production Build (`npm run build`)                         |       PASS |
| Admin-E2E: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari |   5/5 PASS |
| Axe WCAG 2.2 AA über Auth- und vier Adminrouten                    | 40/40 PASS |

Die Browserprüfungen beziehen Supabase-URL und Publishable Key ausschließlich aus dem laufenden
lokalen Stack. Alte `.env.local`-Produktionswerte werden dabei nicht verwendet.

## Sicherheitsentscheidungen

- Fachliche Versionskonflikte verwenden einen eigenen nicht-retrybaren Fehlerpfad. SQLSTATE
  `40001` bleibt echten Serialisierungsfehlern vorbehalten.
- Unverknüpfte Entwürfe sind für normale Nutzer unsichtbar. Veröffentlichte Liga-Saisons werden
  über ein minimales Read-Model angeboten.
- Vereinslogos sind öffentliche, nicht personenbezogene Assets; Schreiben und Löschen bleibt auf
  aktive App-Admins begrenzt.
- Ergebnisrevisionen besitzen keine Update-/Delete-Berechtigung für Anwendungsrollen.

## Nicht Bestandteil von US2

Tipprunden, Einladungen, Tipps, Punkte, Ranglisten, Break-Glass und Produktions-Provisionierung
werden in ihren eigenen Stories beziehungsweise expliziten Operations-Gates umgesetzt und geprüft.
