# RLS and Data-API Access Matrix

Legende: `R` lesen, `C` anlegen, `U` ändern, `D` löschen, `RPC` ausschließlich kontrollierte Funktion, `—` immer verweigert. Jede erlaubte Zelle benötigt mindestens einen positiven Test; jede nicht erlaubte Zelle mindestens einen Negativtest. Cross-Round- und erratene-ID-Tests sind für jede private Ressource verpflichtend.

## Tabellen-/Read-Model-Matrix

| Ressource | anon | Nichtmitglied | Mitglied | Owner | App-Admin |
|---|---:|---:|---:|---:|---:|
| eigenes Profil | — | R/RPC-U | R/RPC-U | R/RPC-U | eigenes R/RPC-U |
| fremde Profile/E-Mail | — | — | nur freigegebener Anzeigename derselben Runde | gleich | —; E-Mail immer verweigert |
| veröffentlichte Liga-Saisons/Clubs/Spielplan | Einladungsvorschau minimal | R | R | R | R/RPC-CUD |
| Entwürfe globaler Daten | — | — | — | — | R/RPC-CUD |
| eigene Rundenliste | — | R eigene | R eigene | R eigene | keine reguläre Liste privater Runden |
| konkrete fremde Runde | — | — | R nur eigene Mitgliedschaft | R nur eigene Runde | nur allowlistbasierte Status-/Zeitmetadaten über gültigen Break-Glass-Grant |
| Mitgliedschaften | — | — | R derselben Runde | R + RPC-Verwaltung | nur opaque IDs/Status über gültigen Break-Glass-Grant, nie Nickname/E-Mail |
| Einladungsvorschau mit gültigem Token | R minimal | R minimal | R minimal | R minimal | R minimal |
| Einladungstabelle/-hash | — | — | — | RPC Rotation/Revocation | — |
| eigener Tipp vor/nach Frist | — | — | R + RPC-U vor Frist, R danach | gleich | eigene Mitgliedschaft wie Nutzer |
| fremder Tipp vor Frist | — | — | — | — | — |
| fremder Tipp ab Frist | — | — | R derselben Runde | R derselben Runde | nur bei eigener Mitgliedschaft |
| Wertungen/Ranglisten | — | — | R derselben Runde | R derselben Runde | nur bei eigener Mitgliedschaft |
| Ergebnisrevisionen | — | R veröffentlichte Markierung | R veröffentlichte Markierung | gleich | R/RPC-C über Ergebnisaktion |
| Break-Glass-Freigabe/-Audit | — | — | — | — | enge RPC-C/R; maximal 15 Minuten, read-only Metadatenscope |

## Mutationsregeln

- Basistabellen im Schema `app` haben für Browserrollen keine direkten DML-Verträge; Mutationen laufen über freigegebene `api`-RPCs.
- Jede RPC prüft Rolle, Profilstatus, Ressourcenzuordnung und Fachstatus erneut. Server Actions prüfen dasselbe vor dem RPC als erste Schutzschicht.
- RLS bleibt auf den Basistabellen aktiv; `SECURITY INVOKER` ist Standard.
- `UPDATE`-Policies besitzen sowohl `USING` als auch `WITH CHECK`; erforderliche `SELECT`-Rechte/Policies werden explizit getestet.
- Ein `app_admin` ist kein implizites Mitglied privater Tipprunden und hat keine generelle Prediction-SELECT-Policy.
- Ein `app_admin` besitzt keine privaten Rundenmutationen für Bearbeitung, Mitgliedschaft,
  Einladung oder Tipp. Break-Glass-Funktionen enthalten keine Prediction-/E-Mail-Quelle und
  akzeptieren ausschließlich einen aktiven Grant mit allowlistbasiertem Support-Metadatenscope.
- Ownerrechte leiten sich ausschließlich von der einzigen aktiven Owner-Mitgliedschaft/Ownerreferenz ab. Es existiert kein Co-Admin-Prädikat.
- Vorfrist-Sichtbarkeit verwendet DB-Zeit und die einzelne Spiel-Anstoßzeit; der Spieltag ist nie eine gemeinsame Sperrgrenze.

## Verpflichtende RLS-Testdimensionen

1. Rollen: `anon`, unauthenticated, aktiver Nichtmember, Member A, Member B gleiche Runde, Member andere Runde, Owner, App-Admin ohne Mitgliedschaft, deaktiviertes/zu löschendes Profil.
2. Zeit: eine Sekunde vor, exakt bei und eine Sekunde nach Anpfiff; zusätzlich Anstoßverschiebung während paralleler Anfrage.
3. Runde: richtige Runde, fremde Runde, Match aus anderer Liga-Saison, manipulierte Membership-ID.
4. Status: Draft, published, postponed, cancelled, abandoned/excluded, completed, archived.
5. Operation: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, View und jede RPC; Grants und RLS getrennt nachweisen.
6. Ownership: Erstanlage, parallele Anlage, Transfer, Owner-Austritt, Zielmitglied wird parallel entfernt, letzter Owner, Kontolöschung.
7. Audit/Support: Result revision und Break-Glass append-only; kein Update/Delete; Pflichtgrund,
   Grant-Erstellung, Ablauf exakt vor/bei/nach `expires_at`, Scope-Manipulation, abgelaufener/
   widerrufener Grant, Prediction-/E-Mail-/Listen-/Export-/Mutationsdeny.
8. Storage: public read, anon/authenticated write deny, App-Admin erlaubte MIME/Größe, unerlaubte MIME/Größe, Überschreiben fremder Pfade.

## Policy-Performance-Regeln

- `(select auth.uid())` statt wiederholtem nacktem `auth.uid()` pro Zeile.
- Indizes auf allen in Policies verwendeten FK-/Statuskombinationen, insbesondere aktive Mitgliedschaften, Runde/Match und Prediction-Sichtbarkeit.
- Keine Join-Ketten in Policies, wenn ein indizierter `EXISTS`-Helper mit exakt gleichem Schutzbereich möglich ist.
- `EXPLAIN (ANALYZE, BUFFERS)` für repräsentative Member-/Rankingabfragen im Performance-Nachweis; Optimierung darf die Policysemantik nicht lockern.
