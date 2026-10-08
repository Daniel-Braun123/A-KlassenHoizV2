# Saisonwechsel

Die Umsetzung besteht aus den Migrationen `20260909125902_round_season_rollover.sql`
und `20260915124538_harden_round_rollover.sql`. Beide wurden am 16.09.2026 vor der Anwendung
in Produktion veröffentlicht.

Am 08.10.2026 wurde der Produktionsstand über die Supabase-Verbindung erneut
read-only geprüft: Beide Migrationsversionen sind vorhanden, ebenso die
API-Spalten `predecessor_round_id`, `successor_round_id` und `has_successor`.

## Verhalten

- Beitritt, Einladungslink-Erzeugung und Saisonwechsel sperren zuerst die Runde und danach
  die Einladung. Ein wartender Beitritt prüft anschließend erneut Gültigkeit und Folgerunde.
- Gewinnt der Beitritt, wird das neue Mitglied beim Wechsel übernommen. Gewinnt der Wechsel,
  wird der alte Link abgewiesen. Der Wechsel selbst erzeugt höchstens eine Folgerunde.
- Die API liefert `predecessor_round_id` nur, wenn die bisherige Runde unter den
  Mitgliedschaftsregeln sichtbar ist. Neue Mitglieder erhalten keinen unbenutzbaren Archivlink.
- `has_successor` unterscheidet eine bestehende Folgerunde von ihrer Zugriffsberechtigung.
  Die geschützte Hilfsfunktion gibt für fremde Runden immer `false` zurück. Sie gibt keine
  Kennung einer nicht zugänglichen Folgerunde heraus.
- Nach dem Wechsel ersetzt ein Hinweis das Einladungsformular der bisherigen Runde.
  Ein Link zur neuen Saison wird nur bei vorhandenem Zugriff angeboten.

## Lokale Prüfung

- Komponententests: `tests/component/round-invitation-settings.test.tsx` und
  `tests/component/season-review.test.tsx`.
- Datenbank-/RLS-Tests: `supabase/tests/database/025_round_season_rollover.sql` und
  `supabase/tests/rls/025_round_season_rollover.sql`, einschließlich tatsächlichem
  `authenticated`-Datenbankkontext für die Navigationsberechtigungen.
- Paralleltests: `tests/integration/rounds/rollover-concurrency.test.ts` erzwingt mittels
  unabhängiger lokaler SQL-Verbindungen die beiden Sperrreihenfolgen und prüft zusätzlich
  eine parallele Einladungslink-Erzeugung. Keine externen Datenbanken als Testziel.
- Browser: `tests/e2e/rounds/season-rollover.spec.ts` prüft Besitzer, übernommene Mitglieder
  und neu hinzugekommene Mitglieder sowie das Einladungsformular der alten Runde.

Der lokale Supabase-Stack war am 16.09.2026 nicht erreichbar. Beim Release wurden die
27 Datenbankprüfungen mit neu erzeugten synthetischen Benutzern und isolierten Ligen sowie
die acht RLS-Prüfungen auf dem Produktionsschema ausgeführt. Jede Prüfung lief innerhalb
einer zurückgerollten Transaktion; es blieben keine Testbenutzer oder Testligen zurück.
Die neue API-Spalte wurde gegen frisch aus Produktion generierte Typen geprüft.
Die lokalen Parallel- und vollständigen Saisonwechsel-Browsertests stehen weiterhin aus.
