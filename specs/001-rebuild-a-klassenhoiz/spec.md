# Feature Specification: Vollständiger Neubau von A-KlassenHoiz

**Feature Branch**: `001-rebuild-a-klassenhoiz`

**Created**: 2026-07-13

**Status**: Draft

**Input**: Vollständiger Clean-Room-Neubau der privaten Fußball-Tippspiel-App auf Basis des
freigegebenen PRD und der Projektverfassung.

## Clarifications

### Session 2026-07-13

- Q: Was geschieht, wenn der einzige Besitzer seine Tipprunde verlassen oder sein Konto löschen
  möchte? → A: Der Besitzer muss die Rolle zuerst atomar an ein bestehendes Mitglied übertragen.
  Ohne weiteres Mitglied bleibt nur Archivieren oder Löschen.
- Q: Wie sollen vollständig eingegebene Tipps gespeichert werden? → A: Ein Tipp wird automatisch
  gespeichert, sobald beide gültigen Torwerte eines Spiels vollständig sind; der Status wird
  direkt am Spiel angezeigt.
- Q: Was soll nach der Löschung eines Nutzerkontos mit dessen bisherigen Tipps und Wertungen
  geschehen? → A: Tipps und Wertungen bleiben erhalten; Identität und Nickname werden durch einen
  stabilen anonymen Platzhalter je Tipprunde ersetzt.
- Q: Wie sollen globale App-Adminrechte in V1 vergeben werden? → A: Mehrere globale App-Admins sind
  möglich; Vergabe und Entzug erfolgen ausschließlich über einen kontrollierten operativen Prozess
  außerhalb der App.
- Q: Wie darf ein globaler App-Admin in einem begründeten Support- oder Missbrauchsfall auf eine
  private Tipprunde zugreifen? → A: Nur zeitlich begrenzt und lesend über eine explizite
  Break-Glass-Aktion für notwendige Support-Metadaten mit Pflichtbegründung und vollständigem,
  unveränderlichem Audit. Fremde Vorfristtipps und E-Mail-Adressen bleiben immer verborgen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrieren und unmittelbar starten (Priority: P1)

Als neuer Nutzer möchte ich mich mit E-Mail-Adresse, Passwort und Anzeigename registrieren und
ohne E-Mail-Bestätigung sofort eine aktive Sitzung erhalten, damit ich eine Tipprunde erstellen
oder einer Einladung folgen kann.

**Why this priority**: Ohne einen einfachen und verlässlichen Zugang ist kein privater
Tippspiel-Ablauf nutzbar.

**Independent Test**: Ein neuer Nutzer registriert sich, wird ohne Bestätigungszwischenschritt
angemeldet und abhängig von seinem Kontext korrekt zum Onboarding oder zur zuvor geöffneten
Einladung weitergeleitet.

**Acceptance Scenarios**:

1. **Given** eine noch nicht registrierte E-Mail-Adresse, **When** der Nutzer gültige
   Registrierungsdaten absendet, **Then** wird genau ein Konto angelegt und unmittelbar eine aktive
   Sitzung hergestellt.
2. **Given** eine bereits registrierte E-Mail-Adresse, **When** eine erneute Registrierung versucht
   wird, **Then** wird der Vorgang abgelehnt, ohne unnötige Kontodetails offenzulegen.
3. **Given** einen gültigen Einladungskontext vor Registrierung, **When** die Registrierung
   erfolgreich endet, **Then** kehrt der Nutzer zur Einladungsvorschau zurück.
4. **Given** einen bestehenden Nutzer, **When** er sich mit korrekten Zugangsdaten anmeldet,
   **Then** öffnet sich bei keiner Tipprunde das Onboarding, bei genau einer Tipprunde deren
   Übersicht und bei mehreren Tipprunden die zuletzt aktive Runde.
5. **Given** einen registrierten Nutzer ohne Zugriff auf sein Passwort, **When** er die
   Zurücksetzung anfordert, **Then** kann er sein Passwort über eine E-Mail sicher erneuern.

---

### User Story 2 - Wettbewerb zentral vorbereiten (Priority: P2)

Als globaler App-Admin möchte ich Ligen, Saisons, Liga-Saisons, Vereine, Spieltage, Spiele und
Ergebnisse einmal zentral verwalten, damit alle Tipprunden dieselben verlässlichen Wettbewerbsdaten
nutzen und keine Spielpläne dupliziert werden.

**Why this priority**: Veröffentlichte zentrale Wettbewerbsdaten sind Voraussetzung für jede neue
Tipprunde und die spätere Tippabgabe.

**Independent Test**: Ein App-Admin legt eine Liga-Saison mit Vereinen, Spieltag und Spielen an,
veröffentlicht sie und weist nach, dass normale Nutzer nur die veröffentlichten Daten sehen und
nicht verändern können.

**Acceptance Scenarios**:

1. **Given** einen globalen App-Admin, **When** er Liga, Saison, Liga-Saison und zugehörige Vereine
   anlegt, **Then** bleibt die Liga-Saison für normale Nutzer unsichtbar, solange sie Entwurf ist.
2. **Given** eine vollständige Liga-Saison im Entwurf, **When** der App-Admin sie veröffentlicht,
   **Then** kann sie beim Erstellen einer Tipprunde ausgewählt werden.
3. **Given** einen normalen Nutzer oder Tipprunden-Besitzer, **When** er zentrale Liga-, Vereins-,
   Spielplan- oder Ergebnisdaten zu verändern versucht, **Then** wird der Zugriff verweigert.
4. **Given** ein Spiel, **When** derselbe Verein als Heim- und Auswärtsverein gewählt wird oder eine
   identische Begegnung zur selben Anstoßzeit bereits existiert, **Then** wird das Speichern
   verhindert und der Konflikt verständlich erklärt.
5. **Given** ein Ergebnis für ein zentral verwendetes Spiel, **When** der App-Admin es speichert
   oder korrigiert, **Then** gilt es für alle verbundenen Tipprunden und die Änderung bleibt
   historisch nachvollziehbar.
6. **Given** einen bestehenden App-Admin, **When** er innerhalb der App weitere globale Adminrechte
   vergeben oder entziehen möchte, **Then** wird keine solche Funktion angeboten; die
   Rechteänderung ist ausschließlich über den kontrollierten operativen Prozess möglich.
---

### User Story 3 - Private Tipprunde erstellen und Freunde einladen (Priority: P3)

Als angemeldeter Nutzer möchte ich in einem kurzen Ablauf eine private Tipprunde für eine
veröffentlichte Liga-Saison erstellen und einen Einladungslink samt QR-Code teilen, damit Freunde
sicher beitreten können.

**Why this priority**: Die private Gruppe verbindet die zentralen Wettbewerbsdaten mit dem sozialen
Kern des Produkts.

**Independent Test**: Ein Nutzer erstellt in weniger als zwei Minuten eine Tipprunde, wird deren
einziger Besitzer und Mitglied, teilt eine Einladung und ein zweiter Nutzer tritt mit eigenem
Tipprunden-Nickname bei.

**Acceptance Scenarios**:

1. **Given** mindestens eine veröffentlichte Liga-Saison, **When** ein Nutzer Name, Liga-Saison und
   eigenen Nickname bestätigt, **Then** wird genau eine private Tipprunde erstellt und der Nutzer
   wird zugleich Besitzer und Mitglied.
