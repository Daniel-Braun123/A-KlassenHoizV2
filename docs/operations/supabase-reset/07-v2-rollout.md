# Supabase V2-Rollout

## Ausführung 2026-07-14

Freigabe B wurde durch die anschließende umfassende Product-Owner-Freigabe bestätigt. Im isolierten
Rollout-Verzeichnis wurden exakt 51 V2-Migrationen ohne Seed, Rollenimport oder Altmigrationen auf
`ewqzhdnfoozjzenzmtlm` angewendet. Die Production-Konfiguration exponiert nur `api`, verwendet
`extensions`, aktiviert E-Mail-/Passwort-Signup ohne Bestätigung, deaktiviert anonyme Anmeldung und
setzt die Production-URL/Callback-Allowlist. Der nachfolgende Dry-Run meldete `up to date`.

**Aufgabe:** T276  
**Stand:** 2026-07-14  
**Status:** FREIGABE B ERTEILT – WEGEN OFFENER PREVIEW-GATES NICHT AUSGEFÜHRT

Diese Datei ist das Ausführungsrunbook für die spätere Produktionsmutation. Sie dokumentiert keine
bereits erfolgte Ausführung. Das Ziel ist ausschließlich `A-KlassenHoiz` /
`ewqzhdnfoozjzenzmtlm` / `eu-central-1`.

## Bestätigte Ausgangslage

- T274 bestätigte ein gesundes Projekt ohne alte Anwendungsobjekte, Auth-Nutzer, Storage-Objekte,
  Edge Functions oder Migrationseinträge.
- Die erneute read-only Prüfung am 14. Juli 2026 zeigte weiterhin eine leere Remote-
  Migrationshistorie und keine V2-Tabellen.
- Lokal liegen genau 51 neue Migrationen von
  `20260713000100_create_v2_schemas.sql` bis
  `20260713192003_apply_mutation_rate_limits.sql` vor.
- Freigabe B in `docs/operations/approvals/supabase-rollout-b.md` ist erteilt. Sie ersetzt weder die
  offenen Preview-Gates T263–T267 noch die unmittelbar vor Ausführung erforderliche Ziel- und
  Commitprüfung.

## Harte Voraussetzungen

T276 beginnt nur, wenn:

1. T263–T267 abgeschlossen und die Preview ausdrücklich abgenommen ist;
2. derselbe Commit lokal mit Reset, DB-Lint, allen pgTAP-/RLS-/Storage-Tests, Typecheck, Lint,
   Unit-/Integrations-/E2E-Gates und Production Build grün ist;
3. Projektref, Organisation, Region, Operator, Freigeber, Wartungsfenster und Commit-SHA erneut
   bestätigt sind;
4. die Remote-Migrationshistorie weiterhin leer und der V2-Ausgangszustand unverändert ist;
5. ein isoliertes Rollout-Arbeitsverzeichnis ausschließlich die 51 freigegebenen Migrationen und
   eine geprüfte Production-Konfiguration enthält.

Die normale Repository-Arbeitskopie bleibt unlinked. Der lokale Remote-Guard wird nicht gelockert.

## Production-Konfiguration vorab freigeben

`supabase/config.toml` ist local-only und darf nicht direkt gepusht werden. Vor T276 wird eine
separate Production-Konfiguration erstellt und feldweise freigegeben. Sie enthält mindestens:

- Data API: nur Schema `api`, zusätzlicher Suchpfad `extensions`, `max_rows = 1000`;
- Auth: E-Mail-/Passwort-Signup aktiv, E-Mail-Bestätigung deaktiviert, anonyme Anmeldung
  deaktiviert, Rotation und Passwortgrenze gemäß Plan;
- exakte kanonische HTTPS-Production-URL sowie nur die konkret benötigten, vertrauenswürdigen
  V2-Candidate-/Callback-URLs; keine Wildcards und kein localhost;
- keine lokalen Ports, Studio-/Mailpit-Einstellungen, lokale Seeds, Test-OTP, experimentelle
  Features oder im Repository gespeicherte Secrets.

Vor `config push` werden die aktuelle Auth- und PostgREST-Konfiguration per read-only Management
API in einem redigierten Snapshot erfasst. `config push` besitzt keinen Dry-Run. Deshalb sind
Config-Review, Sollwerttabelle und Vier-Augen-Freigabe das verbindliche Ersatzgate. Ein nur
vorübergehend für Smoke-Tests benötigter Redirect wird nach dem Cutover wieder entfernt.

Der Bucket `club-logos` samt 2-MiB-/MIME-/RLS-Regeln entsteht durch die V2-Migration. Es werden
keine Storage-Objekte hochgeladen.

## Exakter migrations-only Ablauf

Im isolierten Rollout-Arbeitsverzeichnis:

```powershell
npx supabase link --project-ref ewqzhdnfoozjzenzmtlm --workdir <rollout-workdir>
npx supabase migration list --linked --workdir <rollout-workdir>
npx supabase db push --linked --dry-run --workdir <rollout-workdir>
```

Die Liste muss Remote `0` und lokal genau die 51 erwarteten Timestamps zeigen. Der Dry-Run muss
genau diese 51 Dateien in aufsteigender Reihenfolge ankündigen. Jede Abweichung stoppt den Ablauf.

Erst dann darf unter der dokumentierten Freigabe B ausgeführt werden:

```powershell
npx supabase db push --linked --workdir <rollout-workdir> --yes
```

Verbotene Flags sind `--include-seed`, `--include-all` und `--include-roles`. Insbesondere wird
`supabase/seed.sql` nie nach Production übertragen; die Datei ist local-only und enthält feste
synthetische Testidentitäten. T276 legt keine Auth-Nutzer, App-Admins, Liga-Daten, Tipprunden,
Tipps oder Storage-Objekte an.

Nach erfolgreichem Schema-Push und erneuter Zielprüfung wird ausschließlich die freigegebene,
sanitisierte Production-Konfiguration angewendet:

```powershell
npx supabase config push --project-ref ewqzhdnfoozjzenzmtlm --workdir <rollout-workdir> --yes
```

Unmittelbar danach beginnt T277. Zwischen T276 und T277 erfolgen keine App-Admin-, Daten-, Vercel-
oder Cutover-Mutationen.

## Stop und Rollback

Sofort stoppen bei falschem Ziel, unerwarteten Remote-Migrationen, anderer Dateianzahl/-Prüfsumme,
einem nicht grünen lokalen Gate, einer localhost-/Preview-only-Production-Konfiguration,
Secret-Ausgabe oder einem Fehler in Migration beziehungsweise Config-Push.

- Ein fehlgeschlagener `db push` wird nicht wiederholt, bevor Remote-Historie und vorhandene
  Objekte read-only inventarisiert und die Ursache lokal reproduziert sind.
- Kein `migration repair`, kein Remote-Reset, keine Down-Migration und kein Löschen erfolgreicher
  Migrationseinträge. Datenbankkorrekturen erfolgen ausschließlich vorwärts über eine neue,
  lokal vollständig geprüfte Migration und benötigen eine aktualisierte Ausführungsfreigabe.
- Auth-/PostgREST-Konfiguration kann nur anhand des vorab erfassten redigierten Snapshots mit einer
  erneut geprüften Konfiguration zurückgestellt werden.
- Der vor T276 leere Zustand ist ein Kontrollanker, aber nach der ersten erfolgreichen Migration
  kein automatisch ausführbarer Rollback. Eine Rückkehr zu „leer“ wäre eine neue destruktive
  Operation mit eigener Freigabe.

Die Freigabe B läuft erst nach vollständig bestandener T277-Verifikation aus.
