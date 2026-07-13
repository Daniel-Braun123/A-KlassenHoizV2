# Phase 1 Quickstart: Geplanter Entwicklungs- und Verifikationsablauf

> Dieses Dokument ist ein Ausführungsplan für die spätere Implementierung. Die Befehle wurden im Rahmen von `/speckit-plan` nicht ausgeführt. Insbesondere ist jeder Remote-Supabase-Befehl verboten, bis die separate Reset-/Deploy-Freigabe vorliegt.

## 1. Voraussetzungen

- Node.js `24.18.0` LTS und npm `11.18.0`.
- Docker-kompatible Laufzeit für den lokalen Supabase-Stack.
- Supabase CLI als versionierte Dev Dependency, nicht als unkontrollierte globale Abhängigkeit.
- GitHub-Zugriff auf `Daniel-Braun123/A-KlassenHoizV2`.
- Für die lokale Standardentwicklung sind keine Produktions-Credentials erforderlich.

## 2. Greenfield-Bootstrap

Die spätere Scaffold-Aufgabe darf nur neue Dateien im V2-Repository erzeugen. Weder alter Anwendungscode noch alte Migrationen werden kopiert, gepullt oder als Vorlage importiert.

Geplante Reihenfolge:

```powershell
npm ci
npx supabase start
npx supabase db reset
npm run db:test
npm run dev
```

`supabase db reset` bezeichnet hier ausschließlich die lokale Docker-Datenbank. Die Scripts müssen remote Ziele standardmäßig technisch ausschließen.

## 3. Geplante Abhängigkeiten

Produktionsbasis:

- `next@16.2.10`, `react@19.2.7`, `react-dom@19.2.7`;
- `typescript@6.0.3`, Strict Mode;
- `@supabase/supabase-js@2.110.2`, `@supabase/ssr@0.12.0`;
- `zod@4.4.3` für Action-/Formverträge, `tailwindcss@4.3.2` für tokenbasierte Styles und `qrcode@1.5.4` für die bedarfsweise geladene QR-Darstellung;
- kein globaler Client-State, kein PWA-Framework und keine UI-Komponentenbibliothek ohne belegten Bedarf.

Testbasis:

- `vitest@4.1.10`, `@testing-library/react@16.3.2`, `jsdom@29.1.1`;
- `supabase@2.109.1` + pgTAP;
- `@playwright/test@1.61.1` und `@axe-core/playwright@4.12.1`;
- `eslint@9.39.5` mit `eslint-config-next@16.2.10`, `@typescript-eslint/*@8.63.0`, `eslint-plugin-jsx-a11y@6.10.2`, `prettier@3.9.5` und `tsc --noEmit`.

Diese Patchstände sind die am 2026-07-13 fest gewählte Baseline und werden im Lockfile exakt fixiert. Änderungen erfolgen nur über einen dokumentierten Dependency-PR mit vollständigem Qualitätslauf. Preview-/Prerelease-Pakete sind ausgeschlossen.

## 4. Umgebungsvariablen

Vorgesehene lokale Variablen:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
SUPABASE_SECRET_KEY=<nur falls ein server-only Adminablauf lokal getestet wird>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `.env*` wird nicht committed; nur eine wertlose `.env.example` mit Namen/Erklärungen.
- Browsercode darf nur `NEXT_PUBLIC_SUPABASE_URL`, Publishable Key und nicht-sensitive Site-Konfiguration sehen.
- Production-, Preview- und Development-Werte werden in Vercel getrennt gepflegt. Preview zeigt nie auf das Produktionsprojekt.

## 5. Lokale Datenbank

Die spätere Implementierung erstellt ausschließlich neue Dateien unter `supabase/migrations/`. Ein `supabase db pull` vom Altbestand ist verboten.

Ein lokaler Verifikationslauf muss:

```powershell
npx supabase db reset
npx supabase db lint
npx supabase test db
```

erfolgreich bestehen und danach generierte TypeScript-Typen auf einen sauberen Git-Status prüfen. Seeds enthalten nur synthetische V2-Testdaten und niemals exportierte Produktionsdaten.

## 6. Standard-Qualitätslauf

