# Isoliertes Supabase-Preview-Backend

**Aufgabe:** T263  
**Stand:** 2026-07-14  
**Status:** FREIGEGEBEN UND BEREITGESTELLT – URL-FINALISIERUNG FOLGT MIT T264

Diese Datei legt Freigabe, Bereitstellung, Betrieb und Rückbau des Nicht-Produktiv-Backends fest.
Die ausdrückliche Freigabe und ihre Ausführung sind im unteren Abschnitt protokolliert. Production
und Vercel wurden bei T263 nicht verändert.

## Bestätigter Ausgangszustand

Die read-only Prüfung am 14. Juli 2026 ergab:

| Feld                          | Bestätigter Wert                                             |
| ----------------------------- | ------------------------------------------------------------ |
| Supabase-Organisation         | `Daniel-Braun123's Org` / `ognyalzmenuafhzzbcxc`             |
| Tarif                         | Free                                                         |
| vorhandene Projekte           | genau 1: Production `A-KlassenHoiz` / `ewqzhdnfoozjzenzmtlm` |
| vorhandene Supabase-Branches  | 0                                                            |
| Branching im aktuellen Tarif  | nicht enthalten; Supabase Branching setzt Pro voraus         |
| verfügbarer Free-Projektplatz | 1 zweites aktives Projekt                                    |
| aktuelle Kostenvorprüfung     | `amount: 0`, Abrechnungsfrequenz `monthly`                   |
| Zielregion                    | `eu-central-1`, identisch zu Production                      |

Das Kostenangebot ist eine zeitpunktbezogene Provider-Auskunft, keine dauerhafte Preisgarantie.
Tarif, freier Projektplatz und Kosten müssen unmittelbar vor der Freigabe erneut read-only geprüft
werden. Jede Abweichung stoppt T263.

## Verbindliche Zielentscheidung

T263 verwendet im aktuellen Tarif **kein Branching**, sondern ein vollständig separates zweites
Free-Projekt:

| Feld               | Verbindlicher Sollwert                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| Projektname        | `A-KlassenHoizV2-Preview`                                                    |
| Organisation       | `ognyalzmenuafhzzbcxc`                                                       |
| Region             | `eu-central-1`                                                               |
| Plan               | Free; Bereitstellung nur bei erneut bestätigten Monatskosten `0`             |
| Daten              | ausschließlich synthetisch, niemals Kopie oder Export aus Production         |
| Code-/Schemaquelle | genau der für die Preview freigegebene Commit dieses Greenfield-Repositories |
| Lebensdauer        | bis Abschluss von T291 oder vorheriger separater Cleanup-Entscheidung        |

Die bei der Anlage erzeugte neue Projektref wird erst nach der Bereitstellung in das
Ausführungsprotokoll eingetragen. Sie darf niemals mit `ewqzhdnfoozjzenzmtlm` übereinstimmen.

## Erforderliche ausdrückliche Freigabe

Vor der ersten Mutation muss ein Freigabevermerk mindestens enthalten:

- Freigeber und Operator;
- Zeitpunkt und Wartungsfenster;
- den exakten Projektname, Organisation und Region aus der Solltabelle;
- die unmittelbar davor erneut gelesene Kostenantwort `amount: 0` / `monthly`;
- den freigegebenen Commit-SHA und die erwartete Migrationsspanne;
- die exakte, vertrauenswürdige Vercel-Preview-Branch und ihre feste HTTPS-URL;
- den Scope „Projekt anlegen, V2-Migrationen, Preview-Konfiguration, synthetische Fixtures und
  ausschließlich Preview-gebundene Vercel-Variablen“;
- die Abbruch-, Quarantäne- und Cleanup-Regeln aus dieser Datei.

Die Freigabe autorisiert weder Änderungen am Production-Projekt, Vercel-Production-Variablen,
Production-Domain/Cutover noch die spätere Löschung des Preview-Projekts.

## Bereitstellungsablauf nach Freigabe

### 1. Identität und Ziel erneut prüfen

1. Supabase-Organisation, Tarif, Projektliste, Branchliste, Region und Kostenangebot read-only
   abfragen.
