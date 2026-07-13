# Product Requirements Document: A-KlassenHoiz

**Dokumenttyp:** Product Requirements Document (PRD)  
**Version:** 1.1  
**Status:** Freigegebene Produktgrundlage für den Neubau  
**Datum:** 13. Juli 2026  
**Produktsprache:** Deutsch  
**Plattform:** Mobile-first Web-App und installierbare PWA  

## 1. Zusammenfassung

A-KlassenHoiz wird als private, mobile-first Tippspiel-App für lokale Fußballligen vollständig neu entwickelt. Nutzer erstellen private Tipprunden, laden Freunde ein, tippen Spiele einer zentral gepflegten Liga und vergleichen ihre Punkte in Gesamt- und Spieltagsranglisten.

Die Produktfunktionen des bestehenden Projekts bleiben im Kern erhalten. Informationsarchitektur, Bedienabläufe, visuelles System, Datenmodell und Berechtigungen werden jedoch neu konzipiert. Maßstab sind eine schnelle, fokussierte Sport-App-UX und eine besonders einfache Tippabgabe. Die visuelle Energie und Klarheit moderner Sport-Apps dient als Inspiration; Begriffe, Mechaniken oder Darstellungen aus dem Echtgeldwetten-Kontext werden nicht übernommen.

Die wichtigste fachliche Änderung ist die zentrale Spielplanverwaltung:

- Ein globaler App-Admin erstellt und pflegt Liga-Saisons, Vereine, Spieltage, Spiele und Ergebnisse einmal zentral.
- Der Besitzer einer Tipprunde wählt beim Erstellen eine vorhandene Liga-Saison aus.
- Mehrere Tipprunden können dieselben Liga-, Spiel- und Ergebnisdaten verwenden.
- Tipps, Mitglieder, Einladungen, Punkte und Ranglisten bleiben strikt je Tipprunde getrennt.
- Die Rolle `Co-Admin` entfällt vollständig.

Der bisherige Anwendungscode und das bisherige Datenmodell werden nicht migriert. Das bestehende Supabase-Projekt und das bestehende Vercel-Projekt dürfen weiterverwendet werden, werden aber vor dem Neubau vollständig und kontrolliert von alten Anwendungsdaten, Auth-Nutzern und Storage-Inhalten bereinigt.

## 2. Ausgangslage

Das bestehende Produkt deckt bereits Registrierung, Tipprunden, Einladungen, manuelle Spielplanpflege, Tippabgabe, Punkteberechnung und Ranglisten ab. Das derzeitige Design und verschiedene Abläufe erfüllen den gewünschten Qualitätsanspruch jedoch nicht. Eine schrittweise kosmetische Überarbeitung würde die bestehenden strukturellen Entscheidungen konservieren und ist deshalb nicht vorgesehen.

Der Neubau soll:

- fachlich einfacher sein,
- doppelte Spielplan- und Ergebnispflege vermeiden,
- die Tippabgabe auf dem Smartphone beschleunigen,
- klare Zuständigkeiten und Berechtigungen besitzen,
- visuell konsistent und hochwertig wirken,
- als belastbare Basis für spätere Erweiterungen dienen.

## 3. Produktvision

> A-KlassenHoiz macht das private Tippen lokaler Fußballspiele so schnell, verständlich und unterhaltsam wie eine moderne Sport-App – ohne Geld, Quoten oder unnötige Komplexität.

## 4. Zielgruppe

### 4.1 Primäre Zielgruppe

Der erste reale Nutzerkreis besteht aus dem Betreiber, seinen Freunden und Bekannten. Die Nutzer:

- verfolgen lokale Fußballspiele,
- nutzen die Anwendung hauptsächlich auf dem Smartphone,
- möchten in wenigen Minuten tippen,
- erwarten keine Einarbeitung,
- haben unterschiedliche technische Erfahrung,
- verwenden eine oder gelegentlich mehrere private Tipprunden.

### 4.2 Sekundäre Zielgruppe

Das Produkt soll technisch und konzeptionell so sauber aufgebaut sein, dass später weitere private Gruppen und lokale Ligen aufgenommen werden können. Diese Skalierbarkeit ist eine Qualitätsanforderung, aber kein Vermarktungsziel der ersten Version.

## 5. Ziele und Erfolgskriterien

### 5.1 Produktziele

1. Ein neuer Nutzer kann sich ohne E-Mail-Bestätigung registrieren und unmittelbar loslegen.
2. Eine Tipprunde kann in weniger als zwei Minuten erstellt und geteilt werden.
3. Ein kompletter Spieltag mit mindestens acht Spielen kann auf einem Smartphone in weniger als drei Minuten getippt werden.
4. Die aktuell wichtigste Aktion ist jederzeit eindeutig: offene Tipps vervollständigen.
5. Spielpläne und Ergebnisse werden nur einmal zentral gepflegt.
6. Punkte und Ranglisten werden nach Ergebniseingabe automatisch und reproduzierbar aktualisiert.
7. Die Anwendung ist auf Mobiltelefon, Tablet und Desktop vollständig bedienbar.
8. Die PWA ist installierbar und verhält sich im Kern wie eine eigenständige App.

### 5.2 Messbare Erfolgskriterien

- Alle fünf repräsentativen Testpersonen schließen Registrierung, Beitritt und vollständige
  Tippabgabe ohne Hilfe ab.
- Mindestens vier von fünf Testpersonen erkennen auf der Tipprunden-Startseite selbstständig,
  welche Tippaktion als Nächstes offen ist.
- Die Zeitziele für Rundenerstellung und vollständige Tippabgabe werden über den Median der
  erfolgreichen Durchläufe bewertet.
- 100 % der Spiele sperren Tipps serverseitig zum jeweiligen Anpfiff.
- 100 % der geprüften Beispieltips werden nach dem 4/3/2/0-System korrekt gewertet.
- Fremde Tipps sind vor Ablauf der jeweiligen Tippfrist in allen Berechtigungstests unsichtbar.
- Alle Kernabläufe funktionieren bei 375 px Breite ohne horizontalen Scrollbereich.
- Die Kernoberflächen erfüllen WCAG 2.2 AA.
- Es gibt keine kritischen oder hohen Supabase-Sicherheitswarnungen vor Veröffentlichung.

## 6. Nicht-Ziele der ersten Version

Nicht Bestandteil von Version 1 sind:

