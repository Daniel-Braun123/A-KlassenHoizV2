# Foundation-Datenbanknachweis

**Aufgabe:** T040  
**Stand:** 2026-07-13  
**Status:** BESTANDEN

## Implementierter Stand

- lokale Supabase-Konfiguration exponiert ausschließlich `api` und deaktiviert die
  E-Mail-Bestätigung bei aktivem E-Mail-/Passwort- und Reset-Ablauf;
- vier ausschließlich neue V2-Migrationen für Schema-Grenzen, Default Privileges, Core-Typen/
  Helper und `club-logos`;
- deterministische Testakteure, Security-Baseline und Storage-Policy-Tests;
- synthetischer Seed ohne Produktionsdaten;
- lokale, technisch gegen `--linked`, `--db-url`, `db push`, `migration repair` und die
  Produktions-Projektreferenz gesperrte DB-Skripte;
- reproduzierbare Typgenerierung aus der lokalen Datenbank.

Die lokale Anwendungsbasis besteht unabhängig davon bereits Strict-Typecheck, ESLint, 30 Unit-/
Komponententests, Production Build, Formatprüfung und Clean-Room-Audit. Die Foundation-Shell wurde
bei 320×800, 390×844 und 1440×900 CSS-Pixeln ohne horizontalen Überlauf oder Browserfehler geprüft.

## Ausführungsnachweis

- Docker Desktop 4.81.0 mit Docker Engine 29.6.1 wurde als lokale WSL-2-Engine eingerichtet.
- `npm run db:reset`: bestanden; ausschließlich vier neue V2-Migrationen und synthetischer Seed.
- `npm run db:lint`: bestanden; keine Schemafehler.
- `npm run test:db`: bestanden; drei Dateien und 29 pgTAP-/RLS-/Storage-Prüfungen.
- `npm run db:types`: bestanden; `lib/supabase/database.types.ts` aus der lokalen Datenbank erzeugt.
- Der Remote-Datenbankbestand wurde dabei nicht als lokaler Testersatz verwendet.

Der erste Seed-Lauf deckte die seit der Planung geänderte generierte `auth.identities.email`-Spalte
auf. Der synthetische Seed wurde auf `identity_data` als kanonische Quelle korrigiert. Ein früherer
PowerShell-Splattingfehler im lokalen Wrapper wurde ebenfalls behoben; beide Fehler waren lokal und
verursachten keine Remote-Mutation.

T024 und T040 sind damit abgeschlossen. Freigabe B wurde anschließend separat erfasst; sie war
keine Voraussetzung für diesen lokalen Nachweis.