2. Bestätigen, dass Production weiterhin exakt `ewqzhdnfoozjzenzmtlm` ist und nicht verknüpft oder
   verändert wird.
3. Den freigegebenen Commit aus einem sauberen, isolierten Rollout-Arbeitsverzeichnis verwenden.
   Die normale lokale Supabase-Konfiguration bleibt unlinked und durch den Remote-Guard geschützt.

### 2. Projekt kontrolliert anlegen

Das Projekt wird erst nach der oben beschriebenen Freigabe über den authentifizierten
Supabase-Managementpfad angelegt. Ein Datenbankpasswort wird ausschließlich über den Secret Store
oder einen nicht protokollierten Prozesskontext übergeben, niemals in Dokumentation, Shell-Historie,
Chat oder CI. Danach werden neue Projektref, Status `ACTIVE_HEALTHY`, Region und PostgreSQL-Hauptversion
read-only erfasst; Schlüsselwerte werden nicht protokolliert.

### 3. Preview-Schema bereitstellen

1. Im isolierten Arbeitsverzeichnis müssen genau 51 neue V2-Migrationen von
   `20260713000100_create_v2_schemas.sql` bis
   `20260713192003_apply_mutation_rate_limits.sql` liegen.
2. `supabase migration list --linked` muss eine leere Remote-Historie zeigen.
3. `supabase db push --linked --dry-run` muss genau diese 51 Migrationen in Reihenfolge ankündigen.
4. Erst danach werden die Migrationen ohne `--include-all` und ohne `--include-roles` angewendet.
5. Für Preview ist ein Seed nur über einen **separat geprüften Preview-Fixture-Pfad** erlaubt.
   `supabase/seed.sql` ist ausdrücklich local-only, enthält feste lokale Testzugänge und darf nicht
   in ein öffentlich erreichbares Cloud-Projekt eingespielt werden. Production-Daten, alte
   Migrationen und alte Anwendungsexporte sind verboten.

### 4. Umgebungsspezifische Konfiguration

Die Repository-Datei `supabase/config.toml` ist eine lokale Konfiguration mit localhost-URLs,
lokalen Ports, lokalem SMTP und experimentellen Feldern. Sie darf nicht unverändert gepusht werden.
Für Preview wird eine separat geprüfte Konfiguration im isolierten Arbeitsverzeichnis verwendet:

- Data API exponiert ausschließlich `api`; `extra_search_path = ["extensions"]`, `max_rows = 1000`;
- E-Mail-/Passwort-Registrierung aktiv, E-Mail-Bestätigung deaktiviert, anonyme Anmeldung deaktiviert;
- `site_url` und Redirect-Allowlist enthalten ausschließlich die zuvor bestätigte feste HTTPS-URL
  der vertrauenswürdigen Preview-Branch; keine Produktions-URL, kein `localhost` und kein
  Host-Wildcard;
- Storage entsteht aus der V2-Migration: öffentlicher Bucket `club-logos`, maximal 2 MiB, nur PNG,
  JPEG und WebP; Schreibzugriffe bleiben App-Admin/RLS-geschützt;
- lokale Ports, Studio, Mailpit, Analytics-/Experimental- und lokale Seed-Einstellungen werden
  nicht als Remote-Sollwerte übernommen;
- `config push` besitzt keinen Dry-Run. Deshalb werden die aktuelle Remote-Konfiguration und die
  freigegebene Sollkonfiguration vor dem Push feldweise ohne Secret-Werte protokolliert.

### 5. Vercel ausschließlich für Preview konfigurieren

Die Variablen werden ausschließlich auf die dedizierte, vertrauenswürdige Preview-Branch begrenzt;
ein globaler Preview-Scope für beliebige PR-Branches ist für serverseitige Secrets nicht zulässig.

| Variable                               | Sichtbarkeit                         | Wertquelle                                                                |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser, Preview-only                | URL des neuen Preview-Projekts                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser, Preview-only                | Publishable Key des Preview-Projekts                                      |
| `NEXT_PUBLIC_SITE_URL`                 | Browser, Preview-only                | exakt freigegebene feste Preview-HTTPS-URL                                |
| `SUPABASE_SECRET_KEY`                  | server-only, encrypted, Preview-only | Secret Key des Preview-Projekts, nur weil der Kontolöschpfad ihn benötigt |