- BFV-Import, Scraping oder automatische externe Synchronisierung,
- Co-Admins innerhalb einer Tipprunde,
- öffentliche oder durchsuchbare Tipprunden,
- Echtgeld, Einsätze, Gewinne, Quoten oder Buchmacherfunktionen,
- Bonusfragen, Joker, Achievements oder komplexe Gamification,
- Push-Benachrichtigungen und Tipp-Erinnerungen,
- Offline-Tippabgabe oder Konfliktsynchronisierung,
- native iOS- oder Android-Apps,
- Social Feed, Kommentare oder Direktnachrichten,
- selbst konfigurierbare Punktesysteme,
- Real-User-Monitoring und Produktanalytics,
- automatischer Import alter Nutzer oder alter Anwendungsdaten.

Diese Punkte können später neu priorisiert werden. Das Datenmodell soll sinnvolle Erweiterungen nicht unnötig verhindern, aber V1 darf dafür keine sichtbare Komplexität tragen.

## 7. Produktprinzipien

### 7.1 Tippen vor Verwaltung

Für normale Mitglieder steht die Tippabgabe immer vor administrativen Funktionen. Die Oberfläche richtet sich nach offenen Spielen und Tippfristen, nicht nach der internen Datenstruktur.

### 7.2 Eine primäre Aktion pro Ansicht

Jede Kernansicht besitzt eine klar erkennbare Hauptaktion. Sekundäre Aktionen werden visuell zurückgenommen oder in kontextbezogene Menüs verschoben.

### 7.3 Progressive Offenlegung

Nutzer sehen zunächst nur das, was für den aktuellen Schritt nötig ist. Komplexere Einstellungen und destruktive Aktionen erscheinen erst im passenden Kontext.

### 7.4 Sofortiges, ehrliches Feedback

Speichern, Laden, Fehler und Sperrungen werden eindeutig angezeigt. Optimistische Darstellung darf nur verwendet werden, wenn ein Fehlschlag sauber zurückgerollt und erklärt werden kann.

### 7.5 Private Runde statt Wettprodukt

Die App spricht von Tipp, Tipprunde, Punkten und Rangliste. Begriffe und visuelle Muster, die Echtgeldwetten, Gewinne oder Quoten nahelegen, sind ausgeschlossen.

## 8. Rollen und Berechtigungen

### 8.1 Rollen

**Gast**

- kann Login, Registrierung und einen gültigen Einladungslink öffnen,
- kann keine privaten Inhalte sehen.

**Mitglied**

- sieht eigene Tipprunden und deren freigegebene Liga-Inhalte,
- gibt eigene Tipps ab und ändert sie bis zur Tippfrist,
- sieht Ergebnisse und Ranglisten,
- sieht fremde Tipps erst nach Ablauf der jeweiligen Tippfrist,
- kann die eigene Mitgliedschaft verlassen.

**Tipprunden-Besitzer**

- besitzt zusätzlich alle Verwaltungsrechte für genau seine Tipprunde,
- bearbeitet Name und Darstellung der Tipprunde,
- erzeugt oder ersetzt den Einladungslink,
- entfernt Mitglieder,
- archiviert oder löscht die Tipprunde,
- kann keine Liga-, Vereins-, Spiel- oder Ergebnisdaten verändern.

**Globaler App-Admin**

- erstellt und verwaltet Liga-Saisons,
- verwaltet Vereine, Spieltage, Spiele und Ergebnisse,
- kann globale Inhalte archivieren,
- erhält aus der globalen Rolle im normalen Betrieb keinerlei Lese- oder Bearbeitungsrecht auf
  private Tipprunden,
- kann keine Mitglieder privater Tipprunden entfernen, keine Einladungen erzeugen und keine
  fremden Tipps verändern,
- kann in einem begründeten Support- oder Missbrauchsfall über einen zeitlich begrenzten und
  vollständig auditierten Break-Glass-Ablauf ausschließlich notwendige Support-Metadaten lesen,
- sieht auch über Break-Glass weder fremde Tipps vor der jeweiligen Tippfrist noch E-Mail-Adressen
  anderer Nutzer,
- erhält keine reguläre Möglichkeit, Nutzerpasswörter oder fremde Auth-Geheimnisse einzusehen.

### 8.2 Berechtigungsmatrix

| Aktion | Gast | Mitglied | Besitzer | zusätzliches App-Adminrecht |
|---|---:|---:|---:|---:|
| Registrieren/anmelden | Ja | Ja | Ja | Ja |
| Eigene Tipprunden sehen | Nein | Ja | Ja | Nein |
| Tipprunde erstellen | Nein | Ja | Ja | Nein |
| Tipprunde bearbeiten | Nein | Nein | Eigene | Nein |
| Mitglieder verwalten | Nein | Nein | Eigene | Nein |
| Einladung erzeugen | Nein | Nein | Eigene | Nein |
| Liga-Saison auswählen | Nein | Nein | Beim Erstellen/eingeschränkt | Nein |
| Liga und Spielplan pflegen | Nein | Nein | Nein | Ja |
| Ergebnisse pflegen | Nein | Nein | Nein | Ja |
| Eigenen Tipp abgeben | Nein | Ja | Ja | Nein |
| Fremde Tipps vor Frist sehen | Nein | Nein | Nein | Nein |
| Support-Metadaten fremder Runde lesen | Nein | Nein | Nein | Nur zeitlich begrenzter, auditierter Break-Glass-Fall |
| Ranglisten sehen | Nein | Ja | Ja | Nein |

Die Rolle `Co-Admin` existiert weder fachlich noch technisch.

Die letzte Spalte beschreibt ausschließlich zusätzliche Rechte aus der globalen Rolle. Besitzt
dieselbe Person unabhängig davon eine normale Mitgliedschaft oder Ownerrolle, gelten nur deren
reguläre, rundenbezogene Rechte; `app_admin` erzeugt dafür niemals einen Bypass.

## 9. Zentrales Domänenmodell

### 9.1 Grundentscheidung

Eine Tipprunde besitzt keinen eigenen duplizierten Spielplan. Stattdessen verweist sie auf genau eine global verwaltete **Liga-Saison**. Eine Liga-Saison ist die spielbare Einheit, beispielsweise „A-Klasse Musterkreis – Saison 2026/27“.

### 9.2 Kernobjekte

**Nutzerprofil**

- Verknüpfung zum Supabase-Auth-Nutzer
- globaler Anzeigename
- globale Rolle `user` oder `app_admin`
- Zeitstempel und optionaler Kontostatus

**Liga**

- stabiler Wettbewerbsname
- optionaler Kurzname
- Status aktiv/archiviert

**Saison**

- Bezeichnung, beispielsweise `2026/27`
- Start- und Enddatum
- Status Entwurf, aktiv, beendet oder archiviert