2. **Given** eine Tipprunde ohne gespeicherten Tipp, **When** der Besitzer die Liga-Saison ändert,
   **Then** wird die Änderung zugelassen; nach dem ersten gespeicherten Tipp wird sie abgelehnt.
3. **Given** eine private Tipprunde, **When** der Besitzer eine Einladung erzeugt, **Then** entsteht
   genau ein nicht erratbarer, standardmäßig sieben Tage gültiger Link, der auch als QR-Code
   dargestellt werden kann.
4. **Given** einen bereits aktiven Einladungslink, **When** der Besitzer einen neuen erzeugt,
   **Then** wird der alte Link sofort ungültig.
5. **Given** einen gültigen Link, **When** ein eingeloggter Nichtmitglied-Nutzer seinen Nickname
   bestätigt, **Then** wird er genau einmal als Mitglied aufgenommen.
6. **Given** einen abgelaufenen, widerrufenen oder unbekannten Link, **When** er geöffnet wird,
   **Then** erscheint eine verständliche Fehleransicht ohne interne oder private Details.
7. **Given** ein bestehendes Mitglied, **When** es den Einladungslink erneut öffnet, **Then** wird es
   direkt in die Tipprunde geführt und keine zweite Mitgliedschaft erzeugt.

---

### User Story 4 - Einen Spieltag schnell und fristgerecht tippen (Priority: P4)

Als Mitglied möchte ich auf dem Smartphone den nächsten offenen Spieltag schnell tippen, den
Speicherstatus eindeutig erkennen und meine Tipps bis zum jeweiligen Anpfiff ändern, damit ich
vollständig und ohne Unsicherheit teilnehmen kann.

**Why this priority**: Die Tippabgabe ist der wichtigste und häufigste Produktablauf.

**Independent Test**: Ein Mitglied tippt auf einem Smartphone mindestens acht Spiele in weniger
als drei Minuten; jedes Spiel wird unabhängig zum serverseitig bestimmten Anpfiff gesperrt.

**Acceptance Scenarios**:

1. **Given** mehrere Spieltage mit offenen Spielen, **When** ein Mitglied die Tippansicht öffnet,
   **Then** ist der nächste unvollständige Spieltag ausgewählt und der Fortschritt sichtbar.
2. **Given** ein noch nicht begonnenes Spiel, **When** das Mitglied gültige Heim- und Auswärtstore
   vollständig eingibt, **Then** wird genau dieser Tipp automatisch gespeichert und direkt am Spiel
   eindeutig angezeigt, ob er speichert, bestätigt ist oder erneut übertragen werden muss.
3. **Given** einen gespeicherten Tipp vor dem Anpfiff, **When** das Mitglied ihn ändert, **Then**
   ersetzt die bestätigte Eingabe den bisherigen Tipp.
4. **Given** das Erreichen oder Überschreiten der serverseitigen Anstoßzeit, **When** ein Nutzer
   einen Tipp neu anlegt oder verändert, **Then** wird der Vorgang abgelehnt und der Sperrgrund
   angezeigt.
5. **Given** ein verschobenes Spiel, **When** die Anstoßzeit zentral aktualisiert wird, **Then** gilt
   die neue Frist und vorhandene Tipps bleiben bestehen.
6. **Given** ein abgesagtes Spiel, **When** ein Mitglied die Tippansicht öffnet, **Then** ist das
   Spiel nicht tippbar und wird später nicht gewertet.
7. **Given** einen Übertragungsfehler, **When** das Speichern fehlschlägt, **Then** bleibt die
   Eingabe erhalten und wird nicht fälschlich als gespeichert dargestellt.
8. **Given** ein Spiel vor Ablauf seiner Frist, **When** ein Mitglied fremde Tipps abruft, **Then**
   bleiben sie verborgen; nach Fristablauf werden sie für Mitglieder derselben Tipprunde sichtbar.

---

### User Story 5 - Punkte und Ranglisten nachvollziehen (Priority: P5)

Als Mitglied möchte ich nach der Ergebniseingabe meine Punkte sowie Gesamt- und
Spieltagsranglisten nachvollziehen, damit der Wettbewerb transparent, korrekt und unterhaltsam ist.

**Why this priority**: Punkte und Ranglisten liefern den gemeinsamen Nutzen aus den abgegebenen
Tipps.

**Independent Test**: Für eine festgelegte Sammlung von Tipps und Ergebnissen werden alle
4/3/2/0-Fälle korrekt berechnet und in reproduzierbaren Gesamt- und Spieltagsranglisten angezeigt.

**Acceptance Scenarios**:

1. **Given** einen Tipp, der dem Ergebnis exakt entspricht, **When** das Ergebnis gewertet wird,
   **Then** erhält der Tipp 4 Punkte.
2. **Given** einen nicht exakten Tipp mit richtiger Tendenz und Tordifferenz, einschließlich eines
   nicht exakten Unentschiedens, **When** das Ergebnis gewertet wird, **Then** erhält der Tipp
   3 Punkte.
3. **Given** einen Tipp mit nur richtiger Tendenz, **When** das Ergebnis gewertet wird, **Then**
   erhält der Tipp 2 Punkte; andernfalls 0 Punkte.
4. **Given** ein korrigiertes Ergebnis, **When** die Wertung erneut ausgeführt wird, **Then** werden
   alle betroffenen Punkte konsistent ersetzt, die Ranglisten aktualisiert und die Korrektur
   angezeigt.
5. **Given** mehrere Mitglieder mit gleicher Punktzahl, **When** eine Rangliste angezeigt wird,
   **Then** teilen sie denselben Wettbewerbsrang und der nächste Rang wird übersprungen; innerhalb
   der Punktzahl werden Nicknames alphabetisch geordnet.
6. **Given** eine Tipprunde, **When** ein Mitglied zwischen Gesamt- und Spieltagsrangliste wechselt,
   **Then** sieht es nur die Wertungen dieser Tipprunde und erkennt die eigene Position eindeutig.

---

### User Story 6 - Tipprunde als alleiniger Besitzer verwalten (Priority: P6)

Als Besitzer möchte ich Name, eigenen Nickname, Mitglieder, Einladung und Lebenszyklus meiner
Tipprunde verwalten, ohne zentrale Wettbewerbsdaten oder weitere Administratoren festlegen zu
können.

**Why this priority**: Klare, begrenzte Besitzerrechte halten private Runden selbstverwaltbar und
verhindern unklare Zuständigkeiten.

**Independent Test**: Ein Besitzer verwaltet seine Runde, ein Mitglied kann dieselben Aktionen
nicht ausführen, und kein Ablauf kann eine Co-Admin-Rolle oder eine Tipprunde ohne genau einen
Besitzer erzeugen.

**Acceptance Scenarios**:

1. **Given** einen Besitzer, **When** er Name, eigenen Nickname oder Einladung seiner Tipprunde
   ändert, **Then** wird die Änderung nur in seiner Tipprunde wirksam.
2. **Given** ein normales Mitglied, **When** es Besitzeraktionen versucht, **Then** werden sie
   abgelehnt.
3. **Given** einen Besitzer, **When** er nach einer Co-Admin- oder weiteren Adminrolle sucht oder
   eine solche Zuweisung versucht, **Then** existiert keine entsprechende Funktion oder Rolle.
