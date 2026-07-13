# Phase 1 Data Model: A-KlassenHoiz V2

**Status**: Technischer Entwurf, keine Migration ausgeführt  
**Konventionen**: PostgreSQL 17, `snake_case`, UTC-`timestamptz`, fachliche Anzeige in `Europe/Berlin`, UUIDs für fachlich adressierbare Objekte

## 1. Schema- und Expositionsmodell

```text
auth (Supabase-verwaltet)
└── users

app (nicht über Data API exponiert)
├── profiles
├── leagues / seasons / league_seasons
├── clubs / league_season_clubs
├── matchdays / matches
├── match_results / result_revisions
├── prediction_rounds / round_memberships
├── predictions / prediction_scores
└── admin_access_events

private (nicht exponiert)
├── invitations
├── support_access_grants
├── destructive_audit_events
├── gehärtete Helper
└── rein operative/anonymisierte Auditdetails

api (einziges Data-API-Schema)
├── security_invoker views
└── explizit freigegebene RPCs
```

RLS ist auf jeder `app`-Tabelle aktiviert und erzwungen. Das `api`-Schema darf keine Basistabelle enthalten. `anon` und `authenticated` erhalten nur die tatsächlich benötigten `USAGE`, `SELECT`- und `EXECUTE`-Rechte; Default Grants bleiben entzogen.

## 2. Gemeinsame Konventionen

- Fachobjekte: `uuid` mit `gen_random_uuid()`; Auditfolgen dürfen `bigint generated always as identity` verwenden.
- Zeiten: `timestamptz NOT NULL`; reine Saisondaten: `date`.
- Torwerte: `smallint` mit `0 <= goals <= 99`.
- Status und Rollen: neue, ausschließlich V2-eigene PostgreSQL Enums oder Check Constraints; keine Alt-Typen übernehmen.
- Optimistic Concurrency: veränderbare Adminobjekte führen `version integer NOT NULL DEFAULT 1`; RPCs erwarten die gelesene Version.
- Jeder Fremdschlüssel erhält einen passenden Index, sofern er nicht bereits linksseitig in einem Unique-/Primary-Key-Index enthalten ist.
- Fachlich genutzte Datensätze werden archiviert/korrigiert statt physisch gelöscht; physisches Löschen ist nur für ausdrücklich vorgesehene Runden-/Kontopfade zulässig.
- Der Hard Delete einer Runde entfernt in einer Transaktion alle abhängigen privaten Daten. Das
  minimale Lösch-Audit besitzt keinen FK auf die Runde und speichert weder Namen noch Tipps oder
  Mitgliederdaten.
- PII befindet sich nur in Supabase Auth und den minimalen Profil-/Mitgliedschaftsfeldern. E-Mail wird nicht in Domänentabellen gespiegelt.

## 3. Tabellen

### `app.profiles`

| Spalte | Typ | Regeln |
|---|---|---|
| `user_id` | `uuid` | PK, FK `auth.users(id)` |
| `display_name` | `text` | 1–80 Zeichen, getrimmt |
| `app_role` | `app_role` | `user` oder `app_admin`, Default `user` |
| `status` | `profile_status` | `active`, `deletion_pending`, `disabled` |
| `last_active_round_id` | `uuid NULL` | FK auf Runde, nur als Präferenz; Berechtigung wird neu geprüft |
| `created_at`, `updated_at` | `timestamptz` | servergesetzt |

`app_role` ist nicht über eine Nutzer-RPC änderbar. Provisionierung/Entzug von `app_admin` erfolgt ausschließlich über ein versioniertes operatives Skript mit benanntem Operator und Audit außerhalb der App.

### `app.leagues`

`id`, eindeutiger `name`, optionaler eindeutiger `short_name`, `status` (`draft`, `active`, `archived`), `version`, Zeitstempel. Nur App-Admins schreiben; normale Nutzer lesen nur über veröffentlichte Liga-Saisons.

### `app.seasons`

`id`, eindeutiges `label`, `starts_on`, `ends_on`, `status`, `version`, Zeitstempel. Check: `starts_on <= ends_on`.

### `app.league_seasons`

| Spalte | Typ | Regeln |
|---|---|---|
| `id` | `uuid` | PK |
| `league_id` | `uuid` | FK Liga |
| `season_id` | `uuid` | FK Saison |
| `status` | `league_season_status` | `draft`, `published`, `completed`, `archived` |
| `published_at`, `completed_at`, `archived_at` | `timestamptz NULL` | passend zum Status |
| `version` | `integer` | Optimistic Concurrency |

Unique: `(league_id, season_id)`. Erlaubte Übergänge: `draft → published → completed → archived`; eine Korrektur ändert Inhalte innerhalb kontrollierter RPCs, nicht den historischen Schlüssel.