**Liga-Saison**

- Verknüpfung aus Liga und Saison
- vom App-Admin verwalteter, auswählbarer Wettbewerb
- darf von mehreren Tipprunden verwendet werden

**Verein**

- globaler Vereinsdatensatz mit eindeutigem Namen
- Kurzname
- optionales Vereinslogo
- Status aktiv/archiviert

**Liga-Saison-Verein**

- Zuordnung eines Vereins zu einer Liga-Saison
- verhindert eine unnötige Duplizierung desselben Vereins über mehrere Saisons

**Spieltag**

- gehört zu genau einer Liga-Saison
- besitzt eine positive Nummer und einen optionalen Anzeigenamen
- hat einen Status wie Entwurf, veröffentlicht oder abgeschlossen

**Spiel**

- gehört zu einem Spieltag und einer Liga-Saison
- enthält Heimverein, Auswärtsverein, Anstoßzeit und Status
- verwendet die Zeitzone `Europe/Berlin`

**Ergebnis**

- gehört zu genau einem Spiel
- enthält Heim- und Auswärtstore
- wird mit Bearbeiter und Zeitstempel historisiert

**Tipprunde**

- gehört einem Besitzer
- verweist auf genau eine Liga-Saison
- besitzt Name, Status und optional ein generiertes visuelles Kennzeichen

**Mitgliedschaft**

- verknüpft Nutzer und Tipprunde
- besitzt einen in der Tipprunde sichtbaren Nickname
- kennt nur die Rollen `owner` und `member`

**Einladung**

- gehört zu einer Tipprunde
- besitzt einen nicht erratbaren Token, Ablaufdatum und Status
- pro Tipprunde ist höchstens eine Einladung aktiv

**Tipp**

- verknüpft Nutzer, Tipprunde und Spiel
- enthält vorhergesagte Heim- und Auswärtstore
- ist je Nutzer, Tipprunde und Spiel eindeutig

**Punktewertung**

- wird deterministisch aus Tipp und Ergebnis berechnet
- enthält Punktzahl und Wertungstyp
- ist je Tipp eindeutig und jederzeit reproduzierbar

### 9.3 Wichtige Integritätsregeln

- Eine Tipprunde kann genau eine Liga-Saison verwenden.
- Die Liga-Saison einer Tipprunde darf nur geändert werden, solange noch keine Tipps existieren.
- Eine Liga-Saison darf erst für neue Tipprunden auswählbar sein, wenn sie veröffentlicht wurde.
- Heim- und Auswärtsverein eines Spiels müssen verschieden sein.
- Vereine eines Spiels müssen der betreffenden Liga-Saison zugeordnet sein.
- Ein Nutzer kann derselben Tipprunde nur einmal aktiv angehören.
- Der Besitzer ist immer aktives Mitglied seiner Tipprunde.
- Eine Tipprunde muss jederzeit genau einen Besitzer besitzen.
- Ergebnisse gelten global für alle Tipprunden derselben Liga-Saison.
- Punktewertungen und Ranglisten bleiben je Tipprunde isoliert.

## 10. Kernabläufe und Anforderungen

### 10.1 Registrierung und Login

**Anforderungen**

- Registrierung erfolgt mit E-Mail-Adresse, Passwort und Anzeigename.
- Eine E-Mail-Adresse darf nur einmal registriert sein.
- Eine E-Mail-Bestätigung ist in V1 deaktiviert.
- Nach erfolgreicher Registrierung besteht unmittelbar eine aktive Sitzung.
- Login erfolgt mit E-Mail-Adresse und Passwort.
- Passwortfelder besitzen eine Anzeigen/Verbergen-Funktion und unterstützen Passwortmanager.
- Fehlermeldungen dürfen nicht unnötig offenlegen, ob ein bestimmtes Konto existiert.
- Abmelden ist in den Kontoeinstellungen eindeutig erreichbar.
- Passwort-zurücksetzen per E-Mail gehört trotz deaktivierter Registrierungsbestätigung zum V1-Umfang.

**Weiterleitung nach Login**

- Keine Tipprunde: Onboarding mit „Tipprunde erstellen“ und „Einladung öffnen“.
- Genau eine Tipprunde: direkte Weiterleitung zu deren Übersicht.
- Mehrere Tipprunden: zuletzt aktive Tipprunde öffnen; Wechsel bleibt jederzeit möglich.
- Offener Einladungskontext: nach Login oder Registrierung zurück zur Einladung.

### 10.2 Tipprunde erstellen

Der Erstellungsprozess ist ein kurzer, geführter Flow:

1. Name der Tipprunde eingeben.
2. Eine veröffentlichte Liga-Saison auswählen.
3. Eigenen Tipprunden-Nickname bestätigen.
4. Zusammenfassung prüfen und erstellen.
5. Optional sofort Einladungslink teilen.

**Anforderungen**

- Der Ersteller wird automatisch Besitzer und Mitglied.
- Tipprunden sind privat und nicht durchsuchbar.
- Die Liga-Auswahl zeigt Liga, Saison und optional Anzahl der Vereine bzw. nächsten Spieltag.
- Ist nur eine Liga-Saison verfügbar, wird sie vorausgewählt, aber sichtbar bestätigt.
- Nach dem ersten gespeicherten Tipp kann die Liga-Saison nicht mehr gewechselt werden.
- Doppelklicks oder wiederholte Requests dürfen keine doppelten Tipprunden erzeugen.

### 10.3 Einladung und Beitritt

**Anforderungen**

- Der Besitzer kann einen Einladungslink erzeugen.
- Der Link ist standardmäßig sieben Tage gültig.
- Pro Tipprunde kann höchstens ein aktiver Link existieren.
- Ein neuer Link widerruft den vorherigen Link sofort.
- Derselbe Link kann als QR-Code dargestellt und geteilt werden.
- Ein eingeloggter Nutzer sieht vor dem Beitritt Name, Liga-Saison und Besitzer der Tipprunde.
- Ein Gast wird nach Login oder Registrierung zum ursprünglichen Einladungsziel zurückgeführt.
- Vor dem Beitritt bestätigt der Nutzer seinen Tipprunden-Nickname.
- Abgelaufene, widerrufene oder ungültige Links zeigen eine verständliche Fehleransicht ohne interne Details.
- Ein bereits vorhandenes Mitglied gelangt direkt in die Tipprunde.

### 10.4 Tipprunden-Übersicht

Die Übersicht beantwortet zuerst drei Fragen:

