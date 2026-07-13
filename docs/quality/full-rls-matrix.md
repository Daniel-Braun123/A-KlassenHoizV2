# Vollständige RLS-Matrix

Stand: 13. Juli 2026. Die Sollmatrix in `specs/001-rebuild-a-klassenhoiz/contracts/rls-access-matrix.md` wurde gegen 22 pgTAP-Dateien ausgeführt.

| Dimension                                                              | Nachweis                                                           | Ergebnis  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| anon, Nichtmitglied, Mitglied, Owner, App-Admin                        | `supabase/tests/rls/010` bis `080`                                 | bestanden |
| fremde/richtige Runde und manipulierte IDs                             | `030`, `040`, `050`, `060`, `080`                                  | bestanden |
| vor, exakt bei und nach Anpfiff                                        | `database/040_prediction_deadlines.sql`, `rls/040_predictions.sql` | bestanden |
| Draft, published, postponed, cancelled, abandoned, completed, archived | DB-/RLS-Slices `020` bis `060`                                     | bestanden |
| SELECT, direkte DML-Denies, Views und RPCs                             | Security-Baseline sowie alle RLS-Slices                            | bestanden |
| Ownership, Transfer, Archiv, Hard Delete                               | `database/060`, `061`; `rls/060`                                   | bestanden |
| Support-Grant, Scope, Ablauf, Widerruf, Audit                          | `database/080`, `081`; `rls/080`                                   | bestanden |
| Storage-Rolle, MIME, Größe, Pfad                                       | `storage/000`, `020`                                               | bestanden |

Gesamtergebnis: 22 Dateien, 201 Assertions, keine Lockerung einer Policy und keine App-Admin-Leseberechtigung auf private Basistabellen.
