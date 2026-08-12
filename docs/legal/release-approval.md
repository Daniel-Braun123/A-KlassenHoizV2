# Freigabe private Nutzung und Datenflüsse

Stand: 13. August 2026.

Der Betreiber hat die Nutzung verbindlich auf eine private, nicht-kommerzielle, einladungsbasierte Website für Freunde begrenzt. Deshalb werden keine erfundenen Anschrift-, Steuer-, Register- oder Unternehmensangaben und kein Impressum eingebunden.

Der sichtbare Hinweis entspricht der Implementierung:

- Supabase: bestätigte E-Mail-/Passwort-Authentifizierung, optionale Google-Anmeldung, Postgres und öffentlicher Clublogo-Bucket; das Primärprojekt läuft in `eu-central-1`;
- Google OAuth: ausschließlich `openid`, bestätigte E-Mail und grundlegende Profilinformationen; kein Zugriff auf Drive, Kontakte, Kalender oder E-Mails;
- Vercel: Hosting und die ausdrücklich freigegebene, anonyme Web-Vitals-Messung mit Speed Insights;
- Brevo: transaktionale Auth-E-Mails für Bestätigung und Passwort-Zurücksetzung, keine Newsletter;
- Web Push: freiwillige Tipp-Erinnerungen mit browsergebundenem Push-Endpunkt und Verschlüsselungsschlüsseln;
- Datenkategorien: Login-E-Mail, Auth-Identität, Profil-/Rundennamen, Mitgliedschaften, Einladungen, Tipps, Punkte, Push-Abonnements und minimale Security-/Auditmetadaten;
- keine Produktanalytics, Sitzungsaufzeichnung, Werbung oder personenbezogenes Produkttracking;
- Archivierung, atomarer Hard Delete von Runden und Kontoanonymisierung entsprechen den DB-Tests.

Die öffentlich erreichbare Datenschutzerklärung benennt Verantwortlichen und Kontakt, Zwecke und
Rechtsgrundlagen, Datenkategorien, Empfänger, mögliche Drittlandverarbeitung, Browserspeicher,
Aufbewahrungskriterien, Löschwege, Betroffenenrechte sowie den optionalen Google-Datenfluss. Die
Landingpage und die Auth-Oberflächen verlinken dieselbe Erklärung und erläutern den Zweck der
Google-Profildaten in unmittelbarer Nähe zur Anmeldung.

Öffnung, Monetarisierung oder geschäftliche Nutzung hebt diese Freigabe auf und erfordert vorab eine neue Prüfung.
