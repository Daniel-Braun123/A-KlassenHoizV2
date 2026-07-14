# Contract Conformance

**Stand:** 2026-07-13  
**Prüfobjekt:** lokaler V2-Stand auf `001-rebuild-a-klassenhoiz`  
**Ergebnis:** Application- und RLS-Verträge sind implementiert und automatisiert grün. Der
Quality-Vertrag ist technisch weitgehend erfüllt, aber wegen manueller Gates und LCP noch nicht
releasefähig.

## Application Actions

| Vertragsbereich     | Implementierte Grenze                                                                                       | Nachweis                                   | Status  |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------- |
| Auth                | `features/auth/*`, serverseitige Redirect-Allowlist, Supabase Auth ohne E-Mail-Bestätigung                  | Unit, Integration und Auth-E2E             | erfüllt |
| globale Wettbewerbe | `features/competition/*` → versionierte `api`-RPCs                                                          | Integration, pgTAP, Admin-E2E              | erfüllt |
| Runde/Owner         | `features/rounds/*` → atomare Create/Update/Transfer/Archive/Hard-Delete-RPCs                               | Integration, RLS, E2E                      | erfüllt |
| Einladung/QR        | Token nur als SHA-256-Hash in DB; Rotation, Widerruf, Ablauf und Join über RPC                              | Unit, Integration, RLS, E2E                | erfüllt |
| Tipps/Frist         | Autosave-Action → `api.save_prediction`; DB-Zeit, Spielstatus, Liga-Saison und Mitgliedschaft in DB geprüft | Unit, Integration, Concurrency, RLS, E2E   | erfüllt |
| Ergebnis/Wertung    | `api.set_match_result` schreibt Revision und Recalc atomar; reine 4/3/2/0-Funktion Version 1                | 46 Unit/Component, pgTAP, Integration, E2E | erfüllt |
| Ranglisten          | `api.overall_ranking`, `api.matchday_ranking`, SQL `rank()` nur nach Punkten                                | pgTAP, Integration, E2E                    | erfüllt |
| Kontolöschung       | fachliche Anonymisierung, danach server-only idempotente Auth-Löschung                                      | Integration und Fehlerpfadtests            | erfüllt |
| Break Glass         | 15-Minuten-Grant, Allowlist, Pflichtgrund, read-only Metadaten und append-only Audit                        | pgTAP/RLS, Integration, E2E                | erfüllt |

Alle Mutationsservices validieren unbekannte Inputs mit Zod. Normale Datenzugriffe verwenden den
Benutzer-JWT; der Supabase Secret Key ist auf den Auth-Delete-Adapter begrenzt. Die öffentlichen
Action-Fehler geben keine SQL-, Policy- oder Authdetails aus. Der Redaction-Layer entfernt E-Mail-,
Passwort-, Token-, Cookie-, Tipp- und Rundennamensfelder aus technischen Fehlerdaten.

## RLS- und Storage-Vertrag

| Prüffeld       | Ausführbarer Stand                                                                        | Status  |
| -------------- | ----------------------------------------------------------------------------------------- | ------- |
| Exposition     | Supabase Data API enthält nur Schema `api`; `app`/`private` bleiben intern                | erfüllt |
| Basistabellen  | RLS auf jeder `app`-Tabelle aktiviert und erzwungen; direkte Browser-DML entzogen         | erfüllt |
| Views          | sämtliche Client-Views `security_invoker=true`                                            | erfüllt |
| Rollen         | anon, Nichtmitglied, Member, fremde Runde, Owner, App-Admin und inaktive Profile getestet | erfüllt |
| Zeit           | vor, exakt bei und nach Einzelanpfiff sowie verschobener Anpfiff getestet                 | erfüllt |
| App-Admin-Deny | keine privaten Runden-, Mitglieder-, Einladungs- oder Tippoperationen                     | erfüllt |
| Break Glass    | Scope-/Ablauf-/Widerruf-/Mutations-/PII-Denies und Append-only-Audit getestet             | erfüllt |
| Storage        | public read; anon/auth write deny; Adminpfad/MIME/Größe/Overwrite getestet                | erfüllt |
| Performance    | indizierte Policy-Prädikate und repräsentative `EXPLAIN`-Pläne dokumentiert               | erfüllt |

Der vollständige lokale Datenbanklauf umfasst **201 pgTAP-/RLS-/Storage-Tests** und `db lint` ohne
Befund. Die Detailzuordnung steht in `docs/quality/full-rls-matrix.md`,
`docs/quality/storage-security.md` und `docs/quality/rls-performance.md`.

## Quality Contract

| Gate                                                | Letzter belegter Stand                                                     | Status                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| Format, ESLint, strict TypeScript, Production Build | Exitcode 0                                                                 | erfüllt                                |
| Unit/Component                                      | 46/46                                                                      | erfüllt                                |
| Integration                                         | 17/17                                                                      | erfüllt                                |
| Playwright E2E                                      | 70/70, je 14 in Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari    | lokal erfüllt                          |
| Axe WCAG 2.2 A/AA                                   | 70/70 ohne offenen automatischen Befund                                    | automatisiert erfüllt                  |
| PWA-Automation                                      | 10/10                                                                      | automatisiert erfüllt                  |
| No Analytics/RUM, Clean Room, Produktsprache        | statische Audits grün                                                      | erfüllt                                |
| Dependency Security                                 | 0 high/critical Runtime; 2 moderate im Next/PostCSS-Pfad ohne sicheren Fix | akzeptierter dokumentierter Restbefund |
| Lighthouse Mobile                                   | Performance-Median 96–97, CLS 0, TBT 47,5–85 ms; LCP 2.549,7–2.717,5 ms    | **nicht erfüllt**                      |
| manuelle WCAG/Screenreader                          | Protokoll vorhanden, reale Ausführung offen                                | offen                                  |
| reale PWA-/Gerätematrix                             | Protokoll vorhanden, reale Ausführung offen                                | offen                                  |
| Usability mit fünf Personen                         | Protokoll vorhanden, Durchführung offen                                    | offen                                  |
| Preview-/Release-Abnahme                            | Backend, Deploy und Freigabe offen                                         | offen                                  |

## Abweichungen und Entscheidung

Es gibt keine bekannte Lockerung des Application- oder RLS-Vertrags. Der Release darf dennoch
nicht erfolgen, weil das verbindliche LCP-Laborgate auf allen fünf Messoberflächen um 49,7 bis
217,5 ms verfehlt wird und die menschlichen/realen Geräteprüfungen fehlen. Diese Punkte bleiben in
`tasks.md` offen; dieses Dokument ist kein Waiver.