1. Was muss ich als Nächstes tippen?
2. Wann endet die nächste Tippfrist?
3. Wie stehe ich in der Rangliste?

**Inhalte in Prioritätsreihenfolge**

- nächster relevanter Spieltag,
- Fortschritt „x von y Spielen getippt“,
- primäre Aktion „Jetzt tippen“ oder „Tipps ansehen“,
- nächste Tippfrist,
- eigene aktuelle Platzierung und Punkte,
- kompakte Vorschau auf letzte Ergebnisse,
- sekundärer Zugang zu Rangliste und Regeln.

Der Besitzer sieht Verwaltungsaktionen nicht dauerhaft im Hauptinhalt, sondern in den Tipprunden-Einstellungen.

### 10.5 Tippabgabe

Die Tippabgabe ist der wichtigste Produktablauf.

**Aufbau**

- Spieltage werden als kompakte Auswahl oder Tabs oberhalb der Liste angeboten.
- Der aktuelle bzw. nächste unvollständige Spieltag ist vorausgewählt.
- Spiele sind nach Datum und Anstoßzeit gruppiert.
- Jede Spielkarte zeigt beide Vereine, Logos/Fallbacks, Anstoßzeit, Status und zwei numerische Toreingaben.
- Die Eingabe verwendet auf Mobilgeräten eine numerische Tastatur.
- Der Wechsel zum nächsten Eingabefeld funktioniert ohne zusätzliches Antippen.
- Der Fortschritt des Spieltags bleibt sichtbar.

**Speicherverhalten**

- Ein Tipp wird nach vollständiger Eingabe beider Werte automatisch oder durch eine klar sichtbare Sammelaktion zuverlässig gespeichert.
- Die konkrete Variante wird im Interaktionsprototyp getestet; fachlich muss der Nutzer jederzeit erkennen, welche Tipps gespeichert sind.
- Während des Speicherns gibt es sichtbares Feedback ohne Layoutsprung.
- Bei einem Fehler bleibt die Eingabe erhalten und eine erneute Übertragung ist möglich.
- Der Server ist alleinige Autorität für die Tippfrist.

**Tippfrist und Sichtbarkeit**

- Jeder Tipp bleibt bis exakt zur Anstoßzeit des jeweiligen Spiels änderbar.
- Spiele desselben Spieltags werden unabhängig voneinander gesperrt.
- Bei verschobenen Spielen gilt die aktualisierte Anstoßzeit; vorhandene Tipps bleiben bestehen.
- Abgesagte Spiele sind nicht mehr tippbar und werden nicht gewertet.
- Eigene Tipps bleiben sichtbar.
- Tipps anderer Mitglieder werden erst nach Ablauf der Tippfrist des jeweiligen Spiels sichtbar.

**Leere und besondere Zustände**

- Kein veröffentlichter Spieltag: freundliche Warteansicht.
- Alle Spiele getippt: klare Bestätigung und Möglichkeit zur Prüfung.
- Tippfrist abgelaufen: schreibgeschützte Anzeige mit Sperrgrund.
- Keine Verbindung: Eingaben nicht als gespeichert darstellen; erneutes Versuchen anbieten.

### 10.6 Ergebnisse und Punkte

**Punktesystem**

- Exaktes Ergebnis: 4 Punkte.
- Richtige Tendenz und richtige Tordifferenz: 3 Punkte.
- Nur richtige Tendenz: 2 Punkte.
- Sonst: 0 Punkte.
- Ein Unentschieden mit abweichendem exaktem Ergebnis erhält 3 Punkte, weil Tendenz und Tordifferenz korrekt sind.

**Anforderungen**

- Ein Spiel wird nur mit einem gültigen Ergebnis gewertet.
- Abgesagte Spiele werden nicht gewertet.
- Bei abgebrochenen Spielen entscheidet der App-Admin, ob ein offizielles Ergebnis eingetragen oder das Spiel von der Wertung ausgeschlossen wird.
- Bei Ergebniseingabe oder -änderung werden alle betroffenen Punktewertungen atomar neu berechnet.
- Wiederholte Berechnung mit identischen Eingaben erzeugt identische Ergebnisse.
- Ergebnisänderungen werden mit altem Wert, neuem Wert, Bearbeiter, Zeitpunkt und optionalem Grund protokolliert.
- Nutzer sehen einen Hinweis, wenn ein bereits gewertetes Ergebnis geändert wurde.

### 10.7 Ranglisten

**Ansichten**

- Gesamtrangliste der Tipprunde.
- Spieltagsrangliste für einen ausgewählten Spieltag.

**Darstellung**

- Eigene Zeile ist visuell hervorgehoben, bleibt aber vollständig lesbar.
- Angezeigt werden Platz, Nickname, Punkte und optional kompakte Trefferstatistiken.
- Auf Mobilgeräten wird keine breite Desktop-Tabelle erzwungen; eine zugängliche Listen- oder kompakte Tabellenansicht ist zulässig.

**Sortierung**

1. Punkte absteigend.
2. Bei Punktgleichheit gleiche Platzierung nach Wettbewerbsrangfolge, beispielsweise 1, 1, 3.
3. Innerhalb derselben Punktzahl alphabetisch nach Tipprunden-Nickname.

Trefferstatistiken sind in V1 keine Tie-Breaker.

### 10.8 Tipprunden-Verwaltung

Der Besitzer kann:

- den Namen ändern,
- den eigenen Nickname ändern,
- Mitglieder ansehen und entfernen,
- den aktiven Einladungslink ansehen, kopieren, als QR-Code öffnen, widerrufen oder ersetzen,
- die Tipprunde archivieren,
- die Tipprunde nach erneuter Sicherheitsbestätigung durch exakte Eingabe des Tipprunden-Namens
  endgültig löschen.

Archivieren ist die reversible Standardaktion. „Endgültig löschen“ ist ein sofortiger,
irreversibler Hard Delete ohne Wiederherstellungsfrist. In genau einer Datenbanktransaktion werden
alle Tipps, Punktewertungen, Mitgliedschaften und Einladungen der Runde sowie die Tipprunde selbst
gelöscht. Globale Liga-, Saison-, Vereins-, Spielplan- und Ergebnisdaten sowie Nutzerkonten bleiben
unverändert. Bei einem Fehler wird die gesamte Transaktion zurückgerollt; ein teilweise gelöschter
Zustand darf nicht entstehen. Nach erfolgreichem Commit darf nur ein minimales Audit-Ereignis mit
Aktion, ausführendem Nutzer, Zeitpunkt und nicht sprechender Objekt-ID bestehen bleiben. Es darf
weder Rundennamen noch Tipps oder Mitgliederdaten enthalten.

