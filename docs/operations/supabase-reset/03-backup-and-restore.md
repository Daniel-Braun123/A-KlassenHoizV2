# Supabase-Reset: No-Backup- und No-Restore-Entscheidung

**Aufgabe:** T270  
**Stand:** 2026-07-13  
**Status:** AUSDRÜCKLICH ABGEWÄHLT

Der Projekteigentümer hat in diesem Codex-Task ausdrücklich angewiesen, den alten Supabase-Bestand
„OHNE BACKUP“ zu löschen. Es wird deshalb weder ein DB-Dump noch ein Auth-/Storage-Export erzeugt.
Es gibt nach erfolgreicher Löschung keinen Restore-Pfad für die alten Tabellen, Datensätze,
Migrationseinträge, Nutzerkonten, Identitäten, Sessions oder Refresh-Tokens. Der Projekteigentümer
akzeptiert diesen unwiederbringlichen Verlust.

Dies ist eine einmalige Ausnahme von Arbeitsablauf und Qualitätsgate Nr. 6 der Projektverfassung,
das regulär Sicherungs- und Rollbackschritte verlangt. Eine konforme Alternative würde der
ausdrücklichen No-Backup-Entscheidung widersprechen.

Ersatzkontrollen:

- doppelte read-only Zielbestätigung über Connector und CLI;
- vollständiges Live-Inventar ohne Ausgabe personenbezogener Werte;
- exakte Lösch-Allowlist und separate Plattform-Schutzliste;
- transaktionale SQL-Vorbedingungen mit exakten Objekt- und Zählerwerten;
- transaktionale Nachbedingungen; bei Fehler rollt PostgreSQL alles zurück;
- unabhängige read-only Nachkontrolle über CLI und Connector;
- kein V2-Rollout und keine weitere Produktionsmutation unter dieser Freigabe.

Tritt nach erfolgreichem Commit eine Abweichung auf, wird der Incident dokumentiert und nur vom
bestätigten leeren Zustand vorwärts neu initialisiert. Alte Daten können nicht rekonstruiert werden.
Die Ausnahme endet mit Abschluss der Nachkontrolle T274.
