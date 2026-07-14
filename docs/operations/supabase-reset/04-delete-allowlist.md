# Supabase-Reset: Lösch-Allowlist und Schutzliste

**Aufgabe:** T271  
**Stand:** 2026-07-13  
**Status:** GEGEN INVENTAR GEPRÜFT

## Exakte Lösch-Allowlist

In genau einer PostgreSQL-Transaktion dürfen gelöscht werden:

1. die 6 in `02-inventory.md` genannten Funktionen im Schema `public`;
2. die 12 genannten Relationen im Schema `public` einschließlich ihrer abhängigen Policies,
   Trigger, Constraints, Sequenzen und Grants;
3. die 7 genannten Enum-Typen im Schema `public`;
4. das bestätigte tabellenlose Schema `private` einschließlich der vier in `02-inventory.md`
   genannten alten Helper-Funktionen;
5. genau alle 2 Zeilen aus `auth.users`; die bestätigten 2 Identitäten, 7 Sitzungen und 10
   Refresh-Tokens werden über verifizierte `ON DELETE CASCADE`-Beziehungen mit entfernt;
6. genau die vier genannten Zeilen aus `supabase_migrations.schema_migrations`.

Storage-, Edge-Function- und Secret-Löschungen sind nicht erforderlich, weil deren bestätigte
Inventare leer sind. Wenn sie unmittelbar vor der Ausführung nicht leer sind, wird abgebrochen.

## Schutzliste

Nicht gelöscht oder verändert werden:

- Supabase-Projekt `ewqzhdnfoozjzenzmtlm`, Projekt-URL/-Keys, Region und Billing;
- Plattform-Schemas, insbesondere `auth`, `storage`, `extensions`, `vault`, `realtime`,
  `graphql`, `graphql_public`, `supabase_migrations` und `pgbouncer`;
- Plattformtabellen, Storage-Plattformtrigger, Event-Trigger, Erweiterungen sowie Standard- und
  Supabase-Rollen;
- Auth-, API-, Redirect-, Provider-, Mailer- und Storage-Konfiguration;
- Vercel-Projekt, Domain, Deployments, GitHub-Repository und deren Konfiguration;
- jedes künftige V2-Objekt oder jede nicht exakt inventarisierte Relation/Funktion/Typdefinition.

Die ausführbare Datei `scripts/operations/supabase-reset-delete.sql` kodiert diese Liste als exakte
Vorbedingungen. Unerwarteter Bestand führt vor der ersten Mutation zu einer Exception.
