# Betriebsrunbooks

**Stand:** 2026-07-13  
**Scope:** A-KlassenHoiz V2, Supabase-Projekt `ewqzhdnfoozjzenzmtlm`, Vercel-Projekt
`prj_srgbv5gQZSV22whidgXkaBfzHFh9`  
**Status:** ausführungsbereit beschrieben; Remote-Schritte bleiben an die jeweilige Freigabe in
`tasks.md` gebunden.

## Gemeinsame Regeln

- Jede Remote-Mutation nennt Operator, Zielprojekt, Zeitpunkt, Zweck, exakten Scope,
  Abbruchkriterien und Verifikation. Eine allgemeine frühere Freigabe wird nicht wiederverwendet.
- Vor jedem Befehl werden CLI-Identität, Team/Projektref, Region und Environment read-only geprüft.
- Secret-Werte, E-Mails, Einladungstokens, Tippinhalte und private Rundennamen erscheinen weder im
  Runbook noch im Ausführungsprotokoll.
- Produktionsänderungen erfolgen nie aus CI. Bei Abweichungen wird gestoppt; keine improvisierten
  destruktiven Reparaturen.
- Datenbank-Restore und Vercel-Rollback sind verschiedene Vorgänge und werden getrennt entschieden.

## 1. Backup

### Vorbedingung

1. Tarif und verfügbares Backup-/PITR-Fenster im Supabase Dashboard read-only bestätigen.
2. Letzten erfolgreichen Backupzeitpunkt, Projektref, Datenbankversion und verantwortlichen
   Operator dokumentieren.
3. Für einen manuellen logischen Export Zielpfad, Verschlüsselung, Aufbewahrung und Löschdatum
   freigeben. Der Export wird nie ins Repository geschrieben.
4. Storage separat erfassen: Datenbankbackups enthalten Storage-Metadaten, aber nicht die
   eigentlichen Objekte.

### Ausführung

- Bevorzugt das vom Tarif bereitgestellte Supabase-Backup/PITR verwenden.
- Falls ein freigegebener logischer Export erforderlich ist, die zum Projekt gepinnte Supabase CLI
  und `supabase db dump` mit einer außerhalb des Repositories bereitgestellten Remote-Verbindung
  verwenden. Credentials nur über den Secret Store/Prozesskontext injizieren.
- Vereinslogos separat über die Storage API inventarisieren und in ein verschlüsseltes,
  zugriffsbeschränktes Ziel exportieren.

### Verifikation

- Artefaktgröße/Hash, Schema- und Datenexport, Storage-Objektanzahl und Restore-Verantwortlichen
  protokollieren.
- Einen logischen Dump nur in einem isolierten lokalen/temporären Projekt testweise restaurieren.
- Offizielle Referenz: <https://supabase.com/docs/guides/platform/backups>.

## 2. Restore

### Entscheidung und Wartung

1. Incident-ID, gewünschter Wiederherstellungszeitpunkt, erwarteter Datenverlust und Downtime
   freigeben.
2. Schreibzugriffe stoppen und Vercel notfalls auf Wartungszustand bzw. das bestätigte
   Rollbackdeployment setzen.
3. Verifizieren, ob Datenbankbackup/PITR oder ein logischer Export verwendet wird. Storage-Objekte
   benötigen einen getrennten Restorepfad.

### Ausführung

- Managed Backup/PITR ausschließlich über den bestätigten Supabase-Dashboard-/Managementpfad
  restaurieren; Projekt ist währenddessen nicht verfügbar.
- Ein heruntergeladenes Backup zuerst isoliert validieren. Kein lokales Testartefakt direkt in
  Produktion zurückspielen.
- Nach einem historischen Restore ausschließlich fehlende, bereits geprüfte V2-Migrationen in
  Reihenfolge vorwärts anwenden; niemals Migrationshistorie raten oder reparieren.
- Storage-Objekte erst nach DB-Verifikation anhand des getrennten Inventars wiederherstellen.

### Nachkontrolle

`app`/`private`-Tabellen, `api`-Views/RPCs, Migrationstabelle, Grants, RLS/Force-RLS, Auth,
Logo-Policies und Stichproben der fachlichen Counts read-only prüfen. Danach Auth-, Frist-, RLS-,
Ergebnis-/Recalc-, Ranking- und PWA-Sentinels ausführen. Erst ein benannter Freigeber hebt den
Wartungszustand auf.

## 3. Ersten oder weiteren App-Admin provisionieren

Diese Operation ist keine UI-Funktion und keine Co-Admin-Rolle einer Tipprunde.

### Vorbedingung

1. Eigene aktuelle Produktionsfreigabe mit Operator und exakt einer Supabase-Auth-User-ID.
2. Identität über einen zweiten Kanal bestätigen; niemals nach E-Mail allein auswählen.
3. Zielprofil muss existieren, `active` sein und darf nur von `user` nach `app_admin` wechseln.

