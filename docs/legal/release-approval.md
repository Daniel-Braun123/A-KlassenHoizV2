# Rechtlicher Betriebsstand

Stand: 13. August 2026.

Dieses Dokument hält den technisch geprüften Stand fest und ersetzt keine individuelle
Rechtsberatung. Eine uneingeschränkte rechtliche Freigabe liegt derzeit nicht vor.

## Technisch abgebildete Datenflüsse

- Supabase: bestätigte E-Mail-/Passwort-Authentifizierung, optionale Google-Anmeldung, Postgres und
  öffentlicher Clublogo-Bucket; das Primärprojekt läuft in `eu-central-1`;
- Google OAuth: ausschließlich `openid`, bestätigte E-Mail und grundlegende Profilinformationen;
  kein Zugriff auf Drive, Kontakte, Kalender oder E-Mails;
- Vercel: Hosting und anonyme Web-Vitals-Messung mit Speed Insights;
- Brevo: transaktionale Auth-E-Mails für Bestätigung und Passwort-Zurücksetzung, keine Newsletter;
- Web Push: freiwillige Tipp-Erinnerungen mit browsergebundenem Push-Endpunkt und
  Verschlüsselungsschlüsseln;
- Datenkategorien: Login-E-Mail, Auth-Identität, Profil-/Rundennamen, Mitgliedschaften,
  Einladungen, Tipps, Punkte, Push-Abonnements und minimale Security-/Auditmetadaten;
- keine Werbung, Sitzungsaufzeichnung oder personenbezogene Produktanalytics.

Die öffentlich erreichbare Datenschutzerklärung beschreibt Verantwortlichen und Kontakt, Zwecke
und Rechtsgrundlagen, Datenkategorien, Empfänger, mögliche Drittlandverarbeitung,
Browserspeicher, Aufbewahrungskriterien, Löschwege, Betroffenenrechte sowie den optionalen
Google-Datenfluss. Die Landingpage und der angemeldete Profilbereich verlinken dieselbe Erklärung.

## Vor einer rechtlichen Freigabe offen

1. Die öffentliche, suchmaschinenoptimierte und für Registrierungen offene Anwendung ist nicht
   verlässlich als ausschließlich persönliches oder familiäres Angebot einzuordnen. Für eine
   Anbieterkennzeichnung nach § 18 Abs. 1 MStV fehlen derzeit eine ladungsfähige Anschrift und eine
   dauerhaft erreichbare Impressumsseite. Ob zusätzlich § 5 DDG greift, ist anhand der konkreten
   Betriebsform zu prüfen. Es werden weiterhin keine Angaben erfunden.
2. Für Supabase, Vercel und Brevo müssen die jeweils erforderlichen
   Auftragsverarbeitungsvereinbarungen und Unterauftragnehmerlisten im Betreiberkonto geprüft und
   dokumentiert werden.
3. In Brevo müssen personenbezogenes Öffnungs-/Klicktracking deaktiviert oder eine dafür passende
   Einwilligung umgesetzt und eine angemessene Log-Aufbewahrung festgelegt werden.
4. Externe Vereinslogo-URLs lösen Bildabrufe beim jeweiligen Drittanbieter aus. Die Bildrechte und
   dieser Datenfluss müssen geklärt werden; datenschutzärmer ist das kontrollierte Speichern der
   freigegebenen Logos im eigenen Supabase-Storage.
5. Die Selbstlöschung verlangt aktuell ein Passwort. Für ausschließlich per Google angelegte
   Konten muss entweder eine gleichwertige erneute Authentifizierung oder ein klar dokumentierter
   Löschweg über die Kontaktadresse bereitgestellt werden.

Die Google-Brandprüfung ist davon getrennt zu bewerten: Homepage, Produktbeschreibung,
Datenschutzerklärung und Google-Datenverwendung sind öffentlich vorhanden. Vor dem Einreichen sind
die dort hinterlegten URLs, die verifizierte Domain und die tatsächlich angeforderten Scopes noch
einmal in der Google Cloud Console abzugleichen.