Vorgesehene Scripts:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:db
npm run build
npm run test:e2e
npm run test:pwa
npm run test:performance:lab
```

E2E und Performance-Labor starten den gepinnten Production Build. Das Lighthouse-Mobile-Labor
verwendet die Konfiguration aus `contracts/quality-contract.md`, drei kalte isolierte Läufe je
kritischer Route und wertet den Median aus. Es erhebt keine RUM-Daten. Der CI-Lauf verwendet einen
Worker, eindeutige Test-IDs und erzeugt bei Fehlern Playwright-Trace, Screenshot und Report ohne
geheime/private Inhalte.

Erwartetes Ergebnis: Alle Befehle enden mit Exitcode 0; der lokale Datenbanklauf rekonstruiert ausschließlich das V2-Schema, alle RLS-Negativtests verweigern den Zugriff, der Production Build enthält keine Secret-Werte und die Browser-/PWA-Reports weisen keine offenen blockierenden Befunde aus.

## 7. Manuelle Abnahme

Vor Merge/Release werden zusätzlich geprüft:

1. 320/375 px, Tablet und Desktop ohne horizontales Seiten-Scrolling;
2. Keyboard-only und sichtbarer/nicht verdeckter Fokus;
3. 200 % Text, 400 % Zoom/320-px-Reflow und High Contrast;
4. NVDA + Chrome sowie VoiceOver + Safari/iOS;
5. reduzierte Bewegung;
6. echte PWA-Installation/Standalone auf Android Chrome, Desktop Chromium und iOS Safari;
7. Offline-/Updateverhalten ohne falsche Tippbestätigung;
8. kritische Journey aus `contracts/quality-contract.md`;
9. moderiertes Usability-Protokoll mit mindestens fünf ungeschulten repräsentativen Personen,
   iOS-/Android-Mix und mindestens einem Desktop-Test;
10. fachlich freigegebene Betreiberangaben, Datenflüsse, Dienstleister, Aufbewahrungsregeln,
    Impressum und Datenschutzerklärung; keine erfundenen Angaben.

Erwartetes Ergebnis: Alle Schritte sind auf der vereinbarten Gerätematrix nachvollziehbar bestanden und in der Release-Checkliste mit Gerät/Browser, Datum und Prüfer dokumentiert; ein automatischer Axe-Lauf allein gilt nicht als WCAG-Abnahme.

## 8. Vercel-Verbindung — spätere separate Aufgabe

1. Bestehendes Vercel-Projekt im Dashboard eindeutig durch Projekt-ID, Team, Domain und aktuellen Git-Link identifizieren.
2. Settings/Variablennamen und Scopes inventarisieren, niemals Secret-Werte in Artefakte schreiben.
3. Branch Protection und grünen V2-Build sicherstellen.
4. Altes Repository kontrolliert trennen, `Daniel-Braun123/A-KlassenHoizV2` verbinden, Root/Framework/Production Branch prüfen.
5. Geschützten Preview-Deploy erzeugen und gegen isoliertes Nicht-Produktiv-Backend abnehmen.
6. Production-Domain erst nach Supabase-Neuschema, vollständigen Gates und expliziter Umschaltfreigabe umlegen.

Im aktuellen Planungsumfeld war weder Vercel CLI noch Vercel Connector verfügbar; Schritt 1 ist deshalb zwingend und darf nicht geraten werden.

## 9. Remote-Supabase-Reset — harte Sperre

Zielprojekt für eine spätere Freigabe: `A-KlassenHoiz`, Ref `ewqzhdnfoozjzenzmtlm`, `eu-central-1`.

Ohne eine neue, ausdrückliche Freigabe dürfen insbesondere nicht ausgeführt werden:

```text
supabase db reset --linked
supabase db push
supabase migration repair
DROP / TRUNCATE gegen Remote
Auth-Admin-Löschungen
Storage-Löschungen
Projekt-/Auth-/API-Konfigurationsänderungen
```

Die spätere Aufgabe muss mindestens zwei getrennte Reset-/Rollout-Bestätigungen enthalten:

- **Freigabe A – Altbestand löschen**: verifizierte Backups/Exporte, exakte Allowlist, zwei Auth-Nutzer und Sitzungen ausdrücklich im Scope, Plattformschemas geschützt, Restore getestet.
- **Freigabe B – V2 ausrollen**: Leere/Projektgesundheit bestätigt, ausschließlich neue Migrationen geprüft, neuer Storage-/Auth-/API-Setup planbar, Rollbackpunkt benannt.

Nach Freigabe B bleiben folgende Produktionsschritte getrennt und jeweils neu freizugeben:

1. ersten App-Admin provisionieren;
2. synthetische Smoke-Testidentitäten und -daten anlegen;
3. Produktionstest durchführen;
4. sämtliche synthetischen Daten und Testkonten entfernen;
5. Bereinigung read-only verifizieren.

Jede mutierende Freigabe nennt Operator und betroffene Identitäten, exakten Datenumfang,
Testzweck, erforderliche anschließende Löschung und Verifikationsweg. Keine dieser Freigaben liegt
durch dieses Dokument vor.

Der aktuelle Plan erteilt weder A noch B.

## 10. Definition of Ready für `/speckit-tasks`

- `plan.md`, `research.md`, `data-model.md`, `contracts/*` und dieses Quickstart sind konsistent.
- Keine Verfassungsausnahme und keine offene Architekturentscheidung ist vorhanden.
- Reset, Remote-Migration, privilegierte Produktionsidentität, synthetische Datenanlage,
  Produktionstest, Daten-/Kontenbereinigung, Bereinigungsnachweis und Vercel-Umschaltung erscheinen
  später als getrennte, ausdrücklich freizugebende Tasks.
- Implementierungstasks dürfen erst lokale/Preview-Arbeit planen; Remote-Löschung und Production-Cutover stehen hinter eigenen Gates.
