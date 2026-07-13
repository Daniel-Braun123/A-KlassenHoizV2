# Supabase-Reset: Nachkontrolle

**Aufgabe:** T274  
**Prüfzeitpunkt:** 2026-07-13T14:58:13+02:00  
**Status:** BESTANDEN

## Unabhängige Prüfungen

1. Die Supabase CLI führte `scripts/operations/supabase-reset-verify.sql` read-only gegen das
   verknüpfte Projekt aus.
2. Der Supabase Connector wiederholte die Zählerabfrage unabhängig von der CLI.
3. Der Connector prüfte Projektmetadaten und Edge Functions.

Beide Datenbankprüfungen lieferten identisch:

| Prüfung                                          |      Ergebnis |
| ------------------------------------------------ | ------------: |
| `public` Relationen/Funktionen/Enums/Policies    | 0 / 0 / 0 / 0 |
| Schema `private` vorhanden                       |          nein |
| Auth-Nutzer/Sitzungen/Identitäten/Refresh-Tokens | 0 / 0 / 0 / 0 |
| Storage-Buckets/-Objekte                         |         0 / 0 |
| Migrationseinträge                               |             0 |
| Edge Functions                                   |             0 |

Die geschützten Schemas `auth`, `extensions`, `graphql`, `graphql_public`, `pgbouncer`, `realtime`,
`storage`, `supabase_migrations` und `vault` sind weiterhin vorhanden. Das Projekt
`A-KlassenHoiz` / `ewqzhdnfoozjzenzmtlm` bleibt in `eu-central-1` mit PostgreSQL `17.6.1.141` im
Status `ACTIVE_HEALTHY`.

## Gate-Ergebnis

Der alte Anwendungs- und Auth-Datenbestand ist vollständig entfernt. Die einmalige
No-Backup-Verfassungsausnahme endet mit dieser Prüfung. Freigabe B ist nicht erteilt: Es wurden
keine V2-Migrationen, kein neues Schema und keine Auth-/Storage-/API-Konfiguration angewendet.
