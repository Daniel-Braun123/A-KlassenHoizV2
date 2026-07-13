# Phase 0 Research: Vollständiger Neubau von A-KlassenHoiz

**Stand**: 2026-07-13  
**Basis**: `docs/PRD.md` 1.1, `spec.md`, Projektverfassung 2.0.0 und ausschließlich aktuelle Primärquellen  
**Grenze**: Diese Recherche hat weder Anwendungscode erzeugt noch Supabase-, Vercel- oder Produktionsdaten verändert.

## 1. Laufzeit und Framework

### Entscheidung

- Node.js `24.18.0` LTS, Next.js `16.2.10`, React `19.2.7` und TypeScript `6.0.3` mit `strict: true` bilden die fest gewählte Baseline.
- Alle unten aufgeführten Versionen werden beim späteren Scaffold exakt im Lockfile festgeschrieben. Ein Security-Update ändert die Baseline nur über einen geprüften Dependency-PR mit vollständigem Qualitätslauf.
- Next.js App Router und React Server Components sind Standard. Client Components bleiben auf kleine Interaktionsgrenzen wie Tipp-Autosave, Dialoge, QR-Anzeige, Installations- und Online-/Offline-Status begrenzt.
- TypeScript 7 wird erst in einer eigenen Dependency-Aufgabe übernommen, wenn Next.js, ESLint, Testwerkzeuge und alle Compiler-API-Konsumenten nachweislich kompatibel sind.

### Begründung und verworfene Alternativen

Next.js 16 ist Active LTS; 16.2 ist die stabile Linie, während 16.3 zum Recherchezeitpunkt Preview ist. Node 24 ist LTS. TypeScript 7 ist zwar stabil, die unmittelbar nach Veröffentlichung noch eingeschränkte Compiler-API-Kompatibilität macht TypeScript 6.0.3 für den Greenfield-Start risikoärmer. Pages Router, eine clientlastige SPA und Next-Preview-Versionen wurden wegen unnötiger Clientlast beziehungsweise fehlender Produktionsstabilität verworfen.

