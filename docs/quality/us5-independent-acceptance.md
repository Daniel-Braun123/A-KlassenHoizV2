# US5 unabhängige Abnahme

Ein zentral gepflegtes Ergebnis wurde gegen zwei private Tipprunden mit unterschiedlichen Tipps verarbeitet. Die erste Revision vergab 4 beziehungsweise 2 Punkte. Nach der Korrektur wurden beide Wertungen in derselben Ergebnistransaktion ersetzt und vergaben 2 beziehungsweise 4 Punkte.

Der operative Full-Rebuild ruft ausschließlich `private.rebuild_all_scores()` auf. Diese Funktion delegiert jedes Spiel an `private.recalculate_match_scores()`, das wiederum ausschließlich die kanonische `private.calculate_prediction_points()` verwendet. Der Snapshot vor und nach dem Full-Rebuild war identisch.

Damit sind Ergebnisverwaltung, Wertung und beide Ranglisten zentral wiederverwendet, während Reads durch RLS je Tipprunde isoliert bleiben.