Der Besitzer kann nicht:

- weitere Administratoren ernennen,
- Spielpläne oder Ergebnisse bearbeiten,
- die Liga-Saison nach vorhandenen Tipps ändern,
- globale Vereinsdaten bearbeiten.

Beim Entfernen eines Mitglieds bleiben historische, bereits ausgewertete Ranglisten fachlich nachvollziehbar. Die genaue Darstellung ausgeschiedener Mitglieder wird in der Spezifikation als eigener Datenschutz- und Historienfall festgelegt.

### 10.9 Globale Liga-Verwaltung

Nur App-Admins erreichen den globalen Verwaltungsbereich.

**Empfohlene Reihenfolge**

1. Liga anlegen oder auswählen.
2. Saison anlegen.
3. Liga-Saison konfigurieren.
4. Vereine zuordnen oder neu anlegen.
5. Spieltage anlegen.
6. Spiele erfassen.
7. Liga-Saison veröffentlichen.
8. Ergebnisse während der Saison pflegen.

**Anforderungen**

- Entwürfe sind für normale Nutzer nicht auswählbar.
- Veröffentlichte Spieltage und Spiele sind in allen verbundenen Tipprunden sichtbar.
- Ergebnisverwaltung ist von der strukturellen Spielplanpflege getrennt.
- Mehrere Spiele können zügig nacheinander angelegt werden.
- Die Oberfläche verhindert identische Heim-/Auswärtsvereine und doppelte Begegnungen mit gleicher Anstoßzeit.
- Das Archivieren globaler Inhalte darf keine historischen Ranglisten zerstören.
- Destruktive Änderungen an bereits verwendeten Spielen benötigen eine starke Warnung und gegebenenfalls eine gesonderte Korrekturfunktion statt physischem Löschen.

## 11. Informationsarchitektur

### 11.1 Öffentlicher Bereich

- Start-/Loginseite
- Registrierung
- Passwort vergessen/zurücksetzen
- Einladungsvorschau
- Datenschutz und Impressum

Eine umfangreiche Marketing-Website ist für V1 nicht erforderlich.

### 11.2 Angemeldeter Mitgliederbereich

- Tipprunden-Übersicht
- Tippen
- Rangliste
- Ergebnisse
- Tipprunden-Wechsel
- Profil und Konto
- Tipprunden-Einstellungen für Besitzer

### 11.3 Globaler Adminbereich

- Admin-Übersicht
- Ligen
- Saisons und Liga-Saisons
- Vereine
- Spieltage und Spiele
- Ergebnisse
- zeitlich begrenzte, read-only Support-Metadatenansicht ausschließlich über auditiertes Break-Glass

### 11.4 Navigation

Auf Smartphones verwendet die ausgewählte Tipprunde maximal vier primäre Navigationsziele:

1. Übersicht
2. Tippen
3. Rangliste
4. Ergebnisse

Profil, Tipprunden-Wechsel und Einstellungen liegen in der Kopfzeile bzw. einem klaren sekundären Menü. Auf großen Bildschirmen wird dieselbe Hierarchie als Seitenleiste oder horizontale Navigation adaptiert, nicht als konkurrierendes zweites System.

## 12. UX- und UI-Richtung

### 12.1 Charakter

Die Oberfläche soll sportlich, direkt, hochwertig und lebendig wirken. Inspiration aus Tipico bezieht sich auf klare Hierarchie, kompakte Sportdaten und schnelle Interaktionen. Inspiration aus Kicktipp bezieht sich auf die Verständlichkeit der Tipp- und Ranglistenlogik. Die App darf weder wie ein Buchmacherprodukt wirken noch dessen geschützte Gestaltung kopieren.

### 12.2 Visuelle Leitidee

- dunkle, stadionartige Grundflächen optional als markanter App-Rahmen,
- helle, sehr gut lesbare Inhaltsflächen für Formulare und längere Listen,
- kräftiges Fußballgrün als primäre Markenfarbe,
- warmes Gelb oder Limette nur für gezielte Highlights und Fortschritt,
- Rot ausschließlich semantisch für Fehler und destruktive Aktionen,
- große, condensed Überschriften mit sportlichem Charakter,
- ruhige Standardschrift für Formulare und Daten,
- konsistente SVG-Icons statt Emojis,
- tabellarische Ziffern für Uhrzeiten, Ergebnisse, Tipps und Punkte.

Vorläufige Markenrichtung, im Designsystem zu validieren:

- Primary: tiefes Fußballgrün,
- Accent: leuchtendes Lime/Gold,
- Neutral: Slate/Off-White,
- Schriftidee: `Barlow Condensed` für Headlines und `Barlow` oder eine gleichwertige gut lesbare Sans-Serif für UI-Text.

### 12.3 Logo-Briefing

Das neue Logo soll eigenständig und als PWA-App-Icon funktionieren:

- reduzierter Fußball als Kernmotiv,
- optional subtile Verbindung zu Holzstruktur oder einem stilisierten `A`,
- keine detaillierte Illustration,
- klare Silhouette bei 32 px,
- als SVG-Master und quadratische App-Icon-Variante,
- sowohl auf heller als auch dunkler Fläche verwendbar,
- keine Ähnlichkeit zu Tipico, Kicktipp oder Vereinswappen.

Die konkrete Logoerstellung ist ein eigener Designschritt nach Freigabe des PRD.

### 12.4 Interaktionsstandards

- Mindestgröße von Touch-Zielen: 44 × 44 CSS-Pixel, bevorzugt 48 × 48.
- Numerische Tippfelder öffnen eine passende Bildschirmtastatur.
- Fokus, Hover, Pressed, Loading, Disabled, Success und Error sind für jede interaktive Komponente definiert.
- Formularfehler stehen direkt am betroffenen Feld und erklären die Korrektur.
- Animationen unterstützen Ursache und Wirkung, dauern meist 150–300 ms und respektieren `prefers-reduced-motion`.
- Skeletons reservieren Platz; Inhalte dürfen beim Laden nicht springen.
- Farbe ist nie der einzige Bedeutungsträger.

### 12.5 Responsive Verhalten

- Mobile-first ab 320/375 px.
- Optimiert für kleine und große Smartphones.
- Tablet nutzt zusätzliche Breite für Zwei-Spalten-Layouts, ohne Touch-Ziele zu verkleinern.
- Desktop begrenzt Lesebreiten und nutzt mehrspaltige Übersichten gezielt.
- Kernfunktionen sind vollständig mit Tastatur bedienbar.
- Portrait und Landscape werden unterstützt.

