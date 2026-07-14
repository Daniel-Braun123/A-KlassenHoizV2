# Supabase V2-Verifikation

## Ergebnis 2026-07-14: BESTANDEN

Verifiziert: 51/51 Migrationen; 15/15 `app`-Tabellen mit RLS und Force RLS; 16/16 API-Views mit
`security_invoker`; 20 Policies; Bucket `club-logos`, öffentlich lesbar, 0 Objekte; Auth-Signup
aktiv, Autoconfirm aktiv, anonymes Signup aus. Security-Advisor-Warnungen zu bewusst aufrufbaren,
intern autorisierenden `SECURITY DEFINER`-RPCs und öffentlichem Logo-Listing wurden gegen die
Negativtests bewertet. Der vollständig bereinigte Production-Smoke bestätigte die Trust-Grenzen.

**Aufgabe:** T277  
**Stand:** 2026-07-14  
**Status:** VORBEREITET – NICHT AUSGEFÜHRT

T277 ist eine read-only Nachkontrolle unmittelbar nach T276. Sie erstellt keine Nutzer oder
Testdaten, verändert keine Konfiguration und repariert keine Migration. Ein fehlendes oder
abweichendes Ergebnis beendet den Rollout als nicht bestanden.

## 1. Ziel und Migrationshistorie

Bestätigen: `A-KlassenHoiz` / `ewqzhdnfoozjzenzmtlm` / `eu-central-1`, Status
`ACTIVE_HEALTHY`, erwartete PostgreSQL-Hauptversion und exakt der freigegebene Commit.

```powershell
npx supabase migration list --linked --workdir <rollout-workdir>
npx supabase db push --linked --dry-run --workdir <rollout-workdir>
```

Erwartet werden 51 identische lokale/Remote-Timestamps und „Linked project is up to date“. Erster
Timestamp ist `20260713000100`, letzter `20260713192003`. Jeder fehlende, zusätzliche oder nur
remote vorhandene Timestamp ist ein Stop-Befund.

## 2. Schema, Grants und RLS

Read-only SQL beziehungsweise der Supabase Connector muss nachweisen:

- ausschließlich die erwarteten neuen Schemas `app`, `private` und exponiert `api`; `public`
  enthält keine neue fachliche API;
- alle fachlichen Tabellen besitzen RLS und Force RLS wie in den lokalen Security-Tests;
- `anon` und `authenticated` besitzen nur die expliziten Minimal-Grants auf freigegebene
  `api`-Read-Models/RPCs und keine direkte breite DML auf `app` oder `private`;
- alle exponierten Views laufen mit `security_invoker = true`;
- privilegierte Funktionen liegen nicht ungeschützt in einem exponierten Schema, besitzen einen
  gehärteten `search_path`, und `PUBLIC` hat kein unbeabsichtigtes `EXECUTE`;
- Constraints, FK-Indizes, Unique-/Partial-Indizes und Trigger entsprechen dem lokal geprüften
  Migrationsstand.

Die lokalen pgTAP-Security-, RLS- und Storage-Suites sind die Sollmatrix; Remote wird kein Test-
Seed benötigt. Typen dürfen read-only aus `api,app` generiert und außerhalb des Repositories mit
dem freigegebenen Typstand verglichen werden. Ein Typdiff ist ein Stop-Befund, keine Erlaubnis zum
Überschreiben.

## 3. Storage

Read-only prüfen:

| Feld                     | Erwartung                                                 |
| ------------------------ | --------------------------------------------------------- |
| Bucket                   | genau `club-logos`                                        |
| öffentlich lesbar        | ja                                                        |
| maximale Objektgröße     | 2 MiB / `2097152` Byte                                    |
| MIME-Typen               | `image/png`, `image/jpeg`, `image/webp`                   |
| Schreiben/Ändern/Löschen | nur authentifizierter App-Admin gemäß RLS und Pfadvertrag |
| Objekte nach T276        | 0                                                         |

Es erfolgt kein Testupload gegen Production. Storage-Upsert-Rechte müssen in der lokalen Suite
über INSERT, SELECT und UPDATE vollständig belegt sein.

## 4. Auth und Data API

Die Management API wird ausschließlich mit GET/read-only verwendet; die Ausgabe wird auf sichere
Felder gefiltert und enthält weder Token noch Schlüssel.

Auth-Sollwerte:

- E-Mail-Signup aktiv und unmittelbare Sitzung ohne E-Mail-Bestätigung;
- anonyme Anmeldung deaktiviert;
- exakte kanonische Site-URL und ausschließlich freigegebene HTTPS-Redirects;
- keine localhost-, Wildcard-, alte Repository- oder unerwartete Preview-URL;
- erwartete Token-/Refresh-Rotation und Passwort-Mindestlänge.

PostgREST-Sollwerte:

- exponiertes Schema ausschließlich `api`;
- zusätzlicher Suchpfad ausschließlich wie freigegeben, insbesondere `extensions`;
- `max_rows = 1000`;
- keine automatische oder breite Exposition neuer `public`-/`app`-Objekte.

Offizielle read-only Endpunkte:

- <https://supabase.com/docs/reference/api/v1-get-auth-service-config>
- <https://supabase.com/docs/reference/api/v1-get-postgrest-service-config>

## 5. Plattform- und Sicherheitsprüfung

1. Supabase Security Advisor und Performance Advisor read-only ausführen. Kein ungelöster
   Security-Befund ist zulässig; Performance-Befunde werden vor T278 bewertet.
2. Bestätigen, dass keine Edge Function bereitgestellt wurde.
3. DB-, Auth-, Storage- und API-Logs für das T276-Zeitfenster auf Migrations-/Konfigurationsfehler
   prüfen, ohne PII, SQL-Credentials oder Token zu kopieren.
4. Auth-Nutzer, Sessions, Liga-/Runden-/Tippdaten und Storage-Objekte bleiben nach T277 jeweils
   leer. Solche Daten gehören erst in die getrennt freizugebenden Aufgaben T278–T282.
5. Production-Projekt, Region, Billing und Plattformschemas bleiben gesund und unverändert.

## Ergebnisprotokoll

Das spätere Ausführungsprotokoll enthält Zeitpunkt, Operator, Commit-SHA, Projektref, Migration-
Count, Prüfkategorien, Advisor-Status und bestanden/nicht bestanden – keine Secrets, E-Mails,
Tippinhalte oder private Rundennamen.

Bei vollständigem Erfolg wird T277 als bestanden dokumentiert und Freigabe B läuft aus. Bei jedem
Befund bleibt T277 offen, T278 ist blockiert, das Backend wird nicht als produktionsbereit
bezeichnet und es gilt der Vorwärtskorrekturpfad aus `07-v2-rollout.md`.
