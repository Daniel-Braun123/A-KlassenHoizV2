# RLS- und Ranking-Performance

Stand: 13. Juli 2026. `EXPLAIN (ANALYZE, BUFFERS)` wurde lokal auf repräsentativen Member-, Tipp- und Rankingpfaden ausgeführt. Bei der kleinen Fixture-Menge wurde zusätzlich `enable_seqscan=off` genutzt, um Indexeignung unabhängig von Kleinmengenkosten nachzuweisen.

| Pfad                                  | Index/Strategie                        | lokale Ausführungszeit |
| ------------------------------------- | -------------------------------------- | ---------------------: |
| aktive Mitgliedschaft je Nutzer/Runde | partieller Unique-/Lookup-Index        |               < 0,2 ms |
| Tippblatt je Runde/Mitglied           | Round-/Membership-/Match-Index         |               < 0,3 ms |
| Gesamt- und Spieltagsranking          | `prediction_scores_round_matchday_idx` |               < 0,2 ms |
| Ergebnisbedingte Neuberechnung        | `prediction_scores_match_recalc_idx`   |               < 0,2 ms |

Die Policies verwenden skalare `(select auth.uid())`-Prüfungen beziehungsweise indizierte Helper. Es wurde keine Policy zur Optimierung erweitert oder gelockert.