`SUPABASE_SERVICE_ROLE_KEY` ist kein aktueller Laufzeitvariablenname dieser V2-App und wird nicht
neu für Preview angelegt. Kein Supabase-Secret trägt das Präfix `NEXT_PUBLIC_`. Production-Scopes
und vorhandene Production-Werte bleiben unverändert. Nach dem Setzen wird nur das Vorhandensein,
der Scope und die Zielbranch geprüft, niemals ein Wert ausgegeben.

## Verifikation und Abnahmegrenze

T263 ist erst bereit zur Abnahme, wenn alle folgenden Prüfungen grün sind:

1. neue Projektref ungleich Production, richtige Organisation/Region, Zustand `ACTIVE_HEALTHY`;
2. 51 lokale und 51 Remote-Migrationstimestamps identisch; anschließender Dry-Run meldet „up to
   date“;
3. erwartete Schemas, Grants, RLS/Force-RLS, `security_invoker`-Views und gehärtete Funktionen;
4. sämtliche Supabase-Advisor-Befunde erfasst und gegen die implementierte Trust-Grenze bewertet;
5. Auth-/PostgREST-Konfiguration entspricht der Preview-Sollkonfiguration oder besitzt nur die
   ausdrücklich dokumentierte URL-Ausnahme bis T264;
6. `club-logos`-Bucket und Policies entsprechen Migration und Storage-Tests;
7. ausschließlich synthetische Preview-Daten; keine bekannte Production-ID, E-Mail-Adresse,
   Rundennamen, Tippinhalte oder Storage-Objekte;
8. URL, Publishable Key, Secret Key und Testzugänge liegen ausschließlich in einer gitignorierten,
   lokal zugriffsbeschränkten Datei für die spätere branchgebundene T264-Konfiguration;
9. das Ausführungsprotokoll enthält keine Schlüssel, Passwörter oder privaten Fixture-Inhalte.

T263 autorisiert noch keinen Preview-Deploy. T264 erzeugt das geschützte Deployment; T265 führt die
Gesamtjourney und Security-Sentinels aus; T267 ist die getrennte Preview-Abnahme.

## Stop-, Quarantäne- und Rollbackregeln

Sofort stoppen bei nicht-null Kosten, fehlendem Projektplatz, falscher Organisation/Region,
Production-Projektref als Ziel, unerwarteter Remote-Migrationshistorie, nicht exakt 51 geplanten
Migrationen, einer nach T264 verbliebenen oder nicht protokollierten localhost-/Production-URL in
der Preview-Konfiguration, Production-Daten oder Secret-Ausgabe. Keine Reparatur mit
`migration repair`, kein Remote-Reset und kein Wechsel auf Pro ohne neue Freigabe.

- **Vor Projektanlage:** keine Mutation; Freigabe verfällt ohne Folgewirkung.
- **Nach Projektanlage, vor Vercel-Verknüpfung:** Projekt in Quarantäne belassen, keine Keys
  verteilen und Ursache dokumentieren. Eine Löschung benötigt eine neue destruktive
  Cleanup-Freigabe.
- **Nach Vercel-Verknüpfung:** zuerst Preview-Variablen der Zielbranch entfernen und ein sauberes
  Deployment ohne diese Werte verifizieren; anschließend Keys rotieren oder Projekt pausieren,
  sofern der aktuelle Incident-Scope dies ausdrücklich erlaubt.
- **Nach einer fehlgeschlagenen Migration:** Projekt nicht als Preview verwenden; Ursache lokal
  reproduzieren und ausschließlich vorwärts korrigieren. Keine Migration aus der Historie löschen.
- **Konfigurationsfehler:** anhand des vorab gelesenen, redigierten Konfigurationssnapshots auf eine
  geprüfte Preview-Konfiguration zurückstellen; bei unklarer Wirkung Projekt quarantänisieren.

## Lifecycle und spätere Löschung

