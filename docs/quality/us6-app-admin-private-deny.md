# US6 App-Admin-Deny

App-Admins besitzen ausschließlich globale Wettbewerbsrechte. Sämtliche privaten Verwaltungs-RPCs beginnen mit `private.require_round_user()`, das App-Admins ausdrücklich abweist, und prüfen danach Mitgliedschaft beziehungsweise Besitz.

- kein normales Lesen privater Runden, Mitgliedschaften, Tipps oder Wertungen,
- kein Erzeugen privater Einladungen,
- kein Entfernen oder Befördern von Mitgliedern,
- kein Archivieren oder Löschen fremder Runden,
- kein Verändern fremder Tipps.

Die RLS- und RPC-Grenzen werden durch `060_round_management.sql` sowie die früheren privaten RLS-Suites geprüft. Der automatisierte Scan `scripts/audit-no-co-admin.ps1` bestätigt zusätzlich, dass kein Co-Admin-Enum, keine Action und kein entsprechender UI-Pfad existiert.