## 13. PWA-Anforderungen

- gültiges Web-App-Manifest,
- eigenständiger App-Name und Kurzname,
- vollständiger Icon-Satz einschließlich Maskable Icons,
- definierte Theme- und Background-Colors,
- installierbarer Standalone-Modus,
- korrekte Safe-Area-Abstände,
- einfache Offline-Seite bzw. Offline-Statusanzeige,
- keine Behauptung, ein Tipp sei gespeichert, solange keine Serverbestätigung vorliegt,
- Update-Hinweis, wenn eine neue App-Version bereitsteht und ein sicherer Reload möglich ist.

Offline-Tippabgabe und Hintergrundsynchronisierung bleiben ausgeschlossen.

## 14. Barrierefreiheit

Die Anwendung erfüllt WCAG 2.2 AA für alle Kernabläufe.

- Kontrast mindestens 4,5:1 für normalen Text.
- Sichtbarer Tastaturfokus.
- Logische Überschriften- und Fokusreihenfolge.
- Alle Eingaben besitzen dauerhaft sichtbare Labels.
- Statusmeldungen werden über geeignete Live-Regionen angekündigt.
- Dialoge halten Fokus korrekt und bieten einen eindeutigen Ausstieg.
- Icons und Vereinslogos besitzen passende Alternativtexte; dekorative Bilder bleiben für Screenreader stumm.
- Ranglisten haben eine semantische Listen- oder Tabellenstruktur.
- Zoom und Textvergrößerung werden nicht blockiert.
- Bewegung lässt sich über Systemeinstellungen reduzieren.

## 15. Datenschutz und Sicherheit

### 15.1 Datenschutz

- Nur angemeldete Nutzer sehen private Tipprunden.
- E-Mail-Adressen sind für andere Mitglieder unsichtbar.
- App-Admins erhalten keine regulären Rechte auf private Tipprunden. Ein zeitlich begrenzter,
  begründeter und vollständig auditierter Break-Glass-Zugriff darf ausschließlich notwendige
  Support-Metadaten lesend liefern; fremde Vorfristtipps und E-Mail-Adressen bleiben verborgen.
- In Tipprunden wird primär der Tipprunden-Nickname angezeigt.
- Es werden nur für den Betrieb erforderliche personenbezogene Daten gespeichert.
- Nutzer können ihr Konto löschen; Abhängigkeiten zu historischen Ranglisten werden datenschutzkonform anonymisiert oder entfernt.
- Betreiberangaben, tatsächliche Datenflüsse, Dienstleister, Aufbewahrungsregeln, Impressum und
  Datenschutzerklärung werden fachlich ermittelt und ausdrücklich freigegeben, bevor die Inhalte
  technisch eingebunden werden; rechtliche Angaben dürfen nicht erfunden werden.
- Das freigegebene Impressum und die freigegebene Datenschutzerklärung sind öffentlich erreichbar.

### 15.2 Supabase-Sicherheit

- Row Level Security ist auf jeder exponierten Tabelle aktiviert.
- Policies prüfen echte Objektzugehörigkeit und nicht nur die Rolle `authenticated`.
- Globale Adminrechte werden nicht in vom Nutzer änderbaren Metadaten gespeichert.
- Service-Role- bzw. Secret-Keys gelangen nie in Client-Code oder `NEXT_PUBLIC_*`-Variablen.
- Views verwenden einen RLS-sicheren Ansatz, beispielsweise `security_invoker`, oder liegen in einem nicht exponierten Schema.
- Privilegierte Datenbankfunktionen sind minimal, explizit berechtigt und nicht unkontrolliert öffentlich ausführbar.
- Zeit- und Tippfristentscheidungen werden serverseitig getroffen.
- Einladungs-Tokens sind nicht erratbar und werden bei Ersatz bzw. Ablauf zuverlässig ungültig.
- Kritische Verwaltungsaktionen werden protokolliert.

## 16. Technische Leitplanken

Diese Leitplanken sind keine vollständige Implementierungsplanung, sondern verbindliche Rahmenbedingungen für den späteren Spec-Kit-Plan.

- Neues Code-Repository ohne Übernahme des alten Anwendungscodes.
- Bestehendes Supabase-Projekt wird als Infrastruktur weiterverwendet.
- Bestehendes Vercel-Projekt und die vorhandene Domain können weiterverwendet werden.
- Technologiepräferenz: Next.js, TypeScript, React und Supabase.
- Exakte Versionen werden erst bei Projektstart anhand aktueller offizieller Dokumentation gewählt und fest gepinnt.
- Datenbankänderungen erfolgen ausschließlich über nachvollziehbare Migrationen im neuen Repository.
- Fachlogik für Punkte wird als reine, deterministische Funktion testbar gehalten.
- Autorisierung wird sowohl serverseitig als auch durch RLS erzwungen.
- Berechnete Ranglisten dürfen als sichere Views oder Queries umgesetzt werden, aber nicht manuell gepflegt werden.
- Zeitstempel werden technisch eindeutig gespeichert und in `Europe/Berlin` dargestellt.

## 17. Wiederverwendung von Supabase und Vercel

### 17.1 Empfehlung

Die vorhandenen Supabase- und Vercel-Projekte sollten wiederverwendet werden, sofern Projektzugriff, Region, Domain und Abrechnung weiterhin passen. Für einen privaten Neustart ist ein zweites dauerhaftes Infrastrukturprojekt nicht erforderlich. Der neue Quellcode bleibt dennoch vollständig getrennt.

### 17.2 Supabase-Reset

Vor dem Reset wird trotz gewünschter Komplettlöschung ein einmaliges Backup bzw. Export zur Absicherung erstellt und außerhalb des neuen Repositories abgelegt. Danach werden kontrolliert entfernt:

- alle alten Anwendungs-Tabellen, Views, Funktionen, Trigger, Policies und anwendungsspezifischen Typen,
- alle alten Datensätze,
- alle Supabase-Auth-Nutzer und aktiven Sessions,
- alle anwendungsspezifischen Storage-Objekte und Buckets,
- alte, nicht mehr benötigte Secrets oder Provider-Konfigurationen,
- alte lokale Migrationen werden nicht in das neue Repository übernommen.

Nicht automatisch gelöscht werden:

- Supabase-Projekt selbst,
- Projekt-URL und Projekt-Referenz,
- Abrechnung und Region,
- notwendige Plattform-Schemas von Supabase,
- Vercel-Projekt, Domain und Deployment-Infrastruktur.

