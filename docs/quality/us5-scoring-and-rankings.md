# US5 Qualitätsslice: Punkte und Ranglisten

Stand: 13. Juli 2026

| Ebene                  | Ergebnis                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| pgTAP Wertungsvektoren | Exakt, Tordifferenz, Tendenz, Fehltipp und nicht exaktes Remis bestanden |
| pgTAP Recalc           | Revisionsersetzung und Ausschluss bestanden                              |
| pgTAP Rangfolge        | geteilte Plätze, alphabetische Anzeige und Eigenmarkierung bestanden     |
| RLS                    | Member-Grenze, kein Direkt-DML, kein App-Admin-Bypass bestanden          |
| Integration            | zwei isolierte Runden, Korrektur und Rebuild-Gleichheit bestanden        |
| Mobile Playwright      | zentrale Korrektur aktualisiert zwei Runden korrekt                      |
| Accessibility          | semantische Tabellen und Ergebnisrevisionen ohne Axe-Verstoß             |
| Query-Pläne            | alle drei kritischen Pfade indexgestützt                                 |

Die einzige Fachfunktion `private.calculate_prediction_points` ist `IMMUTABLE`, `STRICT`, parallel-sicher und über `calculation_version = 1` versioniert.
