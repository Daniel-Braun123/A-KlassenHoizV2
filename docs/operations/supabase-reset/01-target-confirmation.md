# Supabase-Reset: Zielbestätigung

**Aufgabe:** T268  
**Stand:** 2026-07-13  
**Status:** BESTÄTIGT

| Merkmal                    | Bestätigter Wert                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------- |
| Projektname                | `A-KlassenHoiz`                                                                       |
| Projekt-Referenz           | `ewqzhdnfoozjzenzmtlm`                                                                |
| Region                     | `eu-central-1`                                                                        |
| PostgreSQL                 | `17.6.1.141`                                                                          |
| Projektstatus vor Eingriff | `ACTIVE_HEALTHY`                                                                      |
| Operator                   | Codex über die lokal authentifizierte Supabase CLI, im Auftrag des Projekteigentümers |
| Freigeber                  | Projekteigentümer/Repository-Inhaber `Daniel-Braun123`                                |
| Wartungsfenster            | sofort nach vollständiger Dokumentation von T268–T272 am 2026-07-13                   |

Das Ziel wurde über den Supabase Connector und unabhängig über `supabase projects list` sowie eine
verknüpfte CLI-Abfrage bestätigt. Im Supabase-Konto war genau dieses eine Projekt sichtbar.

## Abbruchkriterien

Vor Beginn wird ohne Mutation abgebrochen, wenn Projektname, Referenz oder Region abweichen, der
Status nicht gesund ist, das Live-Inventar nicht exakt der dokumentierten Allowlist entspricht,
Storage/Edge Functions/Secrets unerwartete Objekte enthalten oder die CLI nicht eindeutig mit dem
Zielprojekt verknüpft ist. Während der SQL-Ausführung führt jede fehlgeschlagene Vor- oder
Nachbedingung zum Rollback der gesamten Transaktion.

V2-Migrationen, Auth-Konfiguration, API-/Storage-Konfiguration, Vercel, Domain, GitHub, Region,
Billing, Projekt-Keys und das Supabase-Projekt selbst sind nicht Teil dieser Freigabe.