Die Löschung ist eine separate, ausdrücklich bestätigte Implementierungsaufgabe. Sie darf nicht beiläufig während der Spezifikation erfolgen.

### 17.3 Auth-Konfiguration

- E-Mail-/Passwort-Registrierung bleibt aktiv.
- E-Mail-Bestätigung für Neuregistrierungen ist deaktiviert.
- Passwort-Reset-E-Mails bleiben aktiv.
- Redirect-URLs werden für lokale Entwicklung, Preview und Produktion neu geprüft.
- Nach dem Reset wird ein neuer App-Admin kontrolliert angelegt.

### 17.4 Vercel-Neuverknüpfung

- Das neue Repository wird mit dem vorhandenen Vercel-Projekt verbunden.
- Build-Konfiguration und Root-Verzeichnis werden neu geprüft.
- Environment-Variablen werden bereinigt und für Development, Preview und Production getrennt validiert.
- Secrets werden nicht aus dem alten Repository kopiert oder ausgegeben, sondern über die Projektkonfiguration referenziert bzw. neu gesetzt.
- Erst nach erfolgreicher Preview-Abnahme wird die bestehende Produktionsdomain auf den Neubau umgeschaltet.

### 17.5 Produktionsmutationen

Jede Produktionsmutation benötigt eine neue, ausdrückliche Freigabe, die ausführende und betroffene
Identitäten, Datenumfang, Testzweck und eine erforderliche anschließende Löschung benennt. Die
Provisionierung des ersten App-Admins, das Anlegen synthetischer Smoke-Testdaten, die Durchführung
des Produktionstests, das Entfernen sämtlicher synthetischer Daten und Testkonten sowie die
Bereinigungsverifikation sind getrennte Betriebsschritte. Keine Freigabe darf aus diesem PRD, einer
Spezifikation, einem Plan oder einer früheren allgemeinen Zustimmung abgeleitet werden.

## 18. Qualitätsanforderungen

### 18.1 Performance

- Interaktionsfeedback innerhalb von 100 ms, sofern lokal möglich.
- V1 verwendet keine p75-Feldwert-Grenze und erhebt keine Real-User-Monitoring-Daten.
- Der Release wird mit einem reproduzierbaren Lighthouse-Mobile-Lab-Budget geprüft: Performance-
  Score mindestens 90, LCP höchstens 2,5 Sekunden, CLS höchstens 0,1 und TBT höchstens
  200 Millisekunden, jeweils als Median aus drei isolierten Läufen.
- Testgerät beziehungsweise Emulation, Netzwerkprofil, CPU-Drosselung, Browser-/Lighthouse-Version,
  Produktions-Buildmodus, kalter Cache, geprüfte Routen und Messablauf werden festgelegt und mit
  dem Ergebnis dokumentiert.
- Routen und schwere Adminbestandteile werden sinnvoll getrennt geladen.
- Vereinslogos besitzen feste Abmessungen, optimierte Formate und Fallbacks.
- Listen bleiben auch bei einer vollständigen Saison flüssig bedienbar.

### 18.2 Zuverlässigkeit

- Tippabgabe ist gegen doppelte Requests abgesichert.
- Punkteberechnung ist idempotent.
- Ergebnisänderung und Neuberechnung erfolgen konsistent.
- Fehlerzustände bieten Wiederholung oder einen klaren nächsten Schritt.
- Kritische Mutationen besitzen Integrations- und Berechtigungstests.

### 18.3 Browser und Geräte

- Aktuelle stabile Versionen von Chrome, Safari, Edge und Firefox.
- iOS Safari und Android Chrome sind priorisierte mobile Ziele.
- Desktop-Nutzung unter Windows und macOS wird unterstützt.

## 19. Teststrategie und Abnahmekriterien

### 19.1 Automatisierte Tests

- Unit-Tests für Punktelogik, Rangfolge, Tippfristen und Zeitzonen.
- Integrations-/Datenbanktests für RLS, Rollen und Objektzugehörigkeit.
- Contract-Tests für kritische Mutationen.
- End-to-End-Tests für Registrierung, Tipprunde, Einladung, Tippen, Ergebniseingabe und Rangliste.
- PWA- und Manifest-Prüfungen.
- automatisierte Accessibility-Prüfungen ergänzt durch manuelle Tastatur- und Screenreader-Checks.

### 19.2 Kritische End-to-End-Abnahme

1. App-Admin erstellt Liga-Saison, Vereine, Spieltag und Spiele und veröffentlicht sie.
2. Nutzer registriert sich ohne E-Mail-Bestätigung.
3. Nutzer erstellt eine Tipprunde mit der veröffentlichten Liga-Saison.
4. Besitzer erzeugt einen Einladungslink.
5. Zweiter Nutzer registriert sich über den Link und tritt bei.
6. Beide Nutzer tippen denselben Spieltag.
7. Fremde Tipps bleiben bis zur jeweiligen Tippfrist verborgen.
8. App-Admin trägt Ergebnisse ein.
9. Punkte und Gesamt-/Spieltagsrangliste aktualisieren sich korrekt.
10. Die Abläufe funktionieren auf Smartphone und Desktop sowie im installierten PWA-Modus.

### 19.3 Moderiertes Usability-Testprotokoll

- Mindestens fünf repräsentative Testpersonen nehmen ohne vorherige Produktschulung teil.
- Die Stichprobe enthält eine Mischung aus iOS Safari und Android Chrome sowie mindestens einen
  ergänzenden Desktop-Test.
- Der Moderator darf weder bei Navigation noch bei Bedienung helfen.
- Startpunkt, Endpunkt, Messbeginn, Messende, Ergebnis und technische Störungen werden für jede
  Testaufgabe dokumentiert.
- Registrierung, Beitritt und vollständige Tippabgabe müssen von fünf von fünf Personen ohne Hilfe
  abgeschlossen werden.
- Mindestens vier von fünf Personen müssen die nächste offene Tippaktion selbstständig erkennen.
- Zeitziele werden über den Median der erfolgreichen Durchläufe bewertet.
- Technische Ausfälle werden separat ausgewiesen und niemals stillschweigend aus der Stichprobe
  entfernt.

## 20. Analytics und Produktbeobachtung

V1 erhebt weder Produktanalytics noch Real-User-Monitoring-Daten. Die zuvor erwogenen Kennzahlen zu
Registrierung, Rundenerstellung, Einladungen, Tippfortschritt, Speicherfehlern, Geräteklassen und
PWA-Installationskontext sind ein späteres Nicht-Ziel und kein Releasekriterium für V1.