4. **Given** mindestens ein weiteres aktives Mitglied, **When** der Besitzer den Besitz überträgt,
   **Then** wechselt die Rolle atomar und die Tipprunde besitzt zu keinem Zeitpunkt weniger oder
   mehr als einen Besitzer.
5. **Given** kein weiteres aktives Mitglied, **When** der Besitzer die Runde verlassen oder sein
   Konto löschen möchte, **Then** bleibt nur die bestätigte Archivierung oder Löschung der Runde.
6. **Given** ein entferntes Mitglied mit historischen Wertungen, **When** es aus der Tipprunde
   entfernt wird, **Then** verliert es sofort den Zugriff; seine bisherigen Wertungen bleiben mit
   dem damaligen Nickname und dem Hinweis „nicht mehr Mitglied“ nachvollziehbar.
7. **Given** eine Kontolöschung, **When** historische Wertungen erhalten werden müssen, **Then**
   bleiben Tipps und Wertungen unverändert, während personenbezogene Bezüge und Nickname entfernt
   und je Tipprunde durch einen stabilen, nicht rückführbaren anonymen Platzhalter ersetzt werden.
8. **Given** eine Archivierung, **When** der Besitzer sie bestätigt, **Then** bleibt die Runde
   reversibel erhalten und kann nach den festgelegten Regeln wieder aktiviert werden.
9. **Given** eine endgültige Löschung, **When** der Besitzer den exakten Tipprunden-Namen bestätigt,
   **Then** werden Runde, Einladungen, Mitgliedschaften, Tipps und Punktewertungen sofort und atomar
   gelöscht, während Nutzerkonten und globale Wettbewerbsdaten erhalten bleiben.
10. **Given** einen Fehler während der endgültigen Löschung, **When** die Transaktion nicht
    vollständig committen kann, **Then** bleibt die gesamte Tipprunde unverändert bestehen.

---

### User Story 7 - Als barrierefreie PWA auf jedem Zielgerät nutzen (Priority: P7)

Als Nutzer möchte ich sämtliche Kernabläufe auf Smartphone, Tablet und Desktop sowie im
installierten PWA-Modus barrierefrei verwenden, damit Gerätewahl oder Behinderung die Teilnahme
nicht verhindern.

**Why this priority**: Mobile-first, Installierbarkeit und WCAG 2.2 AA sind verbindliche
Produktqualitäten für alle vorherigen Abläufe.

**Independent Test**: Die kritische End-to-End-Reise funktioniert bei 375 Pixel Breite, per
Tastatur und im installierten Modus ohne horizontalen Scrollbereich oder falsche Offline-
Speicherbestätigung.

**Acceptance Scenarios**:

1. **Given** ein unterstütztes Smartphone mit 375 Pixel Breite, **When** ein Nutzer alle
   Kernabläufe durchführt, **Then** bleibt jede Funktion ohne horizontalen Seiten-Scrollbereich
   bedienbar und jedes Touch-Ziel ist mindestens 44 × 44 CSS-Pixel groß.
2. **Given** Tastatur- oder Screenreader-Nutzung, **When** Formulare, Dialoge, Navigation und
   Ranglisten verwendet werden, **Then** sind Reihenfolge, Labels, Statusmeldungen, Fokus und
   Ausstieg eindeutig und WCAG-2.2-AA-konform.
3. **Given** ein installierbares Gerät, **When** die PWA installiert und gestartet wird, **Then**
   besitzt sie eigenen Namen, passende Icons, Standalone-Darstellung und korrekte Safe-Areas.
4. **Given** keine Verbindung, **When** die App geöffnet oder ein Tipp eingegeben wird, **Then**
   zeigt sie einen verständlichen Offline-Zustand und behauptet keine erfolgreiche Speicherung.
5. **Given** eine verfügbare neue App-Version, **When** ein sicherer Wechsel möglich ist, **Then**
   wird der Nutzer verständlich auf das Update hingewiesen.

### Querschnittliche Security- und Operations-Abnahme

1. **Given** einen App-Admin ohne Mitgliedschaft in einer privaten Tipprunde, **When** er die Runde
   bearbeiten, ein Mitglied entfernen, eine Einladung erzeugen oder einen fremden Tipp verändern
   will, **Then** wird jede Aktion verweigert.
2. **Given** einen dokumentierten Support- oder Missbrauchsfall, **When** ein App-Admin eine
   zeitlich begrenzte Break-Glass-Freigabe mit Pflichtbegründung nutzt, **Then** erhält er nur die
   vorab festgelegten notwendigen Support-Metadaten lesend und jeder Zugriff wird vollständig und
   unveränderlich protokolliert.
3. **Given** eine aktive Break-Glass-Freigabe, **When** Support-Metadaten gelesen werden, **Then**
   bleiben fremde Tipps vor ihrer jeweiligen Tippfrist und E-Mail-Adressen anderer Nutzer verborgen.

### Edge Cases

- Es gibt noch keine veröffentlichte Liga-Saison: Nutzer können keine Tipprunde abschließen und
  erhalten eine verständliche Warteansicht.
- Beim Erstellen einer Tipprunde wird dieselbe Anfrage mehrfach gesendet: Es entsteht genau eine
  Tipprunde mit genau einem Besitzer.
- Die einzige veröffentlichte Liga-Saison ist vorausgewählt: Der Nutzer muss sie weiterhin sichtbar
  bestätigen.
- Ein Besitzer versucht, die Liga-Saison nach dem ersten gespeicherten Tipp zu ändern: Die Änderung
  wird unabhängig vom verwendeten Client abgelehnt.
- Ein Nutzer versucht, derselben Tipprunde mehrfach beizutreten: Es bleibt genau eine aktive
  Mitgliedschaft bestehen.
- Einladung läuft während Login oder Registrierung ab: Nach Rückkehr erscheint der abgelaufene
  Zustand; es erfolgt kein Beitritt.
- Ein Spiel wird genau während der Tippübertragung angepfiffen: Maßgeblich ist die serverseitige
  Annahmeentscheidung; ein abgelehnter Tipp wird nicht als gespeichert angezeigt.
- Spiele eines Spieltags haben unterschiedliche Anstoßzeiten: Jedes Spiel wird unabhängig gesperrt
  und fremde Tipps werden je Spiel unabhängig freigegeben.
- Ein Spiel wird verschoben, abgesagt oder abgebrochen: Bestehende Tipps bleiben bei Verschiebung
  erhalten; abgesagte Spiele werden ausgeschlossen; bei Abbruch entscheidet der App-Admin zwischen
  offiziellem Ergebnis und Wertungsausschluss.
- Ein bereits gewertetes Ergebnis wird geändert: Alte und neue Werte, Bearbeiter, Zeitpunkt und
  optionaler Grund bleiben nachvollziehbar; alle betroffenen Runden werden konsistent aktualisiert.
- Eine Liga-Saison oder ein Verein wird archiviert: Historische Spiele, Wertungen und Ranglisten
  bleiben erhalten; archivierte Inhalte stehen für neue Auswahl nur nach ihren Statusregeln bereit.
