# US6 Parallelität

Besitzerwechsel, Entfernung und Hard Delete sperren zuerst die Tipprunde. Danach werden Mitgliedschaften in stabiler Identitätsreihenfolge beziehungsweise als exakt adressierte Zeilen gesperrt.

- Der partielle Unique-Index erlaubt höchstens einen aktiven Besitzer.
- Der deferrable Owner-Constraint prüft am Transaktionsende, dass die Runde genau auf diesen aktiven Besitzer zeigt.
- Besitzer können weder austreten noch entfernt werden; zuerst ist eine atomare Übertragung erforderlich.
- Versionsprüfungen verhindern paralleles Archivieren, Reaktivieren, Übertragen oder Löschen auf einem veralteten Stand.
- Ein Hard Delete ist eine einzelne Datenbanktransaktion. Fehler bei Name, Version oder Folgeoperation rollen die gesamte Anweisung einschließlich Audit zurück.