Quellen: [Node.js Releases](https://nodejs.org/en/about/previous-releases), [Next.js 16.2](https://nextjs.org/blog/next-16-2), [Next.js Support Policy](https://nextjs.org/support-policy), [React Versions](https://react.dev/versions), [TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

### Fest gepinnte Dependency-Baseline

| Bereich | Version |
|---|---|
| Node.js / npm | `24.18.0` / `11.18.0` |
| Next.js / React / React DOM | `16.2.10` / `19.2.7` / `19.2.7` |
| TypeScript / Node-/React-Typen | `6.0.3` / `@types/node 24.13.3` / `@types/react 19.2.17` / `@types/react-dom 19.2.3` |
| Supabase Client / SSR / CLI | `2.110.2` / `0.12.0` / `2.109.1` |
| Zod / Tailwind CSS / QR-Code | `4.4.3` / `4.3.2` / `qrcode 1.5.4` + `@types/qrcode 1.5.6` |
| Vitest / RTL / jsdom | `4.1.10` / `16.3.2` / `29.1.1` |
| Playwright / Axe Playwright | `1.61.1` / `4.12.1` |
| ESLint / Next config / TS-ESLint / JSX-A11y | `9.39.5` / `16.2.10` / `8.63.0` / `6.10.2` |
| Prettier | `3.9.5` |

Die Baseline nutzt bewusst ESLint 9 statt 10, weil `eslint-plugin-jsx-a11y 6.10.2` zum Planungszeitpunkt ESLint 10 noch nicht als Peer unterstützt. Paketstände wurden zusätzlich gegen das offizielle npm-Registry-Metadatum geprüft; das spätere Lockfile ist die reproduzierbare Lieferquelle.

## 2. Next.js Sicherheits- und Datenzugriffsmodell

### Entscheidung

- Server Components lesen über eine `server-only` markierte Data-Access-/Application-Service-Schicht.
- Eigene UI-Mutationen verwenden Server Actions; Route Handlers sind Auth-Callbacks und echten HTTP-Verträgen vorbehalten.
- Jede Server Action wird wie ein öffentlicher POST-Endpunkt behandelt: Schema validieren, Sitzung verifizieren, objektbezogen autorisieren, Fachinvarianten prüfen und nur minimale DTOs zurückgeben.
- UI-Ausblendung, Layout-Guards und Middleware/Proxy sind Komfort- und Frühabweisungsmechanismen, aber keine Autorisierungsgrenze.
- Unabhängige Datenabfragen starten parallel; Suspense-Grenzen liegen auf fachlich sinnvollen Sektionen. Es gibt keinen internen HTTP-Umweg zwischen Server Components und der Datenschicht.

### Begründung und verworfene Alternativen

Server-first Rendering minimiert serialisierte Daten und Client-JavaScript. Server Actions sind direkt aufrufbar und benötigen deshalb dieselben Authentifizierungs-, Autorisierungs- und Validierungsregeln wie andere Endpunkte. Ein generischer Repository-Layer und globale Client-State-Bibliotheken werden nicht vorab eingeführt; sie würden ohne belegten Bedarf Abstraktion und Bundlegröße erhöhen.

Quellen: [Next.js App Router](https://nextjs.org/docs/app), [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security), [`use server` Security](https://nextjs.org/docs/app/api-reference/directives/use-server), [Authentication](https://nextjs.org/docs/app/guides/authentication).

## 3. Supabase Auth und SSR

### Entscheidung

- `@supabase/ssr` stellt getrennte Browser- und Server-Clients mit Cookie-Sitzungen bereit.
- Der Next.js Proxy aktualisiert ablaufende Tokens. Serverseitige Identität wird mit `getClaims()` verifiziert; ein ungeprüftes `getSession()`-Userobjekt ist nie Autorisierungsgrundlage.
- Normale Nutzeraktionen laufen mit Publishable Key und Benutzer-JWT, damit `auth.uid()` und RLS gelten. Secret-/Service-Role-Schlüssel bleiben ausschließlich serverseitigen, eng begrenzten Betriebsabläufen vorbehalten.
- Registrierung und Anmeldung verwenden E-Mail/Passwort. „Confirm email“ wird in einer später ausdrücklich autorisierten Konfigurationsaufgabe deaktiviert; Passwort-Reset bleibt aktiv.
- Rollen stammen aus der Datenbank, nicht aus E-Mail, `user_metadata` oder allein aus potenziell veralteten JWT-Metadaten.

### Begründung und verworfene Alternativen

Das Modell hält Supabase-Sitzungen SSR-fähig und verbindet serverseitige Autorisierung mit RLS. Service Role für normale Server Actions wurde verworfen, weil sie RLS umgeht und einen Fehler in der Anwendungsschicht unmittelbar privilegiert machen würde.

Quellen: [Supabase SSR Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Next.js Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs), [Password Auth](https://supabase.com/docs/guides/auth/passwords), [Secure Data](https://supabase.com/docs/guides/database/secure-data).

## 4. Datenbank- und Data-API-Grenze

### Entscheidung

- Ein neues, nicht exponiertes Schema `app` enthält Domänentabellen; ein nicht exponiertes Schema `private` enthält privilegierte Hilfsfunktionen und Token-/Auditdetails.
- Nur das schmale Schema `api` wird über die Supabase Data API exponiert. Es enthält explizit freigegebene `security_invoker`-Views und RPC-Wrapper.
- Alle Domänentabellen erhalten RLS, auch wenn sie nicht direkt exponiert sind. Grants und RLS werden unabhängig minimal definiert und getestet; es gibt keine breiten Default-Grants.
- Funktionen sind standardmäßig `SECURITY INVOKER`. Eine `SECURITY DEFINER`-Funktion ist nur für eng begrenzte Abläufe wie anonyme Einladungsvorschau oder kontrollierte Anonymisierung zulässig, nutzt `search_path = ''`, vollständig qualifizierte Namen, entzogenes `PUBLIC`-Execute und eigene Auth-/Fachprüfungen.
- Views sind ausschließlich `security_invoker = true`. Policy-Spalten und Fremdschlüssel werden gezielt indiziert; RLS-Prädikate verwenden `(select auth.uid())`.

### Begründung und verworfene Alternativen

Die Schema-Trennung reduziert die über die Data API erreichbare Fläche und behält RLS als zweite Schutzschicht. Eine vollständig exponierte `public`-Domäne und pauschale Grants wurden verworfen. Definer-Funktionen als allgemeiner Datenzugriff wurden ebenfalls verworfen, weil sie RLS leicht unbeabsichtigt umgehen.

Quellen: [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api), [Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Functions](https://supabase.com/docs/guides/database/functions), [Supabase Data-API Grants Change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## 5. Serverseitige Tippfrist und Autosave

### Entscheidung

- Der Browser sendet erst bei zwei syntaktisch gültigen Torwerten eine debouncte, pro Spiel serialisierte Autosave-Anfrage mit Idempotenzschlüssel.
- Die Server Action validiert und autorisiert; die kanonische RPC sperrt die Spielzeile und prüft danach mit PostgreSQL `clock_timestamp() < kickoff_at`, ob die Frist offen ist.
- Ein Unique Constraint auf `(round_id, membership_id, match_id)` und ein kontrollierter Upsert machen Wiederholungen idempotent.
- Direktes Schreiben in die Tipp-Tabelle wird nicht exponiert. Die RPC bestätigt den gespeicherten Stand samt Serverzeit; erst dann zeigt die UI „gespeichert“.
- Offline gibt es keine Mutationswarteschlange. Eine fehlgeschlagene Eingabe bleibt nur im aktuellen UI-Zustand und kann nach Wiederverbindung erneut gesendet werden; die DB-Frist entscheidet erneut.

### Begründung und verworfene Alternativen

Die Datenbankzeit in derselben Transaktion verhindert Manipulation durch Client- oder Vercel-Uhr und schließt Rennen mit einer Anstoßverschiebung. Rein clientseitige Deadline-Prüfung, Offline-Synchronisierung und ein Spieltag-Sammelspeicher wurden verworfen.

Quellen: [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html), [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html).

## 6. Deterministische Wertung und Ranglisten

### Entscheidung

- Eine kanonische, unveränderliche und reine PostgreSQL-Funktion berechnet 4/3/2/0: exaktes Ergebnis zuerst, dann gleiche Tordifferenz, dann gleiche Tendenz, sonst null. Jedes nicht exakte Unentschieden fällt dadurch in die 3-Punkte-Regel.
- Ergebnisanlage/-korrektur, Revisionsaudit und Neuberechnung aller Wertungen eines Spiels laufen atomar mit Row Lock und idempotentem Upsert.
- Persistiert werden nur Einzelwertungen mit Berechnungsversion und Ergebnisrevision. Gesamt- und Spieltagsranglisten werden aus diesen kanonischen Wertungen aggregiert, nicht als veränderbare Summen dupliziert.
- Rang `rank()` basiert ausschließlich auf Punkten absteigend; die Anzeige innerhalb gleicher Punkte ist nickname-alphabetisch, ohne den gemeinsamen Rang zu verändern.
- Eine geschützte vollständige Rebuild-RPC dient ausschließlich der verifizierten Recovery und muss dasselbe Ergebnis liefern.

### Begründung und verworfene Alternativen

Eine einzige kanonische DB-Funktion vermeidet divergierende TypeScript- und SQL-Implementierungen und lässt sich als reine Funktion mit pgTAP vollständig testen. Separate mutable Gesamtstände und eine zweite Bewertungsimplementierung im Client wurden verworfen.

Quellen: [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html).

## 7. Besitzer-, Einladungs- und Datenschutzinvarianten

### Entscheidung

- Mitgliedschaften kennen nur `owner` und `member`; ein partieller Unique Index erlaubt höchstens einen aktiven Owner. Ein deferrable Integritätscheck koppelt den verpflichtenden `owner_membership_id` der Runde an genau diese aktive Mitgliedschaft.
- Runde plus Erstbesitzer, Besitzertransfer, Beitritt, Entfernen, Austritt und Kontolöschung sind jeweils transaktionale Fachoperationen. Direkte Tabellenmutationen sind nicht Teil der API.
- Einladungen verwenden 256 Bit Zufall; gespeichert wird nur SHA-256. Pro Runde ist höchstens eine Einladung aktiv. QR-Code und Link enthalten das Klartext-Token nur bei Erzeugung beziehungsweise im Clientkontext.
- Bei Kontolöschung werden Mitgliedschaften von der Auth-Identität gelöst und erhalten je Runde einen stabilen, zufälligen anonymen Platzhalter. Tipps und Wertungen bleiben unverändert. Ein `deletion_pending`-Status sperrt bei einem Fehler zwischen Domänentransaktion und Auth-Admin-Löschung jeden weiteren Zugriff und erlaubt idempotente Wiederholung.
- Archivieren ist der reversible Rundenpfad. Der bestätigte Hard Delete entfernt in einer
  Transaktion Tipps, Wertungen, Mitgliedschaften, Einladungen und Runde, lässt globale Daten und
  Nutzerkonten bestehen und schreibt nur ein minimales PII-freies Audit mit nicht sprechender ID.
- Break-Glass erzeugt für genau einen Fall und eine Runde eine kurzlebige, read-only Freigabe auf
  einen expliziten Support-Metadatenumfang mit Pflichtbegründung. Freigabe und jeder Zugriff werden
  append-only protokolliert. Prediction-Tabellen, E-Mail-Adressen, Listen, Exporte und Mutationen
  sind vom Vertrag ausgeschlossen.

### Begründung und verworfene Alternativen

Constraints und kontrollierte Operationen sichern die fachliche Invariante auch bei Parallelität. Klartext-Tokens, Co-Admin-Rollen, eine allgemein privilegierte Supportansicht und Löschung historischer Wertungen wurden verworfen.

## 8. Storage

### Entscheidung

- Ein öffentlicher Bucket `club-logos` enthält ausschließlich unkritische Vereinslogos. Lesen ist öffentlich; Erzeugen, Ersetzen und Löschen dürfen nur App-Admins über kontrollierte Abläufe.
- Zulässige Formate sind PNG, WebP und AVIF mit festem Größenlimit; SVG-Uploads und beliebige MIME-Typen sind ausgeschlossen. Versionierte Objektpfade vermeiden Cache-Inkonsistenz.
- Storage-Policies, MIME-/Größenregeln und negative Schreibtests gehören zur RLS-Suite. Private Nutzerinhalte werden nicht im Bucket gespeichert.

### Begründung und verworfene Alternativen

Die Logos sind globale, nicht personenbezogene Inhalte und profitieren von öffentlichem CDN-Caching. Ein privater Bucket würde Signatur- und Cachekomplexität ohne Datenschutzgewinn erzeugen. SVG-Uploads werden wegen aktiver Inhalte nicht ungeprüft zugelassen.

Quellen: [Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control).

## 9. PWA und Caching

### Entscheidung

- `app/manifest.ts` erzeugt das Manifest. Ein kleiner eigener Service Worker precacht nur versionierte öffentliche Shell-Assets und eine Offline-Fallbackseite; Navigation ist network-first.
- Supabase-Antworten, Auth-Routen, RSC-Payloads, private HTML-Seiten, Tipprunden-, Tipp- und Ranglistendaten werden nie persistent durch den Service Worker gecacht.
- Der Service Worker wird mit restriktiver CSP, korrektem MIME und ohne langlebigen HTTP-Cache ausgeliefert. Updates werden sicher erkannt und erst nach verständlicher Nutzeraktion aktiviert.
- Installation wird nicht allein von `beforeinstallprompt` abhängig gemacht. Standalone-/Installationsverhalten wird auf realem Android Chrome, Desktop Chromium und iOS Safari geprüft.

### Begründung und verworfene Alternativen

Das erfüllt Installierbarkeit und verständliches Offline-Verhalten, ohne private Daten oder fristgebundene Mutationen zu persistieren. Serwist wurde für die Baseline nicht gewählt, weil der aktuelle dokumentierte Next.js-Integrationsweg noch Webpack voraussetzt, während Next 16 Turbopack standardmäßig nutzt.

Quellen: [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [Web App Manifest](https://www.w3.org/TR/appmanifest/), [PWA Checklist](https://web.dev/articles/pwa-checklist).

## 10. Designsystem, Accessibility und Performance

### Entscheidung

- Design Tokens folgen der stabilen DTCG-Struktur Foundation → semantische Rollen → sparsame Component Tokens und werden als CSS Custom Properties ausgegeben. Enthalten sind Farbe, Typografie, Abstand, Radius, Schatten, Ebenen, Motion und Zustände.
- Der visuelle Ausgangspunkt ist ein zurückhaltendes, kontrastgeprüftes grünes Primärsystem (`oklch(0.600 0.130 160)` als Seed, nicht als ungeprüfte Textfarbe). Exakte Paare werden gegen WCAG 2.2 validiert.
- Native HTML-Primitives bilden die Basis. Jede Komponente dokumentiert Default, Hover, Focus, Active, Disabled, Loading, Error und Reduced Motion. Touch-Ziele sind intern mindestens 44 × 44 CSS-Pixel.
- Automatisierte Prüfungen werden durch Keyboard-, Zoom/Reflow-, Screenreader-, High-Contrast- und Real-Device-Prüfungen ergänzt.
- V1 erhebt weder RUM noch Produktanalytics und besitzt kein p75-Feldgate. Das reproduzierbare
  Lighthouse-Mobile-Laborgate verwendet einen gepinnten Production Build, mobile Emulation
  360×640/DPR 2,625, simulierte 150-ms-RTT-/1.638,4-Kbit/s-/CPU×4-Drosselung, kalten Cache und drei
  isolierte Läufe je kritischer Route. Der Median muss Performance ≥ 90, LCP ≤ 2,5 s, CLS ≤ 0,1
  und TBT ≤ 200 ms erfüllen. `next/font`, `next/image`, kleine Client-Grenzen und dynamische Imports
  für schwere optionale Interaktionen bleiben verbindlich.

### Begründung und verworfene Alternativen

Ein tokenisiertes, semantisches System verhindert visuelle Drift und macht Zustände testbar. Ad-hoc-Werte, Runtime-CSS-in-JS, Farbe als alleiniger Bedeutungsträger und selbst erfundene ARIA-Widgets wurden verworfen.

Quellen: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/), [DTCG Format 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), [Core Web Vitals](https://web.dev/articles/vitals), [Next.js CSS](https://nextjs.org/docs/app/getting-started/css).

## 11. Testpyramide und CI

### Entscheidung

- Vitest + React Testing Library + jsdom testen reine TypeScript-Logik, synchrone Komponenten und Application Services. Async Server Components werden E2E statt künstlich unit-getestet.
- Ein lokaler Supabase-Stack wird ausschließlich aus neuen Migrationen aufgebaut. pgTAP prüft Schema, Constraints, kanonische SQL-Funktionen, Grants, Views, RPCs und jede RLS-Akteursmatrix; Vitest prüft App-zu-Supabase-Integrationen.
- Playwright-Projekte: Desktop Chromium, Firefox, WebKit, Mobile Chrome und Mobile Safari. Kritische Flows laufen blockierend; Service-Worker-Prüfungen laufen wegen Browserunterstützung in Chromium. E2E verwendet `next build` + `next start`.
- `@axe-core/playwright` prüft WCAG-Tags einschließlich `wcag22aa`; manuelle Accessibility-Abnahme bleibt verpflichtend.
- Required Checks: Format/Lint/Strict Types, Vitest/Coverage, lokaler DB-Neuaufbau + Lint + pgTAP/RLS, Production Build, Playwright/Axe/PWA und erfolgreicher geschützter Vercel-Preview-Smoke.
- Remote-Supabase-Reset und Produktionsumschaltung sind niemals automatisch erreichbare CI-Jobs.

### Begründung und verworfene Alternativen

Die Kombination prüft pure Logik, echte Policies, Integration und sichtbares Verhalten. Nur E2E, nur App-Tests oder nur ein Vercel-Build würden wichtige Fehlerklassen auslassen.

Quellen: [Next.js Vitest](https://nextjs.org/docs/app/guides/testing/vitest), [Supabase Testing](https://supabase.com/docs/guides/local-development/testing/overview), [Supabase CLI Testing](https://supabase.com/docs/guides/local-development/cli/testing-and-linting), [Playwright Projects](https://playwright.dev/docs/test-projects), [Playwright CI](https://playwright.dev/docs/ci), [Playwright Accessibility](https://playwright.dev/docs/accessibility-testing).

## 12. Vercel, GitHub und Umgebungen

### Entscheidung

- Das bestehende Vercel-Projekt bleibt erhalten und wird erst in einer kontrollierten Deployment-Aufgabe vom alten Repository getrennt und mit `Daniel-Braun123/A-KlassenHoizV2` verbunden.
- `main` ist Production Branch; Pull Requests erhalten geschützte Previews. Production, Preview und Development verwenden getrennte Variablenscopes und getrennte Backenddaten.
- Previews dürfen nie das Produktions-Supabase-Projekt oder dessen Secret Key verwenden. Sie erhalten einen isolierten, nicht produktiven Supabase-Branch/ein separates Staging-Projekt nach eigener Infrastrukturfreigabe; ohne diese Freigabe bleiben Previews build-/mockbasiert.
- Browserseitig existieren nur Supabase URL und Publishable Key mit `NEXT_PUBLIC_`; Geheimnisse bleiben server-only. Preview-Automation verwendet bevorzugt kurzlebige OIDC-Vertrauensbeziehungen.
- Branch Protection verhindert direkte/erzwungene Main-Änderungen und verlangt alle Qualitätsgates.

### Begründung und verworfene Alternativen

Das vorhandene Projekt bewahrt Domain- und Deploymentkontinuität. Ein neues Vercel-Projekt sowie Previewtests gegen Produktionsdaten wurden verworfen. Die konkrete Vercel-Projekt-ID konnte in dieser Planung nicht read-only verifiziert werden, weil weder Connector noch lokale CLI verfügbar waren; ihre Verifikation ist deshalb ein verpflichtender erster Schritt der späteren Deployment-Aufgabe.

Quellen: [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github), [Vercel Environments](https://vercel.com/docs/deployments/environments), [Environment Variables](https://vercel.com/docs/environment-variables), [Trusted Sources](https://vercel.com/changelog/trusted-sources-for-deployment-protection), [GitHub Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## 13. Bestehendes Supabase-Projekt und kontrollierte Bereinigung

### Read-only verifizierter Istzustand

- Projekt: `A-KlassenHoiz`, Ref `ewqzhdnfoozjzenzmtlm`, Region `eu-central-1`, Status `ACTIVE_HEALTHY`, PostgreSQL 17.
- Altbestand: 12 `public`-Tabellen, vier alte Migrationen, zwei Auth-Benutzer, keine Storage-Buckets und keine Edge Functions.
- Dieser Bestand ist ausschließlich Löschinventar. Keine Tabelle, Funktion oder Migration ist Vorlage für das neue Schema.

### Entscheidung

Der Remote-Reset ist eine separate, manuell freizugebende Betriebsaufgabe mit zwei getrennten
Freigaben: (A) Altbestand löschen, (B) neue Migrationen ausrollen. Vor A sind Projektref,
vollständiges Objektinventar, Storage-/Secret-/Hook-Inventar, Downtime, Lösch-Allowlist,
Verantwortliche und Sicherungs-/Restoreentscheidung dokumentiert. Für die am 13. Juli 2026
freigegebene einmalige Altbestandslöschung hat der Projekteigentümer Backup, Export und Restore
ausdrücklich abgewählt und den unwiederbringlichen Verlust akzeptiert. `auth`- und
`storage`-Plattformschemas werden nicht gedroppt. Auth-Benutzer, Sitzungen und App-Objekte werden in
einer allowlistbasierten Transaktion gelöscht; der bestätigte Altbestand enthält keine
Storage-Objekte. Ein pauschales `supabase db reset --linked` ist kein freigegebener Ein-Klick-Ersatz.

Nach A wird die Leere/Plattformgesundheit geprüft. Erst nach B werden ausschließlich die neuen
Migrationen angewendet und RLS/Grants geprüft. Danach folgen fünf getrennte Betriebsschritte:
ersten App-Admin provisionieren, synthetische Smoke-Identitäten/-daten anlegen, Produktionstest
ausführen, sämtliche synthetischen Daten und Testkonten entfernen und die Bereinigung read-only
verifizieren. Jeder mutierende Schritt benötigt eine eigene ausdrückliche Freigabe mit Identitäten,
Datenumfang, Testzweck und Löschpflicht. Jeder Fehler stoppt vor dem nächsten Gate. Beim einmaligen
No-Backup-Reset ist nur eine dokumentierte Vorwärtsinitialisierung möglich; spätere Mutationen
benötigen wieder reguläre Rollback-/Restorepfade.

Quellen: [Supabase DB Reset](https://supabase.com/docs/reference/cli/supabase-db-reset), [Backups](https://supabase.com/docs/guides/platform/backups), [Delete Storage Objects](https://supabase.com/docs/guides/storage/management/delete-objects), [Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data).
