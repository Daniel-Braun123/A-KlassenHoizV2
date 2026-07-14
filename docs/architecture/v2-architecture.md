# A-KlassenHoiz V2 – Ist-Architektur

**Stand:** 2026-07-13  
**Gültigkeit:** Commit `146feb2` und nachfolgende reine CI-Korrekturen auf
`001-rebuild-a-klassenhoiz`  
**Remote-Status:** lokal vollständig aufgebaut; der V2-Rollout in das bestehende Supabase-Projekt
und der Vercel-Cutover sind noch nicht erfolgt.

## Systemgrenze

A-KlassenHoiz V2 ist eine mobile-first Next.js-PWA für private Tipprunden. Next.js rendert Seiten,
führt Server Actions aus und verwaltet die Supabase-Auth-Cookies. Supabase stellt Auth, PostgreSQL,
die ausschließlich über `api` exponierte Data API und den öffentlichen, schreibgeschützten
Logo-Bucket bereit. Es gibt weder Produktanalytics noch RUM, Werbe-, Zahlungs- oder
Echtgeldfunktionen.

```text
Browser / installierte PWA
  ├─ öffentliche Assets + streng begrenzter Offline-Fallback
  └─ HTTPS, Auth-Cookie
       ↓
Next.js Server Components / Server Actions / Auth-Proxy
  ├─ Zod-Validierung, Redirect-Allowlist, Cache-Invalidierung
  ├─ Benutzer-JWT für normale Reads und RPCs
  └─ server-only Supabase Secret ausschließlich für Auth-Kontolöschung
       ↓
Supabase Auth + Data API (nur Schema api) + Storage
       ↓
PostgreSQL app/private + RLS + Grants + transaktionale RPCs
```

## Trust-Grenzen

1. Browserwerte sind immer untrusted. Formulare werden serverseitig validiert; Rollen, Status,
   Objektbezug und Fristen werden anschließend erneut in PostgreSQL geprüft.
2. `NEXT_PUBLIC_*` enthält ausschließlich URL, Publishable Key und Site-URL. Der Supabase Secret Key
   ist server-only und wird nur im idempotenten Auth-Löschschritt verwendet.
3. Die Data API exponiert ausschließlich `api`. `app` und `private` sind nicht exponiert;
   Browserrollen besitzen keine direkten DML-Rechte auf Basistabellen.
4. `app` enthält fachliche Daten. Auf allen 15 Basistabellen ist RLS aktiviert und erzwungen.
   `private` enthält Token-Hashes, Idempotenz-/Rate-Limit-Zustand und operative Audits ohne direkte
   Client-Grants.
5. Views im Schema `api` verwenden `security_invoker=true`. Mutationen laufen über eng freigegebene
   RPCs, die mit leerem `search_path`, Benutzerkontext und expliziten Fachprüfungen arbeiten.
6. Storage-Reads auf Vereinslogos sind öffentlich. Schreiben ist ausschließlich App-Admins erlaubt
   und zusätzlich nach Pfad, MIME-Typ und Größe begrenzt.
7. Service Worker und Browsercache dürfen keine privaten Antworten, Auth-Antworten, RSC-Payloads
   oder Supabase-Responses persistent speichern. Offline gibt es keine Tippqueue.

## Endgültiges Schema

| Schema    | Objekte                                                       | Zweck                                                                                  |
| --------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `auth`    | Supabase `users`, Sessions                                    | kanonische Identität und E-Mail; keine E-Mail-Spiegelung in Fachtabellen               |
| `app`     | `profiles`                                                    | Anzeigename, Profilstatus, Rolle `user`/`app_admin`                                    |
| `app`     | `leagues`, `seasons`, `league_seasons`                        | globaler Liga-Saison-Katalog mit versionierten Statusübergängen                        |
| `app`     | `clubs`, `league_season_clubs`                                | zentrale Vereine und erlaubte Saisonzuordnung                                          |
| `app`     | `matchdays`, `matches`, `match_results`, `result_revisions`   | zentraler Spielplan, Anpfiff als einzelne Frist, Ergebnisse und append-only Revisionen |
| `app`     | `prediction_rounds`, `round_memberships`                      | private Runden; genau ein Owner, nur Rolle `member` daneben                            |
| `app`     | `predictions`, `prediction_scores`                            | Tipps und materialisierte deterministische 4/3/2/0-Wertung                             |
| `app`     | `admin_access_events`                                         | append-only Break-Glass-Zugriffsaudit ohne gelesene Werte                              |
| `private` | `invitations`, `mutation_idempotency`, `mutation_rate_limits` | Token-Hashes, Wiederholungs- und Missbrauchsschutz                                     |
| `private` | `support_access_grants`, `destructive_audit_events`           | kurzlebige Supportfreigaben und minimales Lösch-Audit                                  |
| `api`     | 16 `security_invoker`-Views und freigegebene RPCs             | einziges Data-API-Read-/Write-Modell                                                   |
| `storage` | Bucket `club-logos` + vier Policies                           | versionierte Vereinslogos                                                              |