- Free-Projekte können nach einer Woche Inaktivität automatisch pausieren und besitzen keine
  automatischen Backups. Das ist für rein synthetische Preview-Daten akzeptiert; vor jeder
  Abnahmesitzung wird der Zustand read-only geprüft. Ein Unpause ist eine neue Remote-Mutation und
  wird im jeweiligen Betriebsprotokoll erfasst.
- Monatlich werden Tarif/Kosten, Projektzustand, Vercel-Scopes, Auth-Redirects, Advisors und das
  Verbot von Production-Daten read-only geprüft.
- Das Projekt bleibt höchstens bis zum stabil bestätigten Abschluss T291 bestehen. Eine frühere
  Stilllegung ist zulässig, wenn keine Preview mehr benötigt wird.
- Die Löschreihenfolge ist: Preview-Deployments sperren, Vercel-Preview-Variablen entfernen,
  Abwesenheit weiterer Verbraucher prüfen, Cleanup-Freigabe mit exakter Preview-Projektref
  einholen, Preview-Projekt löschen, Projektliste und Production-Gesundheit read-only prüfen.
- Die Löschung ist irreversibel und **nicht** Bestandteil von T263. Production
  `ewqzhdnfoozjzenzmtlm` steht immer auf der Schutzliste.

## Freigabe- und Ausführungsprotokoll

### Freigabe

Der Projekteigentümer hat im laufenden Codex-Task am 14. Juli 2026 ausdrücklich erklärt:

> „Du kannst jetzt alles machen also alles ist erlaubt es soll danach für mich testbar sein“

Für T263 wurde dies auf den bereits dokumentierten Scope begrenzt: genau ein isoliertes zweites
Free-Projekt, ausschließlich neue V2-Migrationen, synthetische Preview-Daten und keine Mutation an
Production. Die getrennten Freigaben für Vercel, Production-Rollout und Cleanup bleiben bestehen.

### Ziel und Kosten

Unmittelbar vor der Anlage wurden Organisation, Tarif, Projektliste und Kosten erneut read-only
geprüft:

| Feld                | Ausführungsergebnis                                |
| ------------------- | -------------------------------------------------- |
| Organisation        | `Daniel-Braun123's Org` / `ognyalzmenuafhzzbcxc`   |
| Tarif               | Free                                               |
| Kostenbestätigung   | `amount: 0`, `monthly`                             |
| neues Projekt       | `A-KlassenHoizV2-Preview` / `ojjfvvwsvxjvthaolpjp` |
| Region / PostgreSQL | `eu-central-1` / `17.6.1.141`                      |
| Zustand             | `ACTIVE_HEALTHY`                                   |
| Schemaquellstand    | Commit `b496cd25ff951b44f6a73ef4c9cab2d04af1fa2a`  |
| Ausführungsfenster  | 2026-07-14, abgeschlossen 09:55 Uhr MESZ           |

Die Production-Ref `ewqzhdnfoozjzenzmtlm` blieb auf der Schutzliste. Die unabhängige Nachkontrolle
zeigte Production weiterhin `ACTIVE_HEALTHY` mit leerer Migrationshistorie.

### Schema und Konfiguration

- Ein isoliertes, gitignoriertes Arbeitsverzeichnis enthielt exakt 51 hashgleiche
  V2-Migrationsdateien und ausdrücklich keine `seed.sql`.
- Der Dry-Run zeigte eine leere Remote-Historie und exakt die erwartete Spanne
  `20260713000100`–`20260713192003`. Der migrations-only Push lief ohne `--include-seed`,
  `--include-all` oder `--include-roles` durch.
- Der finale Vergleich zeigte 51 lokale und 51 identische Remote-Timestamps; ein weiterer Dry-Run
  meldete „up to date“.
- Die Data API exponiert ausschließlich `api`, mit `extensions` als zusätzlichem Suchpfad und
  `max_rows = 1000`.
- E-Mail-/Passwort-Registrierung ist aktiv, E-Mail-Bestätigung und anonyme Anmeldung sind
  deaktiviert, die Passwort-Mindestlänge beträgt acht Zeichen.
- Die Auth-Site-URL bleibt bis T264 bewusst auf `http://localhost:3000`; zusätzliche Redirect-URLs
  sind leer. Es wurde keine Vercel-URL erfunden und keine Production-URL eingetragen.