- Ein Besitzer entfernt sich selbst oder löscht sein Konto: Vorher muss der Besitz atomar an ein
  bestehendes aktives Mitglied übertragen werden. Gibt es kein weiteres Mitglied, bleibt nur die
  bestätigte Archivierung oder Löschung der Tipprunde.
- Zwei Mitglieder verwenden denselben Nickname in einer Tipprunde: Die Spezifikation setzt für V1
  eindeutige aktive Nicknames je Tipprunde voraus und verlangt eine verständliche Korrektur.
- Vereinslogo fehlt oder lädt nicht: Ein zugänglicher textlicher bzw. visueller Fallback bleibt
  vorhanden.
- Text wird stark vergrößert oder Bewegung reduziert: Inhalte und Funktionen bleiben vollständig
  nutzbar und Animationen werden reduziert oder entfernt.
- Veraltete PWA-Inhalte widersprechen einer aktuellen Frist oder einem Ergebnis: Zeitkritische
  Informationen werden nicht als aktuell ausgegeben, bevor sie bestätigt wurden.
- Ein App-Admin versucht, eine private Runde regulär zu bearbeiten oder über Break-Glass auf
  Vorfristtipps beziehungsweise E-Mail-Adressen zuzugreifen: Der Zugriff wird abgelehnt.
- Die endgültige Rundlöschung scheitert nach Beginn einer Teiloperation: Die Datenbanktransaktion
  wird vollständig zurückgerollt und weder Rundendaten noch globale Daten oder Nutzerkonten werden
  teilweise gelöscht.

## Requirements *(mandatory)*

### Functional Requirements

#### Konto und Sitzung

- **FR-001**: Das System MUSS Registrierung mit eindeutiger E-Mail-Adresse, Passwort und globalem
  Anzeigenamen ermöglichen.
- **FR-002**: Das System MUSS nach erfolgreicher Registrierung ohne E-Mail-Bestätigung unmittelbar
  eine aktive Sitzung bereitstellen.
- **FR-003**: Das System MUSS Anmeldung und Abmeldung mit E-Mail-Adresse und Passwort ermöglichen.
- **FR-004**: Das System MUSS Passwort-Zurücksetzung per E-Mail ermöglichen, obwohl die
  Registrierungsbestätigung deaktiviert ist.
- **FR-005**: Passwortfelder MÜSSEN Anzeigen/Verbergen und Passwortmanager unterstützen.
- **FR-006**: Fehlermeldungen bei Anmeldung, Registrierung und Passwort-Zurücksetzung DÜRFEN nicht
  unnötig offenlegen, ob ein bestimmtes Konto existiert.
- **FR-007**: Nach der Anmeldung MUSS das System abhängig von Tipprundenanzahl und offenem
  Einladungskontext zum fachlich passenden Ziel weiterleiten.

#### Globale Wettbewerbsverwaltung

- **FR-008**: Das System MUSS die globalen Rollen `user` und `app_admin` unterscheiden. Mehrere
  globale App-Admins MÜSSEN möglich sein, aber Vergabe und Entzug dieser Rolle DÜRFEN ausschließlich
  über einen kontrollierten, dokumentierten operativen Prozess außerhalb der App erfolgen.
  Selbsternennung und eine Adminrechteverwaltung in der App DÜRFEN nicht existieren.
- **FR-009**: App-Admins MÜSSEN Ligen mit stabilem Namen, optionalem Kurznamen und Lebenszyklusstatus
  zentral verwalten können.
- **FR-010**: App-Admins MÜSSEN Saisons mit Bezeichnung, Start-/Enddatum und Status zentral verwalten
  können.
- **FR-011**: App-Admins MÜSSEN aus Liga und Saison eine Liga-Saison bilden, konfigurieren,
  veröffentlichen, beenden und archivieren können.
- **FR-012**: App-Admins MÜSSEN Vereine mit eindeutigem Namen, Kurzname, optionalem Logo und Status
  zentral verwalten und Liga-Saisons zuordnen können.
- **FR-013**: App-Admins MÜSSEN Spieltage mit positiver Nummer, optionalem Anzeigenamen und Status
  innerhalb genau einer Liga-Saison verwalten können.
- **FR-014**: App-Admins MÜSSEN Spiele mit verschiedenen Heim-/Auswärtsvereinen, Anstoßzeit und
  Status innerhalb eines Spieltags verwalten können.
- **FR-015**: Vereine eines Spiels MÜSSEN der betreffenden Liga-Saison zugeordnet sein; identische
  Heim-/Auswärtsvereine und doppelte Begegnungen zur selben Anstoßzeit MÜSSEN verhindert werden.
- **FR-016**: Entwürfe DÜRFEN für normale Nutzer nicht auswählbar sein; veröffentlichte Spieltage und
  Spiele MÜSSEN in allen verbundenen Tipprunden sichtbar werden.
- **FR-017**: Nur App-Admins DÜRFEN globale Spielplan- und Ergebnisdaten verändern; Besitzer DÜRFEN
  diese Daten nicht bearbeiten.
- **FR-018**: Archivierung oder Korrektur globaler Inhalte DARF historische Tipps, Wertungen oder
  Ranglisten nicht zerstören.
- **FR-019**: Destruktive Änderungen an bereits verwendeten Spielen MÜSSEN eine starke Warnung und,
  wo historische Integrität betroffen wäre, einen Korrekturpfad statt physischer Löschung bieten.

#### Tipprunden, Mitgliedschaften und Einladungen

- **FR-020**: Ein angemeldeter Nutzer MUSS eine private, nicht durchsuchbare Tipprunde mit Name,
  genau einer veröffentlichten Liga-Saison und eigenem Tipprunden-Nickname erstellen können.
- **FR-021**: Der Ersteller MUSS atomar zum einzigen Besitzer und zu einem aktiven Mitglied der
  Tipprunde werden; wiederholte Requests DÜRFEN keine Duplikate erzeugen.
- **FR-022**: Eine Tipprunde MUSS jederzeit genau einen Besitzer besitzen und DARF ausschließlich
  die Mitgliedschaftsrollen `owner` und `member` kennen.
- **FR-023**: Co-Admins, weitere Tipprunden-Administratoren oder gleichwertige delegierte Rechte
  DÜRFEN weder fachlich noch technisch existieren.
- **FR-024**: Eine Tipprunde MUSS genau eine Liga-Saison referenzieren; nach dem ersten gespeicherten
  Tipp DARF diese Zuordnung nicht mehr geändert werden.
- **FR-025**: Ein Nutzer DARF derselben Tipprunde höchstens einmal aktiv angehören; aktive Nicknames
  MÜSSEN innerhalb einer Tipprunde eindeutig sein.
- **FR-026**: Mitglieder MÜSSEN ihre eigenen Tipprunden und deren freigegebene zentrale
  Wettbewerbsdaten sehen und ihre Mitgliedschaft verlassen können. Ein Besitzer MUSS den Besitz
  vor Austritt oder Kontolöschung atomar an ein bestehendes aktives Mitglied übertragen. Gibt es
  kein weiteres aktives Mitglied, DARF er nur die Tipprunde archivieren oder löschen. Zu keinem
  Zeitpunkt DÜRFEN null oder mehrere Besitzer existieren.
- **FR-027**: Der Besitzer MUSS Name, eigenen Nickname, Mitglieder, Einladung sowie Archivierung und
  Löschung genau seiner Tipprunde verwalten können.
