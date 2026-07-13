<!--
Sync Impact Report
- Versionsänderung: unratifizierte Vorlage -> 1.0.0
- Geänderte Prinzipien:
  - Platzhalterprinzipien 1-5 -> neun projektspezifische Grundprinzipien
- Hinzugefügte Abschnitte:
  - Produkt- und Architekturleitplanken
  - Arbeitsablauf und Qualitätsgates
- Entfernte Abschnitte: keine; die Platzhalter der Vorlage wurden ersetzt
- Zu synchronisierende Vorlagen:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ .specify/templates/commands/*.md (Verzeichnis nicht vorhanden; keine Vorlagen anzupassen)
- Geprüfte Laufzeitdokumentation:
  - ✅ docs/PRD-A-KlassenHoiz-Neubau.md (maßgebliche Quelle; keine Änderung erforderlich)
- Offene TODOs: keine
-->
# A-KlassenHoiz Projektverfassung

## Grundprinzipien

### I. Mobile-first, barrierefreie PWA
A-KlassenHoiz MUSS vom kleinsten unterstützten Viewport ausgehend gestaltet werden und sämtliche
Kernabläufe als installierbare Progressive Web App bereitstellen. Registrierung, Erstellung einer
Tipprunde, Einladung, Tippabgabe, Ranglisten, Ergebnisse und Verwaltung MÜSSEN auf unterstützten
Mobiltelefonen, Tablets und Desktopgeräten vollständig bedienbar sein. Alle Kernabläufe MÜSSEN
WCAG 2.2 AA erfüllen, einschließlich Tastaturbedienung, sichtbarem Fokus, semantischer Struktur,
ausreichendem Kontrast, zugänglichen Statusmeldungen, Zoom und reduzierter Bewegung. Eine Offline-
Oberfläche DARF einen Tipp ohne Serverbestätigung niemals als gespeichert darstellen. Mobile
Nutzung ist der primäre Produktkontext; Barrierefreiheit ist eine Freigabebedingung.

### II. Konsistentes Designsystem und exzellente UX
Jede Oberfläche MUSS ein dokumentiertes Designsystem mit gemeinsamen Tokens, Typografie,
Abständen, Icons, Komponenten, Interaktionszuständen und responsiven Regeln verwenden. Jede
Kernansicht MUSS ihre Hauptaktion eindeutig priorisieren, Sekundäraktionen schrittweise offenlegen,
Eingaben bei behebbaren Fehlern erhalten und sofortiges, wahrheitsgemäßes Feedback ohne vermeidbare
Layoutsprünge geben. Touch-Ziele MÜSSEN mindestens 44 × 44 CSS-Pixel groß sein. Ein neues UI-Muster
MUSS gegenüber der Wiederverwendung einer vorhandenen barrierefreien Komponente begründet werden.
Die UX-Abnahme MUSS realistische Smartphone-Abläufe sowie Leer-, Lade-, Fehler-, Sperr- und
Destruktivzustände abdecken. Konsistenz und Klarheit ermöglichen eine schnelle Tippabgabe für
Menschen mit unterschiedlicher technischer Erfahrung.

### III. Datenschutz als Standard und strikte Trennung der Tipprunden
Alle Tipprunden MÜSSEN privat, nicht durchsuchbar und ausschließlich für berechtigte Mitglieder
oder einen globalen App-Admin mit dokumentiertem operativem Anlass zugänglich sein. E-Mail-
Adressen, Zugangsdaten, Einladungs-Tokens und andere private Kontodaten DÜRFEN anderen Mitgliedern,
Analytics oder Logs nicht offengelegt werden. Fremde Tipps MÜSSEN bis zum Ablauf der serverseitig
bestimmten Frist des jeweiligen Spiels verborgen bleiben. Erhebung und Aufbewahrung
personenbezogener Daten MÜSSEN auf den Betriebszweck beschränkt sein; Löschung, Anonymisierung und
die Behandlung historischer Ranglisten MÜSSEN spezifiziert und getestet werden. Mitgliedschaften,
Einladungen, Tipps, Wertungen und Ranglisten MÜSSEN auch bei gemeinsam genutzten Ligadaten strikt je
Tipprunde isoliert bleiben.

### IV. Mehrschichtige Autorisierung und Serverhoheit
Row Level Security MUSS auf jeder Tabelle in einem durch Supabase exponierten Schema aktiviert sein.
Jede Policy MUSS die tatsächliche Objektzugehörigkeit, Mitgliedschaft oder Adminberechtigung prüfen
und DARF sich nicht auf die Rolle `authenticated` beschränken. Views, Funktionen, Storage-Zugriffe
und privilegierte Schlüssel MÜSSEN dieselbe Grenze wahren; Service-Role- und Secret-Schlüssel
DÜRFEN niemals öffentliche Clients erreichen. Jeder sensible Lese- und Schreibzugriff MUSS
zusätzlich serverseitig autorisiert werden. Ausschließlich die serverseitige Zeit DARF über
Tippfristen, Spielstatus, Einladungsgültigkeit und Sichtbarkeitswechsel entscheiden. Clientprüfungen
sind nur UX-Hilfen und niemals Sicherheitskontrollen. RLS und Autorisierung MÜSSEN durch explizite
Positiv- und Negativtests belegt werden.

### V. Deterministische Wertung und reproduzierbare Ranglisten
Die Punkteberechnung MUSS genau eine zentral definierte 4/3/2/0-Regel umsetzen: exaktes Ergebnis
4 Punkte, richtige Tendenz und Tordifferenz 3 Punkte, nur richtige Tendenz 2 Punkte, andernfalls
0 Punkte. Ein nicht exaktes Unentschieden erhält damit 3 Punkte. Die Wertungsfunktion MUSS rein,
deterministisch, idempotent und über Äquivalenzklassen sowie Grenzfälle vollständig unit-getestet
sein. Beim Anlegen oder Korrigieren eines Ergebnisses MÜSSEN alle betroffenen Wertungen atomar und
reproduzierbar neu berechnet und die Änderungen historisiert werden. Ranglisten MÜSSEN aus den
Wertungen abgeleitet werden, die festgelegte geteilte Platzierung verwenden und DÜRFEN niemals
manuell gepflegt werden.

### VI. Genau ein Besitzer und zentrale Wettbewerbsdaten
Eine Tipprunde MUSS genau einen Besitzer haben und DARF nur die Rollen `owner` und `member` kennen.
Co-Admins, delegierte Tipprunden-Administratoren und gleichwertige verdeckte Rechtepfade DÜRFEN
nicht existieren. Ausschließlich globale App-Admins DÜRFEN Ligen, Saisons, Liga-Saisons, Vereine,
Spieltage, Spiele und Ergebnisse anlegen oder ändern. Besitzer DÜRFEN eine veröffentlichte Liga-
Saison auswählen, aber keine zentralen Wettbewerbsdaten verändern. Alle verbundenen Tipprunden
MÜSSEN dieselben zentral verwalteten Spiel- und Ergebnisdatensätze referenzieren und zugleich ihre
Mitglieder- und Wertungsdaten isolieren. Besitzer- und globale Adminwechsel MÜSSEN diese Invarianten
auf Datenbank- und Serverebene erhalten.

### VII. Gemeinschaftliches Tippspiel, niemals Wettprodukt
Das Produkt MUSS gemeinschaftliche Begriffe wie Tipp, Tipprunde, Punkte und Rangliste verwenden. Es
DARF keine Echtgeld-Einsätze, Wetten, Quoten, Auszahlungen, Buchmacher oder Glücksspielmechaniken
unterstützen oder nahelegen. Dieses Verbot gilt ebenso für Sprache, Analytics und visuelle Muster.
Sport-App-Inspiration DARF Informationsdichte und Interaktionsgeschwindigkeit prägen, aber weder den
Eindruck eines Wettprodukts erzeugen noch eine fremde Marke kopieren. Produkttexte, Designs,
Spezifikationen und Tests MÜSSEN diese Grenze durchgängig wahren.

### VIII. Vollständiger Clean-Room-Neubau mit strikter Typsicherheit
Die neue Anwendung DARF weder alten Anwendungscode noch alte Datenmodelle oder Migrationen kopieren,
anpassen, importieren oder als Abhängigkeit verwenden. Bestehende Supabase- und Vercel-Projekte
DÜRFEN nur als Infrastruktur und erst nach separat genehmigter, gesicherter und kontrollierter
Bereinigung weiterverwendet werden; Spezifikation und Planung allein erteilen dafür keine Freigabe.
Neue Datenbankänderungen MÜSSEN mit einer frischen, nachvollziehbaren Migrationshistorie beginnen.
Der gesamte Anwendungs- und Testcode in TypeScript MUSS mit aktiviertem Strict Mode kompilieren. Eine
Abschwächung der Strictness, ungeprüftes `any` oder die Unterdrückung von Typfehlern erfordert eine
dokumentierte, eng begrenzte und im Review genehmigte Ausnahme. Die Clean-Room-Grenze verhindert,
dass geerbte Architektur- und Sicherheitsmängel den Neubau bestimmen.

### IX. Tests sind verpflichtende Liefernachweise
Jeder funktionale Schnitt MUSS Tests auf der niedrigsten wirksamen Ebene sowie an seinen
Sicherheits- und Ablaufgrenzen enthalten. Die verbindliche Suite umfasst Unit-Tests für reine
Domänenregeln, Integrations- und Contract-Tests für kritische Mutationen, RLS-Positiv- und
Negativtests für jeden exponierten Zugriff sowie End-to-End-Tests für kritische Nutzer- und Admin-
Abläufe. Accessibility- und PWA-Prüfungen MÜSSEN Automation mit manueller Tastatur-, Screenreader-,
Installations- und Geräteprüfung ergänzen, wo Automation nicht genügt. Tests MÜSSEN deterministisch,
voneinander unabhängig und in der Continuous Integration ausführbar sein. Eine Funktion ist nicht
fertig, solange erforderliche Nachweise fehlen oder fehlschlagen.

## Produkt- und Architekturleitplanken

- Das veröffentlichte Produkt MUSS eine deutschsprachige, private Fußball-Tippspiel-App auf Basis
  des freigegebenen PRD und seiner ausdrücklichen Nicht-Ziele bleiben.
- Jede Tipprunde MUSS genau eine veröffentlichte Liga-Saison referenzieren. Nach dem ersten
  gespeicherten Tipp MUSS die Liga-Saison der Tipprunde unveränderlich sein.
- Anstoßzeiten MÜSSEN technisch eindeutig gespeichert, serverseitig ausgewertet und in
  `Europe/Berlin` dargestellt werden. Verschobene und abgesagte Spiele MÜSSEN explizit definierte
  Wertungs- und Sichtbarkeitsregeln befolgen.
- Sensible und destruktive Operationen MÜSSEN atomar sein, wenn eine Teilausführung
  Domäneninvarianten verletzen könnte. Ergebnisänderungen und globale Adminaktionen MÜSSEN
  nachvollziehbar protokolliert werden.
- Kein öffentlicher Client DARF als Autorität für Identität, Besitz, Rolle, Frist, Wertung oder
  Ergebnis gelten.
- Abhängigkeiten und exakte Plattformversionen MÜSSEN während der Planung anhand aktueller
  offizieller Dokumentation gewählt, fest gepinnt und dokumentiert werden. Diese Verfassung
  autorisiert keine Implementierung.
- Umfangserweiterungen um öffentliche Tipprunden, konfigurierbare Wertung, Wettkonzepte, Co-Admins,
  duplizierte Spielpläne, Offline-Tippabgabe oder Wiederverwendung von Altcode erfordern vor ihrer
  Spezifikation oder Implementierung eine Verfassungsänderung.

## Arbeitsablauf und Qualitätsgates

1. Spezifikationen MÜSSEN die anwendbaren Prinzipien in messbare Anforderungen,
   Akzeptanzszenarien, Datenschutzfälle, Autorisierungsregeln, Accessibility-Ergebnisse und
   ausdrückliche Nicht-Ziele übersetzen.
2. Pläne MÜSSEN den Constitution Check vor der Recherche und erneut nach dem Design bestehen. Sie
   MÜSSEN Vertrauensgrenzen, RLS-Strategie, serverseitige Autorisierung, Zeitbehandlung,
   deterministische Wertung, Designsystem, PWA-Verhalten, WCAG-Nachweise, Clean-Room-Grenzen und
   Testnachweise festlegen.
3. Aufgabenlisten MÜSSEN Implementierungs- und Verifikationsaufgaben für Unit-, Integrations-/
   Contract-, RLS-, End-to-End-, Accessibility- und PWA-Abdeckung enthalten. Sicherheitskritische
   Tests MÜSSEN erlaubte und verbotene Akteure sowie Verhalten vor und nach der Frist prüfen.
4. Typprüfung, Linting, automatisierte Tests, Accessibility-Prüfungen sowie Build- und PWA-
   Validierung MÜSSEN vor einem Merge erfolgreich sein. Offene kritische oder hohe
   Sicherheitsbefunde blockieren die Veröffentlichung.
5. Reviews MÜSSEN die einschlägigen Verfassungsprinzipien nennen und clientseitige
   Alleinautorisierung, fehlende RLS, duplizierte Wettbewerbsdaten, versteckte Co-Admin-Rechte,
   nicht deterministische Wertung, unzugängliche UI, Wettbegriffe sowie Altcode oder alte
   Migrationen ablehnen.
6. Jede Supabase-Bereinigung, Schemaänderung, Migration, Produktionsbereitstellung oder
   Datenlöschung MUSS eine separat autorisierte Implementierungsaufgabe mit Sicherungs-, Rollback-
   und Verifikationsschritten sein. Dokumentationsarbeit DARF diese Aktionen nicht implizit
   ausführen.

## Governance

Diese Verfassung ist das höchste Governance-Dokument des Projekts. Das freigegebene PRD definiert
die Produktabsicht. Feature-Spezifikationen, Pläne, Aufgaben, Code, Migrationen und Reviews MÜSSEN
beide Dokumente einhalten. Bei einem Widerspruch ist diese Verfassung maßgeblich und das
nachrangige Artefakt MUSS korrigiert werden.

Eine Änderung erfordert einen schriftlichen Vorschlag, der betroffene Prinzipien und Artefakte
nennt, Begründung und Migrationsauswirkung beschreibt, abhängige Spec-Kit-Vorlagen oder Feature-
Dokumente aktualisiert und vor widersprechender Arbeit ausdrücklich vom Projekteigentümer
genehmigt wird. Änderungen verwenden semantische Versionierung: MAJOR bei Entfernung oder
inkompatibler Neudefinition eines Prinzips oder einer Governance-Regel, MINOR bei einem neuen
Prinzip oder einer wesentlichen Erweiterung und PATCH bei rein redaktioneller Klarstellung.

Jede Spezifikation, jeder Plan und jeder Pull Request MUSS eine angemessene Konformitätsprüfung
enthalten. Der Constitution Check ist ein blockierendes Gate. Eine Ausnahme MUSS die verletzte
Regel nennen, das Fehlen einer konformen Alternative begründen, Risikokontrollen und einen Ablauf-
oder Rückbauplan definieren und ausdrücklich vom Projekteigentümer genehmigt werden. Datenschutz,
Sicherheit, Wertungsintegrität, das Verbot von Co-Admins und Wettkonzepten sowie die Clean-Room-
Grenze sind ohne Verfassungsänderung nicht ausnahmefähig.

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