Eine spätere PII-freie und aggregierte Produkt- oder Performancebeobachtung benötigt eine eigene
Spezifikation und Datenschutzentscheidung. Unabhängig davon dürfen technische Logs niemals
Tippinhalte, Passwörter, E-Mail-Adressen, Einladungs-Tokens oder private Rundennamen enthalten.

## 21. Release-Strategie

Da kein fester Termin vorgegeben ist, erfolgt die Planung qualitäts- und risikobasiert statt kalenderbasiert.

### Phase 0: Produkt- und Designgrundlage

- PRD freigeben,
- neues Repository anlegen,
- Spec Kit initialisieren,
- `specify`, `clarify`, `plan` und `tasks` auf Basis dieses PRD ausführen,
- Logo und Designsystem definieren,
- klickbaren Kernprototyp validieren.

### Phase 1: Technische Basis

- Supabase kontrolliert sichern und zurücksetzen,
- neues Schema, Auth und RLS,
- App-Shell, Navigation und PWA-Basis,
- globalen App-Admin bootstrapen.

### Phase 2: Liga- und Tipprundenkern

- zentrale Liga-Verwaltung,
- Tipprunden, Mitgliedschaften und Einladungen,
- responsive Basisoberflächen.

### Phase 3: Tipp- und Wertungskern

- Tippabgabe,
- Tippfristen und Sichtbarkeit,
- Ergebnisse, Punkte und Ranglisten.

### Phase 4: Qualität und Veröffentlichung

- vollständige E2E- und RLS-Prüfung,
- Accessibility- und Geräteprüfung,
- Preview-Abnahme mit realistischen Daten,
- Produktionsumschaltung im bestehenden Vercel-Projekt.

## 22. Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Destruktiver Supabase-Reset löscht benötigte Daten | Datenverlust | Einmaliger Export, explizite Reset-Checkliste und getrennte Bestätigung |
| Global falsches Ergebnis betrifft viele Tipprunden | Falsche Ranglisten | Historie, starke Bestätigung, atomare Neuberechnung und Admin-Audit |
| Manuelle Spielplanpflege ist zeitaufwendig | Admin-Fehler und Verzögerung | Bulk-freundliche Formulare, Duplikatprüfung und klare Entwurfs-/Veröffentlichungszustände |
| Sportliche Optik wirkt wie Echtgeldwetten | Falsche Produktwahrnehmung | Keine Quoten-/Geldbegriffe, freundliche Community-Sprache und eigenständige Markenidentität |
| Auto-Save erzeugt unklaren Zustand | Nutzer glaubt Tipp sei gespeichert | Expliziter gespeicherter Status, Fehlererhalt und serverseitige Bestätigung |
| PWA-Cache zeigt veraltete Daten | Falsche Fristen oder Ergebnisse | Netzwerk-first für zeitkritische Daten, klare Update-Strategie, keine Offline-Mutationen |
| Globaler Admin ist einzelner Engpass | Spielplan bleibt unvollständig | Effiziente Admin-UX; weitere globale Admins technisch möglich, aber keine Tipprunden-Co-Admins |

## 23. Entscheidungen für die nachfolgende Spezifikation

Diese Entscheidungen gelten als gesetzt:

- vollständiger Code-Neubau in einem neuen Repository,
- bestehende Supabase- und Vercel-Projekte werden weiterverwendet,
- vollständiger kontrollierter Reset aller alten App-Daten einschließlich Auth und Storage,
- E-Mail-/Passwort-Login ohne Registrierungsbestätigung,
- mobile-first PWA mit vollständiger Tablet-/Desktop-Unterstützung,
- globale Liga-Saison- und Ergebnisverwaltung durch App-Admins,
- Tipprunden wählen eine zentral gepflegte Liga-Saison,
- keine Co-Admins innerhalb von Tipprunden,
- manuelle Spielplan- und Ergebnisverwaltung,
- Punktesystem 4/3/2/0,
- private Einladungslinks mit QR-Code,
- keine Produktanalytics und kein Real-User-Monitoring in V1,
- reproduzierbare Lighthouse-Mobile-Lab-Budgets statt p75-Feldwert-Grenzen,
- keine zusätzlichen Gamification-Funktionen in V1.

## 24. Empfohlener Spec-Kit-Ablauf

Dieses PRD ist die Produktquelle, nicht der Ersatz für die technischen Spec-Kit-Artefakte. Im neuen Repository wird folgender Ablauf empfohlen:

1. Projekt und Spec Kit neu initialisieren.
2. Projektverfassung für Datenschutz, RLS, Mobile-first, Accessibility, Tests und Designqualität festlegen.
3. `specify` mit diesem PRD als Eingabe ausführen.
4. `clarify` nur für verbleibende fachliche Mehrdeutigkeiten verwenden.
5. `plan` für Architektur, Datenmodell, APIs, Designsystem und Reset-/Rolloutstrategie ausführen.
6. Im `plan.md` die tatsächlich ausgewählten Skills und Tools dokumentieren.
7. `tasks` und jede spätere Regenerierung erst nach bestandener Spec-/Plan-Analyse ausführen.
8. Supabase erst in der Implementierungsphase und nach expliziter Reset-Bestätigung löschen.

Das vorhandene Feature `specs/001-local-football-tips` wird nicht als Ausgangsspezifikation weitergeführt, weil es das alte dezentrale Liga-Modell und die entfernte Co-Admin-Rolle enthält.

## 25. Referenzen

- Kicktipp bestätigt als etablierte Tippspielmuster unter anderem Einzelwertung, Spieltagswertung, Statistiken, konfigurierbare Regeln und Bonusfragen. A-KlassenHoiz übernimmt für V1 nur den verständlichen Kern aus Tipps, Spieltagen und Ranglisten: <https://www.kicktipp.de/info/profipaket/funktionen/>
- Die offizielle Tipico-App-Beschreibung hebt schnellen Zugriff auf bevorzugte Wettbewerbe sowie Ergebnisse auf einen Blick hervor. Dies dient ausschließlich als UX-Inspiration für Informationsdichte und Navigation, nicht für Wettmechaniken oder visuelle Kopie: <https://play.google.com/store/apps/details?gl=DE&hl=de&id=tipico.sports>

---

**Freigabestatus:** Das PRD kann nach fachlicher Prüfung als Eingabe für das neue Spec-Kit-Projekt verwendet werden. Logo, konkrete Designtokens, exakte Framework-Versionen und die physische Supabase-Löschung werden bewusst in nachfolgenden, getrennt freizugebenden Schritten behandelt.