- **FR-028**: Entfernte Mitglieder MÜSSEN sofort den Zugriff verlieren; historische Wertungen
  bleiben mit dem damaligen Nickname und dem Status „nicht mehr Mitglied“ sichtbar, solange keine
  Kontolöschung eine Anonymisierung verlangt.
- **FR-029**: Bei Kontolöschung MÜSSEN historische Tipps und Wertungen unverändert erhalten bleiben,
  damit frühere Ranglisten nicht neu berechnet werden. Sämtliche personenbezogenen Bezüge und der
  Tipprunden-Nickname MÜSSEN entfernt und je Tipprunde durch einen stabilen, nicht rückführbaren
  anonymen Platzhalter ersetzt werden.
- **FR-030**: Archivieren MUSS die reversible Standardaktion sein. Eine endgültige Löschung MUSS
  nach erneuter Bestätigung durch exakte Eingabe des Tipprunden-Namens als sofortiger,
  irreversibler Hard Delete ohne Wiederherstellungsfrist erfolgen. In genau einer Transaktion
  MÜSSEN Tipps, Punktewertungen, Mitgliedschaften, Einladungen und die Tipprunde gelöscht werden;
  globale Wettbewerbsdaten und Nutzerkonten MÜSSEN erhalten bleiben. Bei einem Fehler DARF nichts
  teilweise gelöscht werden. Nach Commit DARF nur ein minimales Audit-Ereignis mit Aktion,
  ausführendem Nutzer, Zeitpunkt und nicht sprechender Objekt-ID ohne Namen, Tipps oder
  Mitgliederdaten verbleiben.
- **FR-031**: Ein Besitzer MUSS einen nicht erratbaren Einladungslink erzeugen, anzeigen, kopieren,
  als QR-Code darstellen, widerrufen und ersetzen können.
- **FR-032**: Pro Tipprunde DARF höchstens eine Einladung aktiv sein; sie ist standardmäßig sieben
  Tage gültig und ein Ersatz MUSS den vorherigen Link sofort widerrufen.
- **FR-033**: Eine Einladungsvorschau MUSS vor dem Beitritt Name, Liga-Saison und Besitzer zeigen,
  ohne andere private Rundendaten offenzulegen.
- **FR-034**: Gäste MÜSSEN nach Anmeldung oder Registrierung zum ursprünglichen Einladungskontext
  zurückkehren; der Beitritt erfordert die Bestätigung eines Tipprunden-Nicknames.
- **FR-035**: Ungültige, abgelaufene oder widerrufene Einladungen MÜSSEN verständlich und ohne
  interne Details abgewiesen werden; bestehende Mitglieder werden direkt zur Runde geleitet.

#### Tippabgabe und Sichtbarkeit

- **FR-036**: Die Tipprunden-Übersicht MUSS zuerst nächsten relevanten Spieltag, Tippfortschritt,
  primäre Tippaktion, nächste Frist sowie eigene Platzierung und Punkte vermitteln.
- **FR-037**: Die Tippansicht MUSS Spieltage auswählbar machen, den nächsten unvollständigen Spieltag
  priorisieren und Spiele nach Datum und Anstoßzeit gruppieren.
- **FR-038**: Jedes Spiel MUSS Vereine, Logo oder Fallback, Anstoßzeit, Status und zwei numerische
  Toreingaben zugänglich darstellen.
- **FR-039**: Ein Tipp MUSS pro Nutzer, Tipprunde und Spiel eindeutig sein und darf nur vollständige,
  gültige Heim- und Auswärtstorwerte enthalten.
- **FR-040**: Sobald beide gültigen Torwerte eines Spiels vollständig eingegeben sind, MUSS genau
  dieser Tipp automatisch gespeichert werden. Nutzer MÜSSEN direkt am Spiel unterscheiden können,
  ob die Eingabe unvollständig, speichernd, bestätigt oder fehlgeschlagen ist; bei Fehlern MUSS die
  Eingabe erhalten bleiben und erneut übertragbar sein.
- **FR-041**: Ein Tipp MUSS bis exakt zur serverseitig bestimmten Anstoßzeit des jeweiligen Spiels
  neu angelegt oder geändert werden können und ab diesem Zeitpunkt gesperrt sein.
- **FR-042**: Spiele desselben Spieltags MÜSSEN unabhängig anhand ihrer jeweiligen Anstoßzeit
  gesperrt werden.
- **FR-043**: Bei Verschiebung MUSS die aktualisierte Anstoßzeit gelten und vorhandene Tipps MÜSSEN
  bestehen bleiben; abgesagte Spiele DÜRFEN weder tippbar noch wertbar sein.
- **FR-044**: Eigene Tipps MÜSSEN sichtbar bleiben; fremde Tipps DÜRFEN ausschließlich Mitgliedern
  derselben Tipprunde und erst nach Ablauf der jeweiligen Spielfrist sichtbar werden.
- **FR-045**: Ohne Serverbestätigung DARF kein Tipp als gespeichert dargestellt werden; Offline-
  Tippabgabe und spätere Konfliktsynchronisierung sind ausgeschlossen.

#### Ergebnisse, Punkte und Ranglisten

- **FR-046**: App-Admins MÜSSEN gültige Ergebnisse zentral je Spiel erfassen und korrigieren können;
  Änderungen MÜSSEN alten und neuen Wert, Bearbeiter, Zeitpunkt und optionalen Grund festhalten.
- **FR-047**: Ein Spiel DARF nur mit gültigem Ergebnis gewertet werden; abgesagte Spiele werden
  ausgeschlossen, und bei Abbruch MUSS der App-Admin zwischen offiziellem Ergebnis und
  Wertungsausschluss entscheiden.
- **FR-048**: Die Wertung MUSS exakt 4 Punkte für das richtige Ergebnis, 3 Punkte für richtige
  Tendenz und Tordifferenz, 2 Punkte für nur richtige Tendenz und sonst 0 Punkte vergeben.
- **FR-049**: Ein nicht exaktes Unentschieden MUSS 3 Punkte erhalten.
- **FR-050**: Ergebnisanlage oder -änderung MUSS alle betroffenen Wertungen atomar neu berechnen;
  identische Eingaben MÜSSEN stets identische Wertungen erzeugen.
- **FR-051**: Nutzer MÜSSEN erkennen können, wenn ein bereits gewertetes Ergebnis geändert wurde.
- **FR-052**: Jede Tipprunde MUSS eine Gesamtrangliste und für jeden relevanten Spieltag eine
  Spieltagsrangliste bereitstellen.
- **FR-053**: Ranglisten MÜSSEN nach Punkten absteigend ordnen, Punktgleiche auf denselben Rang
  setzen, den Folgerang entsprechend überspringen und innerhalb gleicher Punktzahl alphabetisch
  nach Tipprunden-Nickname sortieren.
- **FR-054**: Trefferstatistiken DÜRFEN in V1 nicht als Tie-Breaker verwendet werden; Ranglisten
  MÜSSEN je Tipprunde isoliert und die eigene Zeile zugänglich hervorgehoben sein.

#### Mobile-first PWA, UX und Datenschutz

- **FR-055**: Alle öffentlichen, Mitglieder- und Admin-Kernabläufe MÜSSEN mobile-first ab 320/375
  Pixel sowie auf Tablet und Desktop vollständig funktionieren.