### Transaktion

Mit einer privilegierten, interaktiven DB-Sitzung und einem als Secret injizierten Parameter
`target_user_id`:

```sql
begin;
select user_id, app_role, status
from app.profiles
where user_id = :'target_user_id'
for update;

update app.profiles
set app_role = 'app_admin', updated_at = clock_timestamp()
where user_id = :'target_user_id'
  and app_role = 'user'
  and status = 'active';

-- Operator prüft: genau eine Zeile geändert.
commit;
```

Die Ausführungsakte speichert nur Operator, nicht sprechende User-ID, Zeitpunkt, Genehmigung und
Ergebnis. Danach mit der betroffenen Identität globale Adminroute positiv und private Rundendaten
negativ prüfen. Entzug verwendet denselben kontrollierten Pfad in Gegenrichtung. Niemals
`service_role` oder Supabase-Secret in Browser/Vercel-Clientvariablen ablegen.

## 4. Score-Rebuild

### Wann

Nur bei belegter Inkonsistenz zwischen offiziellen Ergebnissen und `prediction_scores`, nach
Migration einer Wertungsfunktion oder im kontrollierten Recovery. Eine normale Ergebniskorrektur
rechnet das betroffene Spiel bereits atomar neu.

### Ablauf

1. Incident/Freigabe, aktuelle `calculation_version`, Ergebnisrevisionen und erwartete Anzahl der
   wertbaren Tipps read-only erfassen.
2. Mit einer ausdrücklich provisionierten App-Admin-Sitzung `api.rebuild_all_scores()` einmalig
   aufrufen; keine direkte DML auf `prediction_scores`.
3. Rückgabecount, Laufzeit und Fehler protokollieren, ohne Tippwerte oder Rundennamen.
4. Zweiten Lauf nur als dokumentierte Idempotenzprüfung ausführen.
5. Gesamt-/Spieltagsranglisten und eine deterministische 4/3/2/0-Stichprobe read-only prüfen.

Bei Fehler rollt die RPC transaktional zurück. Danach Ursache analysieren und ausschließlich über
eine neue vorwärtsgerichtete Migration oder korrigierte offizielle Ergebnisrevision fortfahren.

## 5. Incident Response

### Einstufung

- **SEV-1:** unautorisierter Zugriff, PII-/Tipp-Leak, falsche Fristautorisierung, flächiger
  Datenverlust oder korrupte Wertung.
- **SEV-2:** Auth-/Tipp-/Ergebnisjourney nicht verfügbar, Preview/Production-Konfiguration falsch,
  begrenzte Dateninkonsistenz.
- **SEV-3:** nichtkritischer UI-/PWA-/Performancefehler ohne Sicherheits- oder Datenwirkung.

### Sofortmaßnahmen

1. Zeitpunkt, Melder, betroffene technische Komponente und bekannte Version festhalten.
2. Bei Security-/Datenrisiko Schreibpfade stoppen; betroffene Tokens/Sessions über den
   unterstützten Supabase-Pfad widerrufen. Keine privaten Inhalte in Chat, Ticket oder Logs kopieren.
3. Unveränderte technische Logs, Vercel-Deployment-ID, Migrationstand und append-only Audits
   sichern. V1 besitzt bewusst kein RUM und keine Produktanalytics.
4. Engsten sicheren Recoverypfad wählen: Vercel-Rollback bei Anwendungscode, vorwärtsgerichtete
   Migration bei Schemafehler, Restore nur nach eigener Restorefreigabe, Score-Rebuild nur bei
   Wertungsinkonsistenz.
5. Nach Recovery dieselben Security-Sentinels wie beim Cutover ausführen.

### Abschluss

Root Cause, Auswirkung, Zeitlinie, getroffene Maßnahmen, Datenstatus und Folgeaufgaben ohne PII
dokumentieren. Eine mögliche Datenschutzmeldung oder Nutzerkommunikation wird als eigene
Betreiberentscheidung bewertet; das Runbook erfindet keine rechtliche Bewertung.

## 6. Regelmäßige Kontrollen

- Dependency-/Security-Audit und vollständige CI bei jeder Änderung.
- Monatlich read-only: Backupstatus, Auth-Redirects, Vercel-Environment-Scopes, Supabase Advisors,
  RLS/Grants und aktive App-Admins.
- Nach jeder Migration: lokaler Reset, pgTAP/RLS/Storage, Typgenerierung ohne Diff und Preview-
  Abnahme.
- Support-Grants laufen maximal 15 Minuten; auffällige oder fehlgeschlagene Zugriffe werden über
  das append-only Audit geprüft, nicht über private Datenexporte.
