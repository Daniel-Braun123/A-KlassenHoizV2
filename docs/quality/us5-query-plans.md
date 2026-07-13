# US5 Query-Pläne

Am 13. Juli 2026 wurden die drei kritischen Pfade mit `EXPLAIN (ANALYZE, BUFFERS)` gegen den lokalen Postgres-Stack geprüft. Für die kleine Testmenge wurde `enable_seqscan=off` gesetzt, um die Indexeignung unabhängig von der kostenbasierten Kleinmengenauswahl zu belegen.

| Pfad                       | verwendeter Index                                            | Ausführungszeit |
| -------------------------- | ------------------------------------------------------------ | --------------: |
| Gesamtpunkte je Runde      | `prediction_scores_round_matchday_idx` per Bitmap Index Scan |        0,150 ms |
| Spieltagspunkte je Runde   | `prediction_scores_round_matchday_idx` per Index Only Scan   |        0,140 ms |
| Neuberechnung eines Spiels | `prediction_scores_match_recalc_idx` per Bitmap Index Scan   |        0,110 ms |

Keiner der Pfade liest Wertungen fremder Runden. Die Ranglisten werden aus `prediction_scores` abgeleitet und besitzen keine separat mutierbare Gesamtpunktquelle.