- **FR-056**: Die mobile Navigation einer Tipprunde DARF höchstens die vier primären Ziele
  Übersicht, Tippen, Rangliste und Ergebnisse enthalten; Profil, Rundenwechsel und Einstellungen
  MÜSSEN sekundär erreichbar bleiben.
- **FR-057**: Jede Kernansicht MUSS genau eine eindeutig priorisierte Hauptaktion, ehrliches
  Zustandsfeedback und vollständig definierte Leer-, Lade-, Fehler-, Sperr- und Destruktivzustände
  besitzen.
- **FR-058**: Interaktive Touch-Ziele MÜSSEN mindestens 44 × 44 CSS-Pixel groß sein; numerische
  Tippfelder MÜSSEN eine geeignete mobile Eingabe unterstützen.
- **FR-059**: Die Anwendung MUSS als PWA installierbar sein und eigenen Namen, Kurzname, vollständige
  Icons einschließlich Maskable Icons, Standalone-Modus, Theme-/Hintergrundfarben und Safe-Area-
  Verhalten bereitstellen.
- **FR-060**: Die PWA MUSS eine verständliche Offline-Seite oder Offline-Statusanzeige und einen
  sicheren Update-Hinweis bieten, darf aber keine Offline-Tipps speichern oder synchronisieren.
- **FR-061**: Alle Kernabläufe MÜSSEN WCAG 2.2 AA erfüllen, einschließlich Tastaturzugang,
  sichtbarem Fokus, logischer Struktur, dauerhaft sichtbaren Labels, Live-Statusmeldungen,
  Fokusführung in Dialogen, Alternativtexten, Zoom und reduzierter Bewegung.
- **FR-062**: Farbe DARF nie der einzige Bedeutungsträger sein; Ranglisten MÜSSEN eine semantische
  Listen- oder Tabellenstruktur besitzen und normaler Text mindestens 4,5:1 Kontrast erreichen.
- **FR-063**: Nur angemeldete, berechtigte Nutzer DÜRFEN private Tipprunden sehen; E-Mail-Adressen
  DÜRFEN anderen Mitgliedern nicht angezeigt werden.
- **FR-064**: Das System DARF nur betriebsnotwendige personenbezogene Daten speichern. V1 MUSS als
  nicht-kommerzielle, einladungsbasierte Website für einen privaten Freundeskreis betrieben werden
  und DARF kein Impressum sowie keine private Anschrift, Steuer-, Register- oder Unternehmensangaben
  veröffentlichen. Ein knapper Nutzungs- und Datenschutzhinweis MUSS den privaten Zweck, tatsächlich
  eingebundene technische Dienstleister, verarbeitete Datenkategorien sowie Konto- und
  Löschmöglichkeiten wahrheitsgemäß beschreiben. Öffnung, Monetarisierung oder geschäftliche Nutzung
  erfordern vorab eine neue rechtliche Prüfung; nicht bestätigte Angaben DÜRFEN nicht erfunden werden.
- **FR-065**: V1 DARF weder Produktanalytics noch Real-User-Monitoring-Daten erheben. Eine spätere
  PII-freie, aggregierte Beobachtung benötigt eine eigene Spezifikation und Datenschutzentscheidung.
  Technische Logs DÜRFEN keine Tippinhalte, Passwörter, E-Mail-Adressen, Einladungs-Tokens oder
  private Rundennamen enthalten.
- **FR-066**: Produkttexte und visuelle Muster MÜSSEN Tipp-, Punkte- und Gemeinschaftssprache
  verwenden und DÜRFEN Echtgeld, Einsätze, Gewinne, Quoten, Buchmacher oder Glücksspiel nicht
  unterstützen oder nahelegen.

#### Neubau und externe Infrastrukturgrenze

- **FR-067**: Der Neubau MUSS im neuen Repository `Daniel-Braun123/A-KlassenHoizV2` mit einem neuen
  Datenmodell und einer frischen Migrationshistorie erfolgen.
- **FR-068**: Alter Anwendungscode, alte Datenmodelle, alte lokale Migrationen und automatische
  Übernahme alter Nutzer- oder Anwendungsdaten DÜRFEN nicht in den Neubau übernommen werden.
- **FR-069**: Das bestehende Supabase-Projekt `A-KlassenHoiz` mit der Projekt-Referenz
  `ewqzhdnfoozjzenzmtlm` in `eu-central-1` ist die eindeutig identifizierte und seit T274 bestätigt
  leere Infrastruktur für die spätere, separat freizugebende V2-Wiederverwendung.
- **FR-070**: Die Identifikation in FR-069 DARF nicht als Reset-Freigabe gelten. Ein Reset MUSS als
  separate, ausdrücklich bestätigte Implementierungsaufgabe mit genauer Löschliste, Schutz der
  Plattform-Schemas, dokumentierter Sicherungs-/Restoreentscheidung und Abschlussprüfung behandelt
  werden. Für die am 13. Juli 2026 freigegebene einmalige Altbestandslöschung hat der
  Projekteigentümer Export und Restore ausdrücklich abgewählt, den unwiederbringlichen Verlust
  akzeptiert und Zielprüfung, Vollinventar, Allowlist, Abbruchkriterien sowie Nachkontrolle als
  Ersatzkontrollen festgelegt.
- **FR-071**: Vor dem späteren Neubau-Setup MÜSSEN alte Anwendungstabellen, Daten, anwendungsbezogene
  Funktionen, Trigger, Policies, Typen, Auth-Nutzer, aktive Sitzungen, Storage-Inhalte und nicht
  mehr benötigte Konfigurationen im bestätigten Reset-Umfang kontrolliert entfernt werden; das
  Supabase-Projekt selbst, Referenz, Region und Abrechnung bleiben erhalten.
- **FR-072**: Die vorhandene Produktionsinfrastruktur und Domain DÜRFEN erst nach erfolgreicher
  Preview-Abnahme auf den Neubau umgeschaltet werden. Jede Produktionsmutation, insbesondere die
  Provisionierung des ersten App-Admins, Anlage synthetischer Testidentitäten/-daten,
  Produktionstest, anschließende Entfernung und Bereinigungsverifikation, MUSS als getrennter
  Schritt ausdrücklich freigegeben werden. Jede Freigabe MUSS Identitäten, Datenumfang, Testzweck
  und erforderliche Löschung benennen.

#### Querschnittliche Zugriffsanforderungen

- **FR-073**: Nutzer mit mehreren aktiven Tipprunden MÜSSEN jederzeit zwischen diesen Runden
  wechseln können; die zuletzt aktive Runde MUSS beim nächsten Einstieg bevorzugt werden.
- **FR-074**: Globale App-Admins DÜRFEN private Tipprunden im normalen Betrieb weder bearbeiten noch
  Mitglieder entfernen, Einladungen erzeugen oder fremde Tipps verändern. Für einen dokumentierten
  Support- oder Missbrauchsfall DARF eine zeitlich begrenzte, fall- und rundenbezogene Break-Glass-
  Freigabe ausschließlich notwendige Support-Metadaten lesend zugänglich machen. Pflichtgrund,
  Freigabezeitraum, App-Admin, Tipprunde, Metadatenumfang und jeder Zugriff MÜSSEN unveränderlich
  protokolliert werden. Fremde Tipps vor der jeweiligen Tippfrist, E-Mail-Adressen, Passwörter,
  Auth-Geheimnisse sowie Listen-, Export- und Mutationspfade MÜSSEN auch dann ausgeschlossen sein.

