# US6 Hard-Delete-Abnahme

Die Standardaktion bleibt das reversible Archivieren. Der separate Hard Delete verlangt die exakte, case-sensitive Eingabe des aktuellen Rundennamens und die gelesene Version.

Bei Erfolg löscht die FK-Cascade in einer Transaktion Punktewertungen, Tipps, Einladungen, Mitgliedschaften und die Tipprunde. Globale Liga-Saisons, Vereine, Spielplan, Ergebnisse und Nutzerkonten bleiben bestehen. Nach dem Commit gibt es keine Wiederherstellungsfrist.

Das einzige verbleibende Artefakt ist ein FK-loses Audit-Ereignis mit Aktion, ausführender Nutzer-ID, Zeitpunkt und nicht sprechender Runden-UUID. Name, Tipps und Mitgliederdaten werden nicht übernommen. Der Test mit falschem Namen beweist Null-Partial-Commit; erst die exakte Bestätigung erzeugt genau ein Audit und entfernt die Runde.
