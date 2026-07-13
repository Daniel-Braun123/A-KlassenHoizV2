# Supabase-Reset: destruktive Ausführung

**Aufgabe:** T273  
**Ausgeführt:** 2026-07-13, Wartungsfenster vor 14:58 Uhr MESZ  
**Status:** ERFOLGREICH COMMITTED  
**CLI:** Supabase CLI `2.109.1`, projektlokales Node.js `24.18.0`

## Ausführung

Die CLI war über den isolierten, von Git ignorierten Workdir `.tools/supabase-reset-cli` mit
`ewqzhdnfoozjzenzmtlm` verknüpft. Ausgeführt wurde ausschließlich die versionierte, allowlistbasierte
Datei `scripts/operations/supabase-reset-delete.sql` über `supabase db query --linked --file` mit
absolutem Dateipfad. Es wurde kein `supabase db reset --linked`, kein `db push` und keine Migration
ausgeführt.

Die erfolgreiche Transaktion meldete:

| Nachbedingung            |  Wert |
| ------------------------ | ----: |
| `public` Relationen      |     0 |
| `public` Funktionen      |     0 |
| `public` Enums           |     0 |
| Auth-Nutzer              |     0 |
| Auth-Identitäten         |     0 |
| Auth-Sitzungen           |     0 |
| Auth-Refresh-Tokens      |     0 |
| Storage-Buckets/-Objekte | 0 / 0 |
| alte Migrationseinträge  |     0 |

## Kontrollierte Fehlversuche

Vor dem erfolgreichen Commit gab es zwei fehlgeschlagene SQL-Versuche. PostgreSQL verweigerte
zunächst das Löschen einer von einem Tabellen-Trigger abhängigen Funktion und danach eines von vier
`private`-Helper-Funktionen abhängigen Enum-Typs. Beide Fehler traten innerhalb der geöffneten
Transaktion auf; die Verbindung wurde ohne Commit beendet. Unmittelbare read-only Kontrollen
bestätigten nach beiden Versuchen unverändert 12 Relationen, 6 öffentliche Funktionen, 7 Enums,
2 Nutzer, 7 Sitzungen, 2 Identitäten, 10 Refresh-Tokens und 4 Migrationen.

Die Ursache wurde jeweils minimal korrigiert: Tabellen vor ihren Triggerfunktionen löschen und das
vollständig inventarisierte Schema `private` mit seinen vier Helper-Funktionen vor den Enums
entfernen. Die endgültige Transaktion bestand anschließend alle internen Nachbedingungen und wurde
committed. Es gab zu keinem Zeitpunkt einen partiellen Löschzustand.

## Nicht verändert

Projekt, Region, Billing, Keys, Auth-/Mailer-/Redirect-/Provider-Konfiguration, Plattform-Schemas,
Erweiterungen, Plattformrollen, Vercel, GitHub und jede V2-Konfiguration blieben unverändert. Wegen
des ausdrücklich genehmigten No-Backup-Verzichts existiert kein Restore-Artefakt.