### Constitutional Requirements *(mandatory)*

- **Mobile/PWA**: Sämtliche Kernreisen MÜSSEN mobile-first, responsiv und als installierbare PWA
  abgenommen werden. Offline-Zustände dürfen keine unbestätigte Mutation als gespeichert ausgeben.
- **UX/design system**: Alle Oberflächen MÜSSEN dasselbe dokumentierte Designsystem, konsistente
  Interaktionszustände, mindestens 44 × 44 CSS-Pixel große Touch-Ziele und eine eindeutige
  Hauptaktion je Kernansicht verwenden.
- **Accessibility**: Alle Kernabläufe MÜSSEN WCAG 2.2 AA durch automatisierte und manuelle
  Tastatur-/Screenreader-Prüfungen nachweisen.
- **Privacy**: Tipprunden, Mitgliedschaften, Tipps, Wertungen und Ranglisten MÜSSEN privat und je
  Runde isoliert bleiben; personenbezogene Daten sind zu minimieren und bei Kontolöschung
  datenschutzkonform zu anonymisieren oder zu entfernen. Break-Glass darf nur zeitlich begrenzte,
  lesende Support-Metadaten liefern und niemals Vorfristtipps oder E-Mail-Adressen offenlegen.
- **Authorization/RLS**: Jeder sensible Zugriff MUSS serverseitig und durch objektbezogene
  Row-Level-Security-Regeln geschützt werden. Jede exponierte Tabelle benötigt RLS sowie Positiv-
  und Negativtests; die Serverzeit ist alleinige Autorität für Fristen und Sichtbarkeit. Die
  globale App-Adminrolle vermittelt keine Mutationsrechte in privaten Tipprunden.
- **Domain invariants**: Die 4/3/2/0-Wertung MUSS rein, deterministisch und idempotent sein. Jede
  Runde besitzt genau einen Besitzer, keine Co-Admins und genau eine zentral gepflegte Liga-Saison.
- **Product boundaries**: Öffentliche Runden, Wett-/Echtgeldkonzepte, konfigurierbare Wertung,
  duplizierte Spielpläne, Offline-Tippabgabe und zusätzliche V1-Gamification sind ausgeschlossen.
- **Clean-room/type safety**: Altcode, alte Modelle und Migrationen sind ausgeschlossen. Späterer
  TypeScript-Code MUSS im Strict Mode ohne ungeprüfte Typunterdrückung erstellt werden.
- **Test evidence**: Die Abnahme MUSS Unit-, Integrations-/Contract-, RLS-, End-to-End-,
  Accessibility- und PWA-Nachweise sowie die kritische Gesamtjourney enthalten.

### Key Entities *(include if feature involves data)*

- **Nutzerprofil**: Verknüpft ein Konto mit globalem Anzeigenamen, globaler Rolle `user` oder
  `app_admin`, Kontostatus und Zeitstempeln. Mehrere Profile dürfen `app_admin` sein; die Rolle wird
  ausschließlich über den kontrollierten operativen Prozess verwaltet.
- **Liga**: Globaler Wettbewerb mit stabilem Namen, optionalem Kurznamen und Status.
- **Saison**: Zeitraum mit Bezeichnung, Start-/Enddatum und Lebenszyklusstatus.
- **Liga-Saison**: Veröffentlichbare Verbindung aus Liga und Saison, die von mehreren Tipprunden
  gemeinsam genutzt wird.
- **Verein**: Zentraler Verein mit eindeutigem Namen, Kurzname, optionalem Logo und Status.
- **Liga-Saison-Verein**: Ordnet zentrale Vereine einer Liga-Saison zu.
- **Spieltag**: Nummerierte und statusbehaftete Gruppe von Spielen innerhalb einer Liga-Saison.
- **Spiel**: Begegnung zweier verschiedener zugeordneter Vereine mit Anstoßzeit und Status.
- **Ergebnis**: Globales Resultat genau eines Spiels mit nachvollziehbarer Änderungshistorie.
- **Tipprunde**: Private Gruppe mit genau einem Besitzer und genau einer Liga-Saison.
- **Mitgliedschaft**: Eindeutige Verbindung aus Nutzer und Tipprunde mit Nickname und ausschließlich
  der Rolle `owner` oder `member`.
- **Einladung**: Zeitlich begrenzter, widerrufbarer und nicht erratbarer Zugang zu genau einer
  Tipprunde, darstellbar als Link und QR-Code.
- **Tipp**: Eindeutige Vorhersage eines Mitglieds für ein Spiel innerhalb einer Tipprunde.
- **Punktewertung**: Reproduzierbares Ergebnis der 4/3/2/0-Berechnung für genau einen Tipp.
- **Ergebnisänderung**: Historischer Nachweis von altem und neuem Ergebnis, Bearbeiter, Zeitpunkt
  und optionalem Grund.
- **Support-Zugriffsfreigabe und -ereignis**: Zeitlich begrenzte, fall- und rundenbezogene
  Lesefreigabe für einen ausdrücklich festgelegten Support-Metadatenumfang sowie unveränderlicher
  Nachweis von Freigabe und jedem Zugriff; Vorfristtipps und E-Mail-Adressen gehören nie zum Scope.

### Scope Boundaries

**In scope for V1**:

- Registrierung, Login, Logout und Passwort-Zurücksetzung per E-Mail.
- Globale manuelle Verwaltung von Liga-Saisons, Vereinen, Spieltagen, Spielen und Ergebnissen.
- Private Tipprunden, Besitzer/Mitglieder und Link-/QR-Einladungen.
- Tippabgabe mit individueller Anstoßfrist, Ergebniswertung und isolierten Ranglisten.
- Mobile-first PWA, vollständige Tablet-/Desktop-Nutzung, WCAG 2.2 AA und Datenschutzfunktionen.
- Kontrolliert vorbereitete Wiederverwendung des identifizierten Supabase- und bestehenden
  Vercel-Projekts nach separat freigegebenen Bereinigungs- und Umschaltaufgaben.

**Out of scope for V1**:

- BFV-Import, Scraping oder automatische externe Spielplansynchronisierung.
- Co-Admins oder weitere administrative Tipprundenrollen.
- Öffentliche oder durchsuchbare Tipprunden.
- Echtgeld, Einsätze, Gewinne, Quoten, Buchmacher- oder Glücksspielmechaniken.
- Bonusfragen, Joker, Achievements, komplexe Gamification oder konfigurierbare Punktesysteme.
- Push-Benachrichtigungen, Erinnerungen, Social Feed, Kommentare oder Direktnachrichten.
- Offline-Tippabgabe, Hintergrund- oder Konfliktsynchronisierung.
- Native iOS-/Android-Apps oder umfangreiche Marketing-Website.
- Produktanalytics, Real-User-Monitoring und p75-Feldwert-Releasegrenzen.
- Automatischer Import alter Nutzer, Daten, Code, Datenmodelle oder Migrationen.
- Physischer Supabase-Reset im Rahmen dieser Spezifikationsarbeit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Alle fünf repräsentativen Testpersonen schließen Registrierung, Beitritt und
  vollständige Tippabgabe ohne Hilfe ab.
