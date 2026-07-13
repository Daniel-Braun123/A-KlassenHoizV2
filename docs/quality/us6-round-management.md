# US6 Qualitätsslice: Rundenverwaltung

Stand: 13. Juli 2026

Unit-Tests prüfen Nickname, Version, exakte Namensbestätigung und Kontolöschphrase. pgTAP prüft Owner-Invarianten, RPC-Rechte, Hard-Delete-Cascades und das FK-lose Audit. Integrationstests decken Besitzerwechsel, Owner-Austrittsverbot, Austritt, Archiv/Reaktivierung, Hard Delete und wiederholbare Kontoanonymisierung ab. Mobile Playwright- und Axe-Reisen prüfen Dialogfokus, Warntexte und irreversible Bestätigungen.

Der technische Scan bestätigt: Es existiert kein Co-Admin-Rollenwert und kein Co-Admin-Aktionspfad.