### `app.clubs`

`id`, case-insensitive eindeutiger `name`, `short_name`, optionaler `logo_path`, `status` (`active`, `archived`), `version`, Zeitstempel. `logo_path` verweist nur auf versionierte Objekte in `club-logos`; Löschung eines verwendeten Vereins ist gesperrt.

### `app.league_season_clubs`

PK `(league_season_id, club_id)`, `status` (`active`, `withdrawn`), Zeitstempel. Die Zuordnung ist die erlaubte Vereinsmenge aller Spiele dieser Liga-Saison.

### `app.matchdays`

`id`, `league_season_id`, positive `number`, optionaler `display_name`, `status` (`draft`, `published`, `completed`, `archived`), `version`, Zeitstempel. Unique `(league_season_id, number)`.

### `app.matches`

| Spalte | Typ | Regeln |
|---|---|---|
| `id` | `uuid` | PK |
| `matchday_id` | `uuid` | FK Spieltag |
| `home_club_id`, `away_club_id` | `uuid` | beide in zugehöriger Liga-Saison |
| `kickoff_at` | `timestamptz` | kanonische Tippfrist |
| `status` | `match_status` | `draft`, `published`, `postponed`, `cancelled`, `completed`, `abandoned` |
| `version` | `integer` | schützt parallele Adminänderungen |
| Zeitstempel | `timestamptz` | servergesetzt |

Checks/Constraints: Heim ≠ Auswärts; Unique `(matchday_id, home_club_id, away_club_id, kickoff_at)`; Constraint Trigger validiert beide Vereine gegen die Liga-Saison des Spieltags. Physische Löschung ist gesperrt, sobald Tipps oder Revisionen existieren. Verschiebung ändert `kickoff_at` kontrolliert und bewahrt Tipps.

### `app.match_results`

| Spalte | Typ | Regeln |
|---|---|---|
| `match_id` | `uuid` | PK/FK Spiel |
| `decision` | `result_decision` | `official` oder `excluded` |
| `home_goals`, `away_goals` | `smallint NULL` | beide gesetzt nur bei `official` |
| `revision_no` | `integer` | monoton je Spiel |
| `updated_by` | `uuid` | FK App-Admin-Profil |
| `updated_at` | `timestamptz` | DB-Zeit |

Check: `official` verlangt beide Torwerte; `excluded` verlangt beide `NULL`. Eine Ergebnis-RPC sperrt Spiel/Ergebnis, schreibt Revision und berechnet alle betroffenen Einzelwertungen in derselben Transaktion neu.

### `app.result_revisions`

Append-only: `id bigint identity`, `match_id`, `revision_no`, alter/neuer Entscheid und alte/neue Torwerte, `changed_by`, optionaler getrimmter `reason`, `changed_at`. Unique `(match_id, revision_no)`. `UPDATE` und `DELETE` sind für alle Anwendungsrollen verboten.

### `app.prediction_rounds`

| Spalte | Typ | Regeln |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | 1–80 Zeichen |
| `league_season_id` | `uuid` | genau eine veröffentlichte Liga-Saison |
| `owner_membership_id` | `uuid` | NOT NULL, deferrable FK auf Mitgliedschaft; deferred Constraint Trigger erzwingt dieselbe Runde sowie `active` + `owner` |
| `status` | `round_status` | `active`, `archived` |
| `has_predictions` | `boolean` | serververwaltet/latch; nach erstem Tipp `true` |
| `version` | `integer` | Optimistic Concurrency |
| Zeitstempel | `timestamptz` | servergesetzt |

Sobald `has_predictions = true`, kann `league_season_id` nicht mehr geändert werden. Runden sind nicht suchbar; es existiert keine öffentliche Listen-View.

### `app.round_memberships`

| Spalte | Typ | Regeln |
|---|---|---|
| `id` | `uuid` | PK |
| `round_id` | `uuid` | FK Runde |
| `user_id` | `uuid NULL` | FK Auth-Profil; `NULL` nach Anonymisierung |
| `role` | `round_role` | nur `owner` oder `member` |
| `nickname` | `text` | 1–40 Zeichen oder stabiler anonymer Platzhalter |
| `status` | `membership_status` | `active`, `left`, `removed`, `anonymized` |
| `joined_at`, `ended_at` | `timestamptz` | Verlauf |
| `anonymization_key` | `uuid NULL` | zufällig, nur für stabilen Platzhalter; kein Nutzerbezug |

Constraints/Indexes:

- partiell unique `(round_id, user_id) WHERE status = 'active' AND user_id IS NOT NULL`;
- partiell unique `(round_id, lower(nickname)) WHERE status = 'active'`;
- partiell unique `(round_id) WHERE role = 'owner' AND status = 'active'`;
- deferrable Integritätsprüfung: `prediction_rounds.owner_membership_id` zeigt auf genau den einzigen aktiven Owner derselben Runde.