### Synthetische Fixtures und lokale Secrets

`supabase/seed.sql` wurde weder kopiert noch ausgeführt. Stattdessen wurden über einen separaten,
gitignorierten Provisionierungspfad erzeugt:

- vier neue synthetische Auth-Konten mit je einem kryptografisch zufälligen Passwort;
- genau ein synthetischer App-Admin, ein Besitzer-, ein Mitglied- und ein Nichtmitglied-Konto;
- eine veröffentlichte synthetische Liga-Saison, zwei Vereine, ein Spieltag und ein zukünftiges
  Spiel;
- keine Tipprunde, keine Tipps, keine Ergebnisse und keine Storage-Objekte.

URL, Projektref, Publishable Key, Secret Key und Testzugänge liegen ausschließlich in
`.tools/preview-backend.env.local`. Die Datei wird von Git ignoriert, besitzt eine lokale
Zugriffsbeschränkung und ihre Werte wurden weder in Dokumentation noch Chat ausgegeben.

### Grundverifikation und Advisor-Bewertung

- realer Login mit dem synthetischen Preview-App-Admin, `api`-Read auf die veröffentlichte Liga und
  Logout waren erfolgreich; danach bestanden keine aktiven Sessions oder Refresh-Tokens;
- 15 von 15 `app`-Tabellen haben RLS und Force RLS;
- 16 von 16 `api`-Views verwenden `security_invoker`;
- Bucket `club-logos` existiert, Storage-Objektanzahl ist null; Edge Functions existieren nicht;
- der Security Advisor meldet Warnungen für den bewusst öffentlichen Logo-Bucket, absichtlich
  aufrufbare, intern autorisierende `SECURITY DEFINER`-RPCs, deaktivierte Leaked-Password-Prüfung
  und die nicht geforderte MFA. Diese Warnungen sind für Preview erfasst, nicht verschwiegen, und
  werden in T265/T266 erneut gegen die lokalen Negativtests bewertet;
- die Tabellenübersicht weist fünf interne `private`-Tabellen ohne RLS aus. `private` ist nicht in
  der Data API exponiert, besitzt keine Browser-Grants und wird nur über kontrollierte Funktionen
  erreicht. Damit ist das Verfassungsgebot „RLS auf allen exponierten Tabellen“ erfüllt; RLS auf
  `private` bleibt ein dokumentierter Defense-in-Depth-Prüfpunkt vor T276;
- der Performance Advisor nennt drei fehlende FK-Indizes sowie erwartungsgemäß unbenutzte Indizes
  im frisch angelegten Projekt. Diese Informationsbefunde werden in der Release-Scorecard T266
  bewertet und autorisieren keine ad-hoc Remote-Schemaänderung.

### Verbindlicher Folgeschritt T264

Sobald Vercel die echte, geschützte HTTPS-Preview-URL geliefert hat, muss T264 vor jedem Browser-
Acceptance-Test:

1. genau diese URL als `NEXT_PUBLIC_SITE_URL`, Supabase `site_url` und einzigen zusätzlich
   erforderlichen Auth-Redirect setzen;
2. URL, Publishable Key und Secret Key aus der lokalen Datei ausschließlich an die dedizierte,
   vertrauenswürdige Vercel-Preview-Branch binden;
3. sicherstellen, dass kein Secret in Production, untrusted PRs oder `NEXT_PUBLIC_*` landet;
4. Auth-Konfiguration read-only zurücklesen und Register/Login/Reset/Callback über HTTPS prüfen.

T263 ist damit abgeschlossen und das Backend für T264 bereit. Ein öffentlich testbares Deployment
entsteht erst durch T264; T265/T267 bleiben die Security-/Journey- beziehungsweise Preview-Abnahme.

## Offizielle Referenzen

- <https://supabase.com/docs/guides/deployment/branching>
- <https://supabase.com/docs/guides/deployment>
- <https://supabase.com/docs/guides/platform/billing-on-supabase>
- <https://supabase.com/docs/guides/platform/manage-your-usage/branching>
- <https://supabase.com/docs/reference/cli/supabase-db-push>
- <https://supabase.com/docs/reference/cli/supabase-config-push>
