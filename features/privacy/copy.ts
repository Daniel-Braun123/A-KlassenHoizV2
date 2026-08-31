export const privacyCopy = {
  updatedAt: "31. August 2026",
  scope:
    "Diese Datenschutzerklärung beschreibt, welche personenbezogenen Daten A-KlassenHoiz verarbeitet und wofür sie benötigt werden. Die öffentlich erreichbare Website stellt das kostenlose Fußball-Tippspiel vor; Tipprunden und die darin enthaltenen Daten bleiben privat und sind nur für berechtigte Mitglieder sichtbar.",
  accountData:
    "Für Registrierung und Anmeldung verarbeitet A-KlassenHoiz die E-Mail-Adresse, Authentifizierungs- und Sitzungsdaten sowie den Anzeigenamen. Passwörter werden ausschließlich durch Supabase Auth verarbeitet und nicht im Klartext gespeichert. Für die Nutzung der App werden außerdem Tipprunden-Nicknames, Mitgliedschaften, Einladungen, Tipps, Punkte und die jeweils erforderlichen Zeitstempel gespeichert.",
  googleData:
    "Wenn du „Mit Google fortfahren“ auswählst, übermittelt Google über Supabase Auth eine eindeutige Google-Konto-ID, deine bestätigte E-Mail-Adresse, deinen Namen und gegebenenfalls dein Profilbild. E-Mail-Adresse und Konto-ID dienen ausschließlich der Anmeldung und sicheren Zuordnung deines Kontos; dein Name wird zur Vorbelegung des Anzeigenamens verwendet. Das Profilbild wird derzeit nicht in der App angezeigt. A-KlassenHoiz erhält keinen Zugriff auf Google Drive, Kontakte, Kalender, E-Mails oder andere Google-Dienste.",
  googleUse:
    "Google-Anmeldedaten werden weder verkauft noch für Werbung, Profiling oder das Training von KI-Modellen verwendet. Sie werden nur an Supabase als technischen Authentifizierungsdienst übermittelt und dort zusammen mit deinem Konto gespeichert. Die Anmeldung mit Google ist freiwillig; alternativ kannst du ein Konto mit E-Mail-Adresse und Passwort verwenden.",
  appData:
    "Innerhalb privater Tipprunden verarbeitet die App Rundennamen, Nicknames, Mitgliedschaften, Einladungen, Tipps und berechnete Punkte. Andere Mitglieder sehen keine E-Mail-Adressen. Fremde Tipps werden erst nach der jeweiligen Tippfrist sichtbar. Administrations- und Sicherheitsaktionen können mit ausführendem Konto, Zeitpunkt, Objekt-ID und Begründung protokolliert werden; Passwörter und fremde E-Mail-Adressen gehören nicht in diese Protokolle.",
  technicalData:
    "Beim Aufruf können die eingesetzten Infrastruktur- und Sicherheitsdienste technische Verbindungsdaten wie IP-Adresse, Zeitpunkt, Browser-/Geräteklasse, angeforderte Route und Fehlerstatus verarbeiten. A-KlassenHoiz protokolliert keine Tippinhalte, Passwörter, privaten Rundennamen oder Einladungs-Tokens zu Analysezwecken.",
  pushData:
    "Push-Benachrichtigungen sind freiwillig. Nach deiner Zustimmung speichert A-KlassenHoiz den Push-Endpunkt deines Browsers, die dafür erforderlichen Verschlüsselungsschlüssel, eine Browserkennung und technische Zustellinformationen. Benachrichtigungen können Erinnerungen an offene Tipps sowie Hinweise zu neuen oder vollständig ausgewerteten Spieltagen enthalten; nach einer Auswertung werden dabei deine Spieltagspunkte und deine aktuelle Platzierung angezeigt. Die verschlüsselte Nachricht wird über den Push-Dienst deines Browsers oder Betriebssystems zugestellt. Du kannst Benachrichtigungen jederzeit im Profil oder in den Geräteeinstellungen deaktivieren.",
  storageData:
    "Für die Anmeldung werden technisch notwendige Sitzungscookies verwendet. Im lokalen Browserspeicher merkt sich die App ausschließlich Bedienentscheidungen wie Farbschema, bereits beantwortete Benachrichtigungs- und Installationshinweise sowie eine einmalige Entwicklungsbereinigung. Die PWA speichert nur öffentliche beziehungsweise statische App-Dateien für Start und Offline-Hinweis; private Tipprundendaten werden nicht dauerhaft im Service-Worker-Cache abgelegt.",
  purposes:
    "Konto-, Profil-, Runden- und Tippdaten werden zur Bereitstellung des angeforderten Dienstes verarbeitet. Grundlage ist Art. 6 Abs. 1 lit. b DSGVO. Technische Sicherheits-, Missbrauchsschutz- und notwendige Auditdaten werden auf Grundlage des berechtigten Interesses an einem sicheren und zuverlässigen Betrieb gemäß Art. 6 Abs. 1 lit. f DSGVO verarbeitet. Freiwillige Push-Benachrichtigungen beruhen auf deiner Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, die du jederzeit für die Zukunft widerrufen kannst.",
  services: [
    {
      name: "Supabase",
      text: "Supabase stellt Authentifizierung, Datenbank und Storage bereit. Das primäre Projekt läuft in der Region Frankfurt (eu-central-1).",
    },
    {
      name: "Vercel",
      text: "Vercel stellt die Website bereit und verarbeitet die für Auslieferung, Betrieb und Fehlerbehebung notwendigen technischen Anfragen.",
    },
    {
      name: "Brevo",
      text: "Brevo versendet ausschließlich transaktionale Konto-E-Mails, etwa zur E-Mail-Bestätigung oder Passwort-Zurücksetzung. Dabei werden insbesondere Empfängeradresse, Betreff, Versand- und Zustellstatus sowie technisch anfallende E-Mail-Ereignisse verarbeitet; A-KlassenHoiz nutzt diese Daten nicht für Newsletter oder Werbung.",
    },
    {
      name: "Google",
      text: "Google ist nur beteiligt, wenn du die optionale Google-Anmeldung verwendest. Google bleibt für die Verarbeitung innerhalb deines Google-Kontos selbst verantwortlich.",
    },
    {
      name: "Push-Dienste",
      text: "Bei aktivierten Benachrichtigungen wird der vom Browser bereitgestellte Push-Dienst genutzt, beispielsweise ein Dienst von Apple, Google oder Mozilla.",
    },
  ],
  analytics:
    "Zur technischen Leistungsüberwachung verwendet A-KlassenHoiz Vercel Speed Insights. Dabei werden anonyme Web-Vitals und technische Angaben wie Route, Browser-, Geräte- und Netzwerkklasse sowie Land verarbeitet. Einladungs-Tokens, interne Objekt-IDs, URL-Parameter und Fragmente werden vor der Übertragung entfernt; Produktanalytics und Sitzungsaufzeichnungen finden nicht statt.",
  transfers:
    "Einzelne Anbieter können Daten auch außerhalb der Europäischen Union beziehungsweise des Europäischen Wirtschaftsraums verarbeiten. Soweit erforderlich, stützen die Anbieter solche Übermittlungen auf geeignete Garantien wie Standardvertragsklauseln oder einen anwendbaren Angemessenheitsbeschluss. Maßgeblich sind ergänzend die Datenschutz- und Auftragsverarbeitungsbedingungen des jeweiligen Anbieters.",
  retention:
    "Konto- und Profildaten werden grundsätzlich bis zur Kontolöschung gespeichert. Aktive Einladungen sind standardmäßig sieben Tage gültig; widerrufene oder abgelaufene Tokens können nicht mehr verwendet werden. Push-Abonnements werden beim Deaktivieren oder bei der Kontolöschung entfernt. Tipps und Punkte werden für die Laufzeit der Tipprunde gespeichert. Bei der Kontolöschung werden die Auth-Identität und E-Mail-Adresse gelöscht; bisherige Mitgliedschaften werden von der Identität getrennt und aus Mitgliederansicht sowie Ranglisten entfernt. Technisch notwendige Sicherheits-, Zustell- und Auditdaten bleiben nur so lange erhalten, wie sie für Missbrauchsschutz, Fehlerbehebung und Nachweiszwecke erforderlich sind. Eine endgültig gelöschte Tipprunde wird mitsamt Tipps, Wertungen, Mitgliedschaften und Einladungen transaktional entfernt; globale Liga- und Spieldaten bleiben erhalten.",
  deletion:
    "Deinen Anzeigenamen und deine Benachrichtigungseinstellungen kannst du im Profil ändern. Dort kannst du nach erneuter Bestätigung auch dein Konto löschen. Falls du eine Tipprunde besitzt, musst du sie vorher übertragen oder löschen. Tipprunden lassen sich zunächst reversibel archivieren oder nach exakter Namensbestätigung sofort und endgültig löschen.",
  rights:
    "Du hast im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Außerdem kannst du dich bei einer Datenschutzaufsichtsbehörde beschweren. Zur Ausübung deiner Rechte oder bei Fragen genügt eine Nachricht an die unten genannte Kontaktadresse.",
  automatedDecisions:
    "A-KlassenHoiz verwendet keine Werbung, kein personenbezogenes Produkttracking und keine automatisierte Entscheidungsfindung mit rechtlicher oder vergleichbar erheblicher Wirkung. Punkte und Ranglisten werden ausschließlich nach dem für alle sichtbaren 4/3/2/0-Punktesystem aus Tipps und Spielergebnissen berechnet.",
} as const;
