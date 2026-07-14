# US3-Abnahme: private Tipprunden und Einladungen

**Stand:** 13. Juli 2026  
**Ergebnis:** PASS (lokales V2-Schema)

## Abgenommener Umfang

- atomare Rundenerstellung mit genau einer aktiven Owner-Mitgliedschaft;
- Rollen ausschließlich `owner` und `member`, ohne Co-Admin-Pfad;
- Auswahl genau einer veröffentlichten Liga-Saison;
- idempotente Erstellung auch bei parallelen gleichartigen Requests;
- genau ein aktiver, sieben Tage gültiger Einladungslink je Runde;
- Persistenz ausschließlich des SHA-256-Hashes eines zufälligen 256-Bit-Tokens;
- Linkrotation, Widerruf, neutrale Vorschau, QR-Code und idempotenter Beitritt;
- eindeutige aktive Nutzer und Nicknames je Runde;
- App-Admin-Deny für private Runden und Mitgliedschaften im Normalbetrieb.

## Nachweise

| Prüfung                                                                    |   Ergebnis |
| -------------------------------------------------------------------------- | ---------: |
| pgTAP/RLS/Storage (`npm run test:db`)                                      | 97/97 PASS |
| echte lokale Supabase-Integration einschließlich Parallelität              |   6/6 PASS |
| Mobile Chrome: Erstellen, Link/QR, zweiter Nutzer, Beitritt                |       PASS |
| Mobile Chrome: drei Axe-Prüfungen für Erstellen/Vorschau/Beitritt/Settings |   3/3 PASS |
| TypeScript strict, ESLint und Production Build                             |       PASS |

Der Klartexttoken existiert nur im erzeugenden Server-Request, im resultierenden Link und im
aktuellen Clientzustand. Er wird nicht in Tabellen, Dokumentation oder Testausgaben geschrieben.

## Unabhängigkeit

Der Slice funktioniert ohne Tippabgabe, Punkteberechnung, Ranglisten oder Break-Glass. Die
Rundenübersicht zeigt bis zur Spielplan-/Tippstory einen klaren Platzhalter für die nächste Aktion.