Historische Mitgliedschaften werden nicht wieder aktiviert; ein erneuter Beitritt erzeugt eine neue Mitgliedschaft. Ownertransfer aktualisiert alte/neue Rolle und `owner_membership_id` atomar.

### `private.invitations`

`id`, `round_id`, `token_hash bytea`, `created_by_membership_id`, `expires_at`, `revoked_at`, `created_at`. Partiell unique `(round_id) WHERE revoked_at IS NULL`; `token_hash` unique. Ablauf wird in RPCs mit DB-Zeit geprüft. Nur Hash wird persistiert; der Klartext wird nie geloggt.

### `app.predictions`

| Spalte | Typ | Regeln |
|---|---|---|
| `id` | `uuid` | PK |
| `round_id` | `uuid` | FK Runde |
| `membership_id` | `uuid` | aktive Mitgliedschaft beim Speichern |
| `match_id` | `uuid` | Spiel derselben Liga-Saison |
| `home_goals`, `away_goals` | `smallint` | vollständig, 0–99 |
| `created_at`, `updated_at` | `timestamptz` | DB-Zeit |

Unique `(round_id, membership_id, match_id)`. Constraint Trigger validiert Mitgliedschaft und Liga-Saison. Schreiben ausschließlich über `api.save_prediction`; lesen über zeit-/mitgliedschaftsabhängige Views/RPCs. Nach Frist existiert keine Änderungsoperation.

### `app.prediction_scores`

`prediction_id` als PK/FK, `points smallint` mit `IN (0,2,3,4)`, `result_revision_no`, `calculation_version smallint`, `calculated_at`. Keine direkten DML-Rechte. Das Ergebnis `excluded` oder ein abgesagtes Spiel besitzt keine Wertungszeile.

### `private.support_access_grants`

Kurzlebige read-only Freigabe: `id uuid`, `admin_user_id`, `round_id`, nichtleerer allowlistbasierter
`metadata_scope`, getrimmte Pflicht-`reason`, optionaler `case_reference`, `issued_at`, zwingendes
`expires_at` mit maximal 15 Minuten Laufzeit sowie optionales `revoked_at`. Eine Freigabe ist weder
verlängerbar noch übertragbar. Der Scope darf nur Status-/Zeit-/Objektmetadaten der Kategorien
Runde, Mitgliedschaft, Einladung und Frist enthalten; Namen, E-Mail-Adressen, Auth-Daten,
Tippwerte, Wertungen und Ranglisten sind ausgeschlossen. Keine direkten Client-Grants.

### `app.admin_access_events`

Append-only: `id bigint identity`, `grant_id`, `admin_user_id`, `round_id`, unveränderlicher
`metadata_scope`, `reason`, `case_reference`, `accessed_at`, `grant_expires_at`. Freigabe und jeder
tatsächliche Lesezugriff erhalten ein eigenes Ereignis. Keine UPDATE-/DELETE-Grants; Zugriff nur
über enges Audit-Reporting. Das Ereignis enthält keine zurückgegebenen Metadatenwerte.

### `private.destructive_audit_events`

Append-only und ohne FK auf gelöschte Fachobjekte: `id bigint identity`, `action`,
`actor_user_id`, zufällige nicht sprechende `object_audit_id uuid`, `occurred_at`. Für den
Runden-Hard-Delete sind Rundename, fachliche Runden-ID, Tipps, Werte, Mitgliedschaften und weitere
Payloads verboten.

## 4. Kanonische reine Wertungsfunktion

```text
score(predicted_home, predicted_away, actual_home, actual_away): 0 | 2 | 3 | 4

if predicted scores equal actual scores                         => 4
else if predicted difference equals actual difference          => 3
else if sign(predicted difference) equals sign(actual difference) => 2
else                                                            => 0
```

Die Reihenfolge ist Teil des Vertrags. Dadurch gilt insbesondere:

- exaktes Unentschieden: 4;
- anderes Unentschieden: 3;
- gleicher Sieger und gleiche Tordifferenz: 3;
- nur gleicher Sieger: 2;
- falsche Tendenz: 0.

Die Funktion ist `IMMUTABLE`, `STRICT`, ohne Tabellenzugriff und erhält eine feste `calculation_version = 1`. Alle Grenz- und Repräsentativfälle werden in pgTAP als Datentabelle getestet.

## 5. RLS-/Autorisierungsprinzipien

