# Freigabe private Nutzung und Datenflüsse

Stand: 13. Juli 2026.

Der Betreiber hat die Nutzung verbindlich auf eine private, nicht-kommerzielle, einladungsbasierte Website für Freunde begrenzt. Deshalb werden keine erfundenen Anschrift-, Steuer-, Register- oder Unternehmensangaben und kein Impressum eingebunden.

Der sichtbare Hinweis entspricht der Implementierung:

- Supabase: E-Mail-/Passwort-Authentifizierung ohne Bestätigungszwang, Postgres und öffentlicher Clublogo-Bucket;
- Vercel: Hosting der Website nach späterem Cutover;
- Datenkategorien: Login-E-Mail, Profil-/Rundennamen, Mitgliedschaften, Einladungen, Tipps, Punkte und minimale Security-/Auditmetadaten;
- keine Produktanalytics und kein RUM;
- Archivierung, atomarer Hard Delete von Runden und Kontoanonymisierung entsprechen den DB-Tests.

Öffnung, Monetarisierung oder geschäftliche Nutzung hebt diese Freigabe auf und erfordert vorab eine neue Prüfung.
