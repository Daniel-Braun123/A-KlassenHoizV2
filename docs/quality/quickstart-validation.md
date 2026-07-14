# Fresh-Checkout-Validierung

**Aufgabe:** T294  
**Datum:** 2026-07-13  
**Quellcommit:** `146feb21671e29a57fdb8ec5ca15d1a9c2e3af08`  
**Checkout:** neuer temporärer Clone von `001-rebuild-a-klassenhoiz`, ohne `.env.local`,
`node_modules`, `.next` oder lokale Datenbank aus dem Arbeitsrepository  
**Ergebnis:** Quickstart technisch reproduzierbar; einziges bewusst rotes Quality-Gate bleibt LCP.

## Umgebung

- Windows 11, PowerShell, Docker Desktop
- frisch heruntergeladene Node.js `24.18.0`
- npm im lokalen, ignorierten Node-Runtime-Verzeichnis auf `11.18.0` aktualisiert
- Supabase CLI `2.109.1` aus dem Lockfile
- Next.js `16.2.10`, Production Build
- keine Remote-Credentials und keine Remote-Mutation

Der erste, künstlich auf fünf Sekunden begrenzte Startversuch wurde vom Befehlscontroller während
des Docker-Starts beendet und hinterließ einen halboffenen lokalen Stack. Dieser technische Abbruch
wurde separat behandelt: lokaler Stack ohne Backup gestoppt, sauber neu gestartet und derselbe
Reset erfolgreich wiederholt. Es gab keinen Produkt-, Migrations- oder Testfehler.

## Reproduzierbarkeit

| Schritt                                    | Ergebnis                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| frischer Clone + `npm ci`                  | 656 Pakete aus Lockfile installiert                                                                                                            |
| `npm run db:start`                         | lokales Ziel bestätigt, keine Remote-Verbindung                                                                                                |
| `npm run db:reset`                         | alle 51 ausschließlich neuen V2-Migrationen + synthetischer Seed erfolgreich                                                                   |
| `npm run db:lint`                          | keine Befunde                                                                                                                                  |
| `npm run test:db`                          | 201/201 pgTAP-, RLS- und Storage-Tests                                                                                                         |
| `npm run db:types`                         | generierter Blob-Hash entspricht exakt `HEAD`; nur Windows-Stat/CRLF-Markierung, kein Inhaltsdiff                                              |
| `npm run format:check`                     | grün                                                                                                                                           |
| `npm run lint`                             | grün, keine Warnung erlaubt                                                                                                                    |
| `npm run typecheck`                        | grün, TypeScript strict                                                                                                                        |
| `npm run test:unit`                        | 46/46                                                                                                                                          |
| `npm run test:integration`                 | 17/17                                                                                                                                          |
| `npm run build`                            | Production Build, 21 statische/dynamische Routen erfolgreich                                                                                   |
| `npm run test:e2e`                         | Chromium, Firefox, WebKit und Mobile Chrome je 14/14; Gesamtharness erst beim externen 10-Minuten-Limit während wiederholter DB-Resets beendet |
| gezieltes Mobile-Safari-E2E                | 14/14; damit alle fünf Profile aus dem frischen Clone belegt                                                                                   |
| `npm run test:accessibility -- -Project …` | 70/70, 14 je Profil                                                                                                                            |
| `npm run test:pwa -- -Project …`           | 10/10, 2 je Profil                                                                                                                             |
| GitHub Fresh Runner                        | Quality, Database, alle fünf Browserjobs und Aggregat grün in Run `29282993756`                                                                |
| `npm run test:performance:lab`             | technisch vollständig, 15 isolierte Läufe und Artefakt; Exit 1 ausschließlich wegen LCP-Gate                                                   |

Der sequenzielle E2E-Wrapper setzt die lokale Datenbank vor jedem Profil vollständig zurück. Vier
Profile und 56 Tests waren bestanden, als der externe 10-Minuten-Controller den Prozess beendete;
es gab keinen fehlgeschlagenen Playwright-Test. Mobile Safari wurde danach separat aus demselben
frischen Checkout bestanden. Der identische Commit wurde zusätzlich auf fünf isolierten frischen
GitHub-Runnern vollständig grün ausgeführt:
<https://github.com/Daniel-Braun123/A-KlassenHoizV2/actions/runs/29282993756>.

## Fresh-Checkout-Lighthouse

| Oberfläche      | Performance |        LCP | CLS |     TBT | Gate    |
| --------------- | ----------: | ---------: | --: | ------: | ------- |
| Login           |          93 | 3.165,0 ms |   0 |   35 ms | LCP rot |
| Rundenübersicht |          97 | 2.520,5 ms |   0 |   36 ms | LCP rot |
| acht Tipps      |          97 | 2.516,4 ms |   0 | 23,5 ms | LCP rot |
| Gesamtrangliste |          97 | 2.509,3 ms |   0 | 18,5 ms | LCP rot |
| Ergebnisadmin   |          97 | 2.557,9 ms |   0 | 39,5 ms | LCP rot |

Dieser zweite Laborsatz bestätigt den bereits im kanonischen Artefakt dokumentierten Befund: Score,
CLS und TBT erfüllen das Budget, LCP nicht. Die stärkere Login-Abweichung zeigt zusätzlich die
Empfindlichkeit eines parallelen Desktop-Labors, ersetzt aber nicht die gepinnte kanonische
Messreihe. T251 bleibt offen; T294 erteilt keinen Performance-Waiver.

## Dependency-Hinweis

`npm ci` meldet 19 moderate Development-Tree-Befunde. Der getrennte Runtime-Audit enthält keine
high/critical Schwachstelle; zwei moderate Next/PostCSS-Befunde besitzen keinen sicheren Fix ohne
unerlaubtes Major-Downgrade. Die Bewertung steht in `docs/quality/dependency-baseline.md`.

## Schluss

Ein neuer Entwickler oder CI-Runner kann Repository, lokalen V2-Stack, Typen, Build und sämtliche
automatisierten Testebenen ohne alte Anwendung, alte Migration, Produktionsdaten oder
Produktionszugriff rekonstruieren. Nicht automatisierbare Accessibility-, Geräte- und
Usability-Gates sowie das rote LCP-Gate bleiben ausdrücklich offen.