- Öffentlich/anon: ausschließlich Auth-Flows, Rechtstexte, veröffentlichte Einladungsvorschau über gültiges Token und globale nicht-private Assets.
- Angemeldeter Nichtmitglied: keine Rundendaten, Mitgliedschaften, Tipps, Wertungen oder Ranglisten.
- Mitglied: eigene aktive Runden; fremde Tipps nur derselben Runde und erst ab `clock_timestamp() >= kickoff_at`.
- Owner: Mitgliedsrechte plus Verwaltungsoperationen genau der eigenen Runde; keine globale Wettbewerbsänderung.
- App-Admin: ausschließlich globale Liga-/Spielplan-/Ergebnisverwaltung. Keine regulären privaten
  Rundenreads oder -mutationen. Ein gültiger, nicht abgelaufener Break-Glass-Grant erlaubt nur den
  allowlistbasierten read-only Support-Metadatenumfang; Vorfristtipps und E-Mail-Adressen bleiben
  ohne Ausnahme gesperrt.
- `deletion_pending`/`disabled`: keine fachlichen Lese- oder Schreibrechte.

Die vollständige Aktionsmatrix steht in `contracts/rls-access-matrix.md`.

## 6. Abgeleitete Read Models

- `api.round_overview`: nächste relevante Frist, Tippfortschritt, eigene Punkte und Platzierung.
- `api.matchday_prediction_sheet`: veröffentlichte Spiele plus eigener Tippzustand; keine fremden Vorfristtipps.
- `api.round_predictions_after_deadline`: fremde Tipps nur durch RLS/DB-Zeit freigegeben.
- `api.overall_ranking` und `api.matchday_ranking`: Summe aus `prediction_scores`, SQL `rank()` nur nach Punkten, alphabetische Anzeige bei Gleichstand.
- `api.results`: freigegebene Ergebnisse einschließlich sichtbarer Revisionsmarkierung.

Alle Views sind `security_invoker = true`, geben minimale Spalten zurück und leiten keine E-Mail- oder Auth-Daten durch.

## 7. Lebenszyklus- und Transaktionsgrenzen

| Operation | Atomarer Umfang |
|---|---|
| Runde anlegen | Runde + aktive Owner-Mitgliedschaft + Owner-FK |
| Einladung ersetzen | bisherige Einladung widerrufen + neuer Hash/Frist |
| Einladung annehmen | Token/Frist prüfen + Nickname reservieren + Mitgliedschaft anlegen |
| Tipp speichern | Spiel sperren + Serverfrist/Status prüfen + idempotenter Upsert + `has_predictions` setzen |
| Owner übertragen | Zielmitglied prüfen + beide Rollen + Owner-FK |
| Ergebnis ändern | Ergebnis sperren + Revision + vollständige Einzelwertungs-Neuberechnung |
| Mitglied entfernen/verlassen | Statuswechsel + unmittelbarer RLS-Entzug; Ownerpfad nur mit Transfer/Archiv/Löschung |
| Konto anonymisieren | Ownerinvarianten prüfen + Mitgliedschaften entkoppeln/anonymisieren + Profil sperren; Auth-Löschung idempotent nachgelagert |
| Runde endgültig löschen | exakten Rundennamen/Version prüfen + minimales Lösch-Audit anlegen + Punktewertungen, Tipps, Einladungen, Mitgliedschaften und Runde in derselben Transaktion löschen; jeder Fehler rollt alles zurück |
| Break-Glass freigeben/lesen | App-Admin/Fall/Runde/Allowlist/15-Minuten-Ablauf prüfen + Freigabe-/Zugriffsaudit append-only schreiben + ausschließlich freigegebene Support-Metadaten zurückgeben |

## 8. Lösch- und Aufbewahrungsregeln

- Auth-Kontolöschung entfernt E-Mail und Auth-Geheimnisse über den unterstützten Adminweg.
- Historische Tipps/Wertungen bleiben; Mitgliedschaften werden irreversibel anonymisiert.
- Entfernte/ausgetretene Mitglieder behalten den damaligen Nickname mit Status, solange keine Kontolöschung Anonymisierung verlangt.
- Ergebnisrevisionen, Break-Glass-Audits und minimale Lösch-Audits sind append-only und werden nicht durch normale UI-Aktionen gelöscht.
- Eine bestätigte Rundenlöschung verlangt die exakte Namenseingabe und löscht sofort und ohne
  Wiederherstellungsfrist ausschließlich die private Runde samt Punkten, Tipps, Einladungen und
  Mitgliedschaften. Zentrale Liga-/Spielplandaten und Nutzerkonten bleiben erhalten. Das minimale
  Lösch-Audit enthält nur Aktion, Actor, Zeit und eine neue nicht sprechende Objekt-ID.
- Aufbewahrungsfristen und rechtliche Löschintervalle werden vor Produktionsfreigabe in der Datenschutzerklärung und im Betriebsrunbook festgelegt.
