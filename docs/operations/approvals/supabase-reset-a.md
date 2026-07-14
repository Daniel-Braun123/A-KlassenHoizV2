# Freigabe A: irreversible Supabase-Altbestandslöschung

**Aufgabe:** T272  
**Entscheidung:** AUSDRÜCKLICH FREIGEGEBEN  
**Datum:** 2026-07-13  
**Gültigkeit:** ausschließlich T268–T274

| Feld                         | Freigabe                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Freigeber                    | Projekteigentümer/Repository-Inhaber `Daniel-Braun123`                                                               |
| Operator                     | Codex über die lokal authentifizierte Supabase CLI                                                                   |
| Ziel                         | `A-KlassenHoiz` / `ewqzhdnfoozjzenzmtlm` / `eu-central-1`                                                            |
| Betroffene Identitäten       | 2 alte Auth-Nutzer, 2 Identitäten, 7 Sitzungen, 10 Refresh-Tokens; keine E-Mail-Adressen werden im Protokoll erfasst |
| Datenumfang                  | Exakte Allowlist aus `04-delete-allowlist.md`; keine Storage-Objekte/Buckets, Edge Functions oder Secrets vorhanden  |
| Zweck                        | Vollständig leerer Infrastruktur-Ausgangspunkt für den später separat freizugebenden V2-Neubau                       |
| Backup/Export                | ausdrücklich abgewählt                                                                                               |
| Restore/Rollback nach Commit | nicht möglich; unwiederbringlicher Verlust akzeptiert                                                                |
| Ausführung                   | eine PostgreSQL-Transaktion per Supabase CLI mit exakten Vor- und Nachbedingungen                                    |
| Verifikation                 | CLI- und Connector-Nachkontrolle; V2-Rollout bleibt gesperrt                                                         |

## Genehmigte Verfassungsausnahme

Verletzt wird ausschließlich die Sicherungs-/Rollbackpflicht aus Arbeitsablauf und Qualitätsgates
Nr. 6. Eine konforme Alternative existiert innerhalb der ausdrücklichen Nutzeranweisung „das alte
OHNE BACKUP löschen“ nicht. Die Ersatzkontrollen sind Ziel-Doppelprüfung, Vollinventar, exakte
Allowlist/Schutzliste, atomare Transaktion, Abbruch vor Mutation bei jeder Abweichung und unabhängige
Nachkontrolle. Der Rückbauplan besteht bis zum Commit im Transaktionsrollback; nach dem Commit ist
nur eine leere Vorwärtsinitialisierung möglich. Die Ausnahme läuft mit T274 aus.

Datenschutz, Sicherheit, Clean-Room-Grenze, das Verbot von Co-Admins/Wettkonzepten und alle anderen
Verfassungsprinzipien bleiben unberührt. Diese Freigabe autorisiert insbesondere weder Freigabe B,
V2-Migrationen, Auth-/Storage-/API-Konfiguration, App-Admin-Provisionierung, synthetische
Produktionsdaten, Vercel noch GitHub-Mutationen.

## Freigabenachweis

Nutzernachricht im aktuellen Codex-Task vom 2026-07-13:

> ebenfalls darfst du jetzt schon mal in supabase zugreifen per cli und das alte OHNE BACKUP löschen

Die Großschreibung wurde als ausdrücklicher Verzicht auf Sicherung/Export und Akzeptanz der
Irreversibilität verstanden; Ziel und Umfang waren bereits in PRD, Plan und Tasks eindeutig benannt.
