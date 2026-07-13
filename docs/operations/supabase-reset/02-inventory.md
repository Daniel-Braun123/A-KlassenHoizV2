# Supabase-Reset: Altbestandsinventar

**Aufgabe:** T269  
**Inventurzeitpunkt:** 2026-07-13 vor der Löschung  
**Status:** VOLLSTÄNDIG

## App-Objekte in `public`

12 Relationen:

`einladungen`, `ergebnis_aenderungen`, `ergebnisse`, `ligen`, `mitgliedschaften`, `profiles`,
`punktewertungen`, `spiele`, `spieltage`, `teams`, `tipprunden`, `tipps`.

6 Funktionen:

- `enforce_team_name_unique_on_change()`
- `has_tipprunde_role(uuid, tipprunde_rolle[])`
- `is_global_admin()`
- `is_tipprunde_member(uuid)`
- `is_tipprunde_owner(uuid)`
- `set_updated_at()`

7 Enum-Typen:

`einladung_status`, `mitgliedschaft_status`, `spiel_status`, `spieltag_abschnitt`,
`tipprunde_rolle`, `tipprunde_status`, `wertungstyp`.

Die Tabellen besitzen zusammen 30 RLS-Policies und 9 anwendungsspezifische Trigger. Diese werden
mit den allowlistbasierten Tabellen automatisch entfernt. Das Schema `private` enthält keine
Relation, aber vier alte Helper-Funktionen: `has_tipprunde_role(uuid, tipprunde_rolle[])`,
`is_global_admin()`, `is_tipprunde_member(uuid)` und `is_tipprunde_owner(uuid)`.

## Auth, Storage und Migrationen

| Kategorie             | Bestand |
| --------------------- | ------: |
| `auth.users`          |       2 |
| `auth.sessions`       |       7 |
| `auth.identities`     |       2 |
| `auth.refresh_tokens` |      10 |
| Storage-Buckets       |       0 |
| Storage-Objekte       |       0 |
| Edge Functions        |       0 |
| Edge-Function-Secrets |       0 |

Die vier alten Migrationseinträge sind:

| Version          | Name                                   |
| ---------------- | -------------------------------------- |
| `001`            | `initial_schema`                       |
| `20260703135907` | `harden_rls_helper_functions`          |
| `20260703141322` | `allow_owner_select_created_tipprunde` |
| `20260704172407` | `liga_first_spielplan`                 |

Es existieren keine Realtime-Publication-Tabellen und keine zusätzlichen Policies auf `auth` oder
`storage`. In `auth` gibt es keine benutzerdefinierten Trigger. Die vorhandenen Storage-Trigger,
Event-Trigger, Erweiterungen und Plattformrollen sind Supabase-Plattformbestand und geschützt.

## Geschützter Plattformbestand

Die Schemas `auth`, `storage`, `extensions`, `vault`, `graphql`, `graphql_public`, `realtime`,
`supabase_migrations`, `pgbouncer` und alle `pg_*`-/Informationsschemas sind kein Alt-App-Bestand.
Installierte Erweiterungen (`pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`,
`uuid-ossp`), Standard-/Supabase-Rollen und Plattform-Event-Trigger bleiben unverändert.