Die ausführliche Spalten- und Invariantenbeschreibung steht in
`specs/001-rebuild-a-klassenhoiz/data-model.md`. Maßgeblich für den ausführbaren Stand sind die
ausschließlich neuen Migrationen unter `supabase/migrations/`.

## Autorisierungsmodell

- Anonym: Auth-Flows, Rechtshinweis, statische Assets und minimale Einladungsvorschau mit gültigem
  Token.
- Aktiver Nutzer: veröffentlichte globale Daten und eigene aktive Mitgliedschaften.
- Mitglied: Rundendaten derselben Runde, eigene Tipps jederzeit lesbar, fremde Tipps erst exakt ab
  dem jeweiligen `kickoff_at` nach Datenbankzeit.
- Owner: Mitgliedsrechte plus Mitglieder-, Einladungs-, Archivierungs-, Transfer- und Hard-Delete-
  Operationen genau der eigenen Runde. Es gibt keinen Co-Admin.
- App-Admin: ausschließlich globale Liga-, Saison-, Vereins-, Spielplan- und Ergebnisverwaltung.
  Private Runden bleiben im Normalbetrieb unsichtbar und unveränderbar.
- Break Glass: maximal 15 Minuten, begründet, allowlistbasiert, read-only und vollständig auditiert;
  keine E-Mails, Namen, Tipps, Wertungen, Ranglisten, Listen oder Exporte.
- `deletion_pending`/`disabled`: keine fachlichen Rechte.

## Atomare Grenzen

- Rundenerstellung schreibt Runde und genau eine Owner-Mitgliedschaft atomar.
- Einladungstausch widerruft den alten Hash und setzt neuen Hash/Ablauf atomar.
- Tipp-Speicherung sperrt das Spiel, prüft Status und DB-Zeit und führt einen idempotenten Upsert aus.
- Ergebnisänderung schreibt Revision und berechnet alle betroffenen Einzelwertungen in derselben
  Transaktion neu.
- Ownertransfer aktualisiert beide Rollen und die Ownerreferenz atomar.
- Runden-Hard-Delete prüft Version und exakten Namen und entfernt Scores, Tipps, Einladungen,
  Mitgliedschaften und Runde vollständig oder gar nicht. Nur ein nicht sprechendes Audit bleibt.
- Kontolöschung anonymisiert Fachdaten zuerst und löscht anschließend den Auth-Nutzer idempotent.

## Laufzeit- und Deploymententscheidungen

- Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3 mit `strict` und Node 24.18.0.
- React Server Components für Reads; kleine Client-Inseln nur für Formstatus, Autosave,
  Konnektivität, QR-Code und PWA-Update.
- Keine Wiederverwendung von Altcode, Altmigrationen oder Altdaten.
- Vercel-Projekt und Supabase-Projekt werden weiterverwendet, aber erst hinter dokumentierten
  Preview-, Rollout- und Cutover-Gates umgeschaltet.
- Die lokale Referenzprüfung umfasst Unit/Component, Integration, pgTAP/RLS/Storage, fünf
  Playwright-Profile, Axe, PWA und einen reproduzierbaren Lighthouse-Laborkorridor.

## Offene Releasegrenzen

Die Architektur ist implementiert, aber nicht produktiv abgenommen. Offen bleiben reale
PWA-/Gerätetests, manuelle Accessibility, Usability mit fünf Personen, das LCP-Laborgate sowie
Preview-, Remote-Rollout-, Produktions- und Cutover-Freigaben. Diese Grenzen sind keine
Architekturabweichung und dürfen nicht durch einen lokalen Teststatus ersetzt werden.
