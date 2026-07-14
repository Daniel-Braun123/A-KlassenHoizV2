# US3 unabhängiger Zwei-Nutzer-Abnahmenachweis

**Startpunkt:** Besitzer ist angemeldet und öffnet `/rounds/new`; eine veröffentlichte
Liga-Saison ist vorhanden.  
**Endpunkt:** Ein zweiter, zuvor nicht beteiligter Nutzer sieht die Runde nach Beitritt in seiner
eigenen Rundenliste.

Der automatisierte Browsernachweis führt ohne Datenbank- oder UI-Abkürzung aus:

1. Besitzer gibt Rundennamen, Liga-Saison und eindeutigen Nickname ein.
2. Die Anwendung erzeugt atomar Runde und einzige Owner-Mitgliedschaft.
3. Besitzer öffnet die Einstellungen und erzeugt einen neuen Sieben-Tage-Link.
4. Der QR-Code wird bedarfsweise aus demselben Link gerendert.
5. Ein neuer isolierter Browserkontext öffnet den Link unangemeldet.
6. Anmeldung erhält den Einladungskontext und kehrt zur Vorschau zurück.
7. Der zweite Nutzer wählt einen Rundennickname und tritt genau einmal bei.
8. Die Rundenliste des zweiten Nutzers enthält die private Runde.

**Ergebnis Mobile Chrome:** PASS.  
**Zeitnachweis Rundenerstellung:** rund 10 Sekunden im automatisierten Labordurchlauf und damit
unter dem Zwei-Minuten-Ziel. Dieser technische Lauf ersetzt nicht das spätere moderierte
Usability-Protokoll mit fünf repräsentativen Personen.
