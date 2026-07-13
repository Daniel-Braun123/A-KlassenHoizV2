# Application Action Contracts

Diese Verträge beschreiben die fachliche Grenze zwischen Next.js und Supabase. Konkrete Funktionsnamen dürfen bei der Implementierung präzisiert werden; Eingabe-, Autorisierungs-, Transaktions- und Fehlersemantik sind verbindlich.

## Gemeinsamer Vertrag

Jede Mutation:

1. akzeptiert ein strikt validiertes, größenbegrenztes DTO und optional einen Idempotenzschlüssel;
2. verifiziert die Supabase-Sitzung serverseitig;
3. prüft `profile.status = active` und objektbezogene Rechte;
4. führt die kanonische DB-RPC mit Benutzer-JWT aus;
5. gibt ein diskriminiertes Ergebnis ohne interne SQL-, Policy- oder Authdetails zurück;
6. invalidiert ausschließlich betroffene Next.js-Caches/Read Models;
7. loggt weder E-Mail, Passwort, Einladungstoken noch Tippinhalt.

Fehlercodes: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT`, `DEADLINE_PASSED`, `NOT_FOUND`, `RATE_LIMITED`, `RETRYABLE`, `INTERNAL`. `NOT_FOUND` und `FORBIDDEN` werden an privacy-sensitiven Grenzen vereinheitlicht.

## Auth

### `register`

- Input: `email`, `password`, `displayName`, optionaler servergebundener Einladungskontext.
- Ergebnis: aktive Sitzung und nächstes fachliches Ziel.
- Regeln: E-Mail-Bestätigung aus; Passwortmanager/Paste erlaubt; keine Account-Existenz-Offenlegung.

### `signIn`, `signOut`, `requestPasswordReset`, `completePasswordReset`

- Supabase Auth bleibt kanonisch.
- Redirect-Ziele werden serverseitig gegen eine Allowlist validiert.
- Passwortwerte erscheinen nie in Logs, Analytics oder Action-State.

## Globale Wettbewerbsverwaltung

### `create/update/publish/complete/archiveLeagueSeason`

- Actor: `app_admin`.
- Input: Version plus explizite Fachfelder.
- Konflikt: veraltete Version oder unzulässiger Statusübergang.
- Historische Liga-Saisons werden nicht überschrieben/gelöscht.

### `create/updateClub` und `assignClubToLeagueSeason`

- Actor: `app_admin`.
- Logo-Upload ist getrennt, MIME-/größenvalidiert und liefert einen versionierten Pfad.
- Ein Verein kann nicht aus einer Liga-Saison entfernt werden, wenn Spiele ihn verwenden; stattdessen Statuspfad.

### `create/update/publishMatchday` und `create/updateMatch`

- Actor: `app_admin`.
- DB validiert Liga-Saison-Zuordnung beider Vereine, unterschiedliche Teams und Duplikate.
- Eine Anstoßänderung erhöht die Version und bewahrt bestehende Tipps. Der neue Zeitpunkt ist sofort kanonisch.
- Bereits verwendete Spiele sind nicht physisch löschbar; Korrektur/Statusänderung ist der einzige Pfad.

### `setMatchResult`

- Actor: `app_admin`.
- Input: `matchId`, gelesene Version/Revision, `official(homeGoals, awayGoals)` oder `excluded`, optionaler Grund.
- Atomar: Row Lock → Ergebnis schreiben → Revision append-only → alle Wertungen dieses Spiels vollständig neu berechnen.
- Output: neue Revision, Anzahl neu berechneter Wertungen, betroffene Read-Model-Tags.

## Tipprunden und Mitgliedschaften

### `createRound`

- Actor: angemeldeter aktiver Nutzer.
- Input: `name`, veröffentlichte `leagueSeasonId`, `nickname`, Idempotenzschlüssel.
- Atomar: Runde + genau eine aktive Owner-Mitgliedschaft + Ownerreferenz.

### `updateRound`

- Actor: einziger Owner.
- Name/Nickname validieren; Liga-Saison nur ändern, solange kein Tipp existiert.

### `archiveRound` / `deleteRound`

- Actor: einziger Owner.
- Archiv ist der reversible Standardpfad.
- Delete verlangt exakte Rundennamenseingabe und aktuelle Version und ist nach Commit sofort und
  irreversibel ohne Wiederherstellungsfrist.
- Atomar: minimales PII-freies Audit mit neuer nicht sprechender Objekt-ID anlegen; danach
  Punktewertungen, Tipps, Einladungen, Mitgliedschaften und Runde löschen. Jeder Fehler rollt die
  gesamte Transaktion zurück.
- Delete betrifft nie Nutzerkonten oder zentrale Liga-/Spielplan-/Vereins-/Ergebnisdaten.

### `transferOwnership`

- Actor: aktueller Owner.
- Input: bestehende aktive Zielmitgliedschaft und aktuelle Rundenversion.
- Atomar: Ziel wird Owner, bisheriger Owner Member, Ownerreferenz wechselt; zu keinem Commitzeitpunkt null/mehrere Owner.

### `leaveRound` / `removeMember`

- Austritt: eigenes aktives Mitglied; Owner nur nach zuvor atomar erfülltem Transfer oder über Archiv-/Löschpfad ohne weiteres Mitglied.
- Entfernen: Owner, Ziel ist aktives Member und niemals der Owner.
- Historische Zeilen bleiben sichtbar; Zugriff endet in derselben Transaktion.

## Einladungen

### `rotateInvitation`

- Actor: Owner.
- Atomar: aktive Einladung widerrufen, 256-Bit-Token erzeugen, nur SHA-256 speichern, Ablauf `clock_timestamp() + 7 days`.
- Output enthält Klartext-Token genau einmal; dieser Wert darf nicht geloggt oder persistiert werden.

### `getInvitationPreview`

- Actor: anon oder authenticated mit Token.
- Output: Rundenname, Liga-Saison, Owner-Anzeigename/-nickname, Gültigkeitszustand; keine Mitgliederliste oder Tipps.
- Ungültig/abgelaufen/widerrufen liefert denselben neutralen Fehler.

### `joinRound`

- Actor: authenticated.
- Input: Token, Nickname, Idempotenzschlüssel.
- Atomar: Hash/Frist/Widerruf prüfen, aktives Doppelmitglied erkennen, Nickname reservieren, Mitgliedschaft anlegen.
- Bestehende Mitglieder erhalten Erfolg mit bestehendem Rundenziel statt Duplikat.

## Tipps

### `savePrediction`

- Actor: aktive Mitgliedschaft derselben Runde.
- Input: `roundId`, `matchId`, zwei ganze Tore 0–99, Idempotenzschlüssel.
- Atomar: Spiel sperren; veröffentlichten/tippbaren Status, Liga-Saison und `clock_timestamp() < kickoff_at` prüfen; Upsert; Rundensperre für Liga-Saison setzen.
- Output: kanonischer Tipp, `savedAt`, `kickoffAt`, `locked` und Serverbestätigung.
- Genau bei `clock_timestamp() = kickoff_at` lautet das Ergebnis `DEADLINE_PASSED`.

### `getVisiblePredictions`

- Actor: aktives/gegebenenfalls historisch sichtbares Mitglied derselben Runde.
- Eigene Tipps immer; fremde Tipps pro Spiel erst ab Deadline. Nichtmitglieder erhalten keine Existenzbestätigung.

## Ranking und Ergebnisse

### `getOverallRanking` / `getMatchdayRanking`

- Actor: berechtigtes Rundenmitglied.
- Output: stabil paginierbare Zeilen mit Rang, Nickname/Anonymplatzhalter, Mitgliedsstatus, Punkten und `isCurrentUser`.
- Rang nur nach Punkten; Gleichstand gemeinsamer Rang mit Lücke; Anzeige alphabetisch.

### `getResults`

- Actor: Rundenmitglied; globale veröffentlichte Ergebnisse können zusätzlich als nicht-private Daten gelesen werden, aber ohne Rundenbezug.
- Output kennzeichnet geänderte Ergebnisse anhand Revision > 1.

## Datenschutz und Support

### `deleteAccount`

- Actor: der Nutzer nach erneuter Authentifizierung/Sicherheitsbestätigung.
- Vorbedingung: jede eigene Runde hat übertragenen Owner oder wurde archiviert/gelöscht.
- Schritt 1 atomar: Profil sperren, PII entfernen, alle Mitgliedschaften entkoppeln und je Runde stabil anonymisieren.
- Schritt 2 server-only: Supabase Auth Admin API löscht den Auth-Nutzer und widerruft Sessions. Fehler führt zu idempotentem `deletion_pending`, nie zu reaktiviertem Zugriff.

### `grantSupportMetadataAccess` / `readSupportMetadata`

- Actor: `app_admin`; die globale Rolle allein vermittelt keinerlei privaten Rundenread oder
  private Mutation.
- Grant-Input: genau eine `roundId`, nichtleerer allowlistbasierter `metadataScope`,
  Pflichtbegründung, optionaler Fallbezug; servergesetzter Ablauf nach maximal 15 Minuten.
- Read-Input: aktiver Grant und exakt eine erlaubte Metadatenabfrage.
- Atomar: Rolle, Fall, Runde, Scope, Widerruf und DB-Zeit prüfen; Freigabe beziehungsweise Zugriff
  unveränderlich auditieren; nur Status-/Zeit-/opaque Objektmetadaten zurückgeben.
- Fremde Tipps vor der Frist, E-Mail-Adressen, Auth-Daten, Tippänderungen sowie Listen-, Such-,
  Export-, Verlängerungs- und Dauerfreigabeverträge existieren nicht.