- **SC-002**: Der Median der erfolgreichen Durchläufe erstellt und teilt eine Tipprunde
  einschließlich Liga-Auswahl und bestätigtem Besitzer-Nickname in weniger als zwei Minuten.
- **SC-003**: Der Median der erfolgreichen Durchläufe tippt einen vollständigen Spieltag mit
  mindestens acht Spielen bei 375 Pixel Breite in weniger als drei Minuten vollständig und
  bestätigt.
- **SC-004**: Mindestens vier von fünf Testpersonen erkennen auf der Tipprunden-Übersicht ohne Hilfe,
  welche Tippaktion als Nächstes offen ist und wann die nächste Frist endet.
- **SC-005**: 100 % der geprüften Spiele akzeptieren Änderungen vor und verweigern Änderungen ab
  ihrer jeweils maßgeblichen Anstoßzeit, unabhängig von der Client-Uhr.
- **SC-006**: In 100 % der Berechtigungstests bleiben fremde Tipps vor der jeweiligen Frist,
  E-Mail-Adressen anderer Nutzer und private Rundendaten für Nichtmitglieder einschließlich
  App-Admins unsichtbar. Break-Glass liefert ausschließlich den freigegebenen Support-
  Metadatenumfang und besteht alle Zeitablauf-, Read-only- und Auditprüfungen.
- **SC-007**: 100 % der repräsentativen und randwertigen Beispieltippfälle werden reproduzierbar
  mit 4, 3, 2 oder 0 Punkten korrekt bewertet.
- **SC-008**: Nach jeder geprüften Ergebnisänderung stimmen sämtliche betroffenen Gesamt- und
  Spieltagsranglisten mit einer vollständigen Neuberechnung überein.
- **SC-009**: Spielpläne und Ergebnisse werden in der Abnahme genau einmal zentral gepflegt und von
  mindestens zwei Tipprunden ohne Duplikation gemeinsam verwendet.
- **SC-010**: Kein geprüfter Rollen- oder Verwaltungsablauf erzeugt eine Co-Admin-Rolle, mehr als
  einen Besitzer oder eine Tipprunde ohne Besitzer.
- **SC-011**: Alle Kernabläufe funktionieren bei 375 Pixel Breite ohne horizontalen Seiten-
  Scrollbereich sowie auf Tablet und Desktop vollständig.
- **SC-012**: Alle Kernoberflächen bestehen die vereinbarten automatisierten und manuellen
  WCAG-2.2-AA-Prüfungen ohne offenen kritischen Verstoß.
- **SC-013**: Die App ist auf den priorisierten Geräten installierbar, startet im eigenständigen
  Modus und meldet Offline- sowie Update-Zustände ohne falsche Speicherbestätigung.
- **SC-014**: Vor Veröffentlichung bestehen alle verpflichtenden Unit-, Integrations-/Contract-,
  Berechtigungs-, End-to-End-, Accessibility- und PWA-Prüfungen ohne offenen kritischen Fehler.
- **SC-015**: Vor Veröffentlichung gibt es keine offenen kritischen oder hohen Sicherheitsbefunde
  für exponierte Daten und Zugriffswege.
- **SC-016**: Die kritische Gesamtjourney von zentraler Liga-Anlage über Registrierung, Runde,
  Einladung, zwei Tippabgaben, Ergebnis, Punkte und beide Ranglisten funktioniert vollständig auf
  Smartphone, Desktop und im installierten Modus.

### Verbindliches Usability-Testprotokoll

- Es nehmen mindestens fünf repräsentative Personen ohne vorherige Produktschulung teil.
- iOS Safari und Android Chrome sind gemischt vertreten; mindestens ein Desktop-Test ergänzt die
  mobile Stichprobe.
- Der Moderator darf nicht bei Navigation oder Bedienung helfen.
- Start- und Endpunkt sowie Beginn und Ende der Zeitmessung werden je Aufgabe dokumentiert.
- Technische Ausfälle werden separat dokumentiert und nicht stillschweigend aus der Stichprobe
  entfernt.
- SC-001 und SC-004 werden als Personenanzahl bewertet; SC-002 und SC-003 über den Median der
  erfolgreichen Durchläufe.

## Assumptions

- `docs/PRD.md` Version 1.1 ist der einzige kanonische PRD-Pfad und die fachliche Source of Truth.
- Die Projektverfassung Version 2.0.0 ist für diese Spezifikation verbindlich und hat bei einem
  Konflikt mit nachrangigen Artefakten Vorrang.
- Der erste reale Nutzerkreis besteht aus Betreiber, Freunden und Bekannten; spätere weitere private
  Gruppen sind möglich, aber kein Vermarktungsziel von V1.
- Die Produktsprache ist Deutsch, und Zeiten werden fachlich in `Europe/Berlin` dargestellt.
- E-Mail-Bestätigung bleibt für Neuregistrierungen deaktiviert; Passwort-Zurücksetzung per E-Mail
  bleibt aktiv.
- Manuelle globale Spielplan- und Ergebnisverwaltung genügt für V1; externe Importe sind nicht
  erforderlich.
- Mehrere globale App-Admins sind in V1 zulässig. Ihre Rechte werden ausschließlich über einen
  kontrollierten operativen Prozess außerhalb der App vergeben oder entzogen. Sie besitzen keine
  regulären Verwaltungsrechte innerhalb privater Tipprunden.
- Aktive Tipprunden-Nicknames sind innerhalb einer Tipprunde eindeutig, um Ranglisten und
  historische Darstellung eindeutig verständlich zu halten.
- Bei Entfernung eines Mitglieds bleibt der damalige Nickname in historischen Wertungen mit einem
  Austrittshinweis sichtbar. Bei Kontolöschung bleiben Tipps und Wertungen unverändert, während
  Identität und Nickname je Tipprunde durch einen stabilen anonymen Platzhalter ersetzt werden.
- Das neue GitHub-Repository ist die alleinige Quellcodebasis des Neubaus.
- Das Supabase-Projekt `A-KlassenHoiz` (`ewqzhdnfoozjzenzmtlm`, `eu-central-1`) ist nach der
  allowlistbasierten Altbestandslöschung und unabhängigen T274-Nachkontrolle leer und
  `ACTIVE_HEALTHY`. Das erteilt ausdrücklich keine Freigabe für V2-Migrationen oder Konfiguration.
- Für die ausdrücklich freigegebene Altbestandslöschung wird auf Wunsch des Projekteigentümers kein
  Export oder Backup erstellt. Die exakte Löschliste, Schutzliste und Unwiederbringlichkeit werden
  vor Ausführung separat dokumentiert und danach read-only verifiziert.
- V1 erhebt keine Produktanalytics oder Real-User-Monitoring-Daten. V1 bleibt privat,
  nicht-kommerziell und einladungsbasiert; der Nutzungs-/Datenschutzhinweis wird erst nach Prüfung
  seiner tatsächlichen technischen Angaben eingebunden, ein Impressum und private
  Anschrift-/Steuerangaben nicht.
- Exakte Technologien, Versionen, Datenbankstruktur, Schnittstellen und Bereinigungsbefehle werden
  erst in Planung und separat autorisierter Implementierung festgelegt.
