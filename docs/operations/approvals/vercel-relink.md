# Freigabeprotokoll: Vercel-Git-Neuverknüpfung

**Aufgabe:** T261  
**Stand:** 2026-07-14  
**Status:** ABGESCHLOSSEN – SICHERER CLI-ERSATZPFAD FREIGEGEBEN
**Ausführungsfenster:** 2026-07-14, 07:43:36–07:49:10 UTC  
**Gültigkeit:** durch die umfassende GitHub-/Vercel-Freigabe vom 2026-07-14 für den finalen
CLI-Cutover ersetzt

## Finale Entscheidung

Ein erneuter Connect zu `Daniel-Braun123/A-KlassenHoizV2` scheiterte unverändert an der externen
Vercel-GitHub-App-Berechtigung. Der Product Owner hat den sicheren Ersatzpfad autorisiert: GitHub
`main` bleibt kanonisch, das alte Repository wird dauerhaft getrennt und Production wird
kontrolliert per Vercel CLI aus dem lokalen Checkout dieses `main` deployt. Damit ist kein
Alt-Repository-Autodeploy mehr möglich; Auto-Deploy für V2 bleibt bis zu einer späteren App-
Berechtigung bewusst aus.

Dieses Dokument beschreibt den vollständigen Freigabeumfang und den ausgeführten Versuch. Die
Freigabe autorisierte keine Vercel-, GitHub-, Deployment-, Environment- oder Supabase-Änderung
außerhalb des ausdrücklich beschriebenen Git-Relinks und seiner Rückverknüpfung.

## Eindeutiger Ziel- und Identitätsumfang

| Feld                                      | Verbindlicher Wert                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| erwarteter Freigeber                      | Projekteigentümer/Repository-Inhaber `Daniel-Braun123`                                                                                      |
| ausführender Vercel-Actor                 | `danielbr0802-1108`                                                                                                                         |
| Vercel-Rolle                              | `OWNER` im unten genannten Team                                                                                                             |
| Vercel-Team                               | `daniel-braun-s-projects` / `team_PdN8jxldp515T43rstMAZuz0`                                                                                 |
| Vercel-Projekt                            | `a-klassenhoiz` / `prj_srgbv5gQZSV22whidgXkaBfzHFh9`                                                                                        |
| bestehender Git-Link                      | GitHub `Daniel-Braun123/A-KlassenHoiz`                                                                                                      |
| genehmigungsfähiger neuer Git-Link        | GitHub `Daniel-Braun123/A-KlassenHoizV2`                                                                                                    |
| Production Branch vor und nach dem Relink | `main`                                                                                                                                      |
| aktuelles Production-Recovery-Deployment  | `dpl_AHCeZ1QFW7wtvcTqQhzJCYYcswTe`                                                                                                          |
| unverändert erwartete Production-Aliasse  | `a-klassenhoiz.vercel.app`, `a-klassenhoiz-daniel-braun-s-projects.vercel.app`, `a-klassenhoiz-git-main-daniel-braun-s-projects.vercel.app` |
| aktueller Deployment-Schutz               | `ssoProtection.deploymentType = all_except_custom_domains`                                                                                  |

Die Identität, Team-ID, Projekt-ID, Repository-Namen und Deployment-ID sind gemeinsam zu prüfen.
Eine Übereinstimmung nur anhand sprechender Namen reicht nicht aus.

## Zur Freigabe vorgesehener Scope

Nach einer noch ausstehenden ausdrücklichen Bestätigung sind ausschließlich folgende Änderungen
zulässig:

1. das lokale Arbeitsverzeichnis mit genau dem bestehenden Vercel-Projekt zu verknüpfen; dadurch
   darf ausschließlich `.vercel/project.json` lokal erzeugt beziehungsweise aktualisiert werden;
2. den bestehenden GitHub-Link `Daniel-Braun123/A-KlassenHoiz` vom oben genannten Vercel-Projekt zu
   trennen;
3. dasselbe Vercel-Projekt unmittelbar mit `Daniel-Braun123/A-KlassenHoizV2` zu verbinden;
4. die Production-Branch-Einstellung unverändert auf `main` zu belassen;
5. den Vorher-/Nachher-Zustand read-only zu verifizieren und ohne Secret-Werte in
   `docs/operations/vercel-relink-execution.md` zu protokollieren.

Als geprüfter CLI-Ablauf ist mit Vercel CLI 56.0.0 vorgesehen:

```text
vercel link --yes --team team_PdN8jxldp515T43rstMAZuz0 --project prj_srgbv5gQZSV22whidgXkaBfzHFh9
vercel git disconnect
vercel git connect https://github.com/Daniel-Braun123/A-KlassenHoizV2
```

Die Befehle dürfen erst nach Identitäts- und Vorzustandsprüfung ausgeführt werden. Beim ersten
extern mutierenden Git-Befehl wird keine zusätzliche automatische Bestätigung verwendet; jede
interaktive Zielangabe muss mit diesem Protokoll übereinstimmen.

## Ausdrücklich nicht freigegeben

T261 umfasst nicht:

- einen Preview- oder Production-Deploy, insbesondere keinen Aufruf mit `--prod`;
- Push, Merge, Branch-Änderung, GitHub-Webhook-/App- oder Branch-Protection-Änderung;
- Änderungen an Production Branch, Domains, Aliassen, Deployment Protection, Password Protection,
  Protection Bypass, Build-/Runtime-Einstellungen oder Vercel-Projektmitgliedern;
- Anlage, Änderung, Ausgabe oder Löschung von Environment-Variablen oder Secret-Werten;
- Verwendung von Production-Supabase-Zugangsdaten für Preview oder Development;
- Supabase-Migrationen, Schema-/Datenänderungen, Reset, Auth-, Storage- oder RLS-Änderungen;
- Promotion, Rollback, Löschung oder Deaktivierung eines Deployments;
- T263 bis T265, Preview-Abnahme, Production-Cutover oder Domainumschaltung.

Insbesondere erweitert eine spätere Freigabe dieses Protokolls weder die Supabase-Freigabe B noch
eine andere frühere Freigabe. Das isolierte Nicht-Produktiv-Backend und Preview-scoped Variablen
bleiben eine separate Voraussetzung aus T263; aktuell existieren dafür keine Vercel-Variablen.

## Vorbedingungen unmittelbar vor T262

Der Operator hält folgende read-only Ergebnisse mit UTC-Zeitstempel fest:

1. Vercel CLI meldet Version 56.0.0 und Actor `danielbr0802-1108`.
2. Der Actor ist weiterhin `OWNER` von `team_PdN8jxldp515T43rstMAZuz0`.
3. Projekt-ID, Team-ID und Projektname stimmen exakt mit diesem Dokument überein.
4. Der Live-Git-Link zeigt noch auf `Daniel-Braun123/A-KlassenHoiz`; Production Branch ist `main`.
5. Das lokale Git-Remote zeigt auf
   `https://github.com/Daniel-Braun123/A-KlassenHoizV2.git`.
6. Das aktuelle Production-Deployment ist weiterhin
   `dpl_AHCeZ1QFW7wtvcTqQhzJCYYcswTe`; seine bestehenden Aliasse sind unverändert.
7. Der Deployment-Schutz besitzt weiterhin den oben protokollierten Zustand.
8. Während des Relink-Fensters erfolgt kein Push oder Merge nach `main` und kein anderer
   Deployment-auslösender Vorgang.

Secret-Werte werden weder gelesen noch in Ausgaben oder Protokolle übernommen. Weicht eine
Vorbedingung ab, beginnt T262 nicht.

## Verifikation nach der Neuverknüpfung

T262 gilt nur dann als erfolgreich ausführbar, wenn alle folgenden Punkte read-only bestätigt und
im Ausführungsprotokoll belegt sind:

- Das Projekt mit ID `prj_srgbv5gQZSV22whidgXkaBfzHFh9` gehört weiterhin zum erwarteten Team.
- Der Git-Link zeigt exakt auf GitHub `Daniel-Braun123/A-KlassenHoizV2`.
- Production Branch ist weiterhin `main`.
- Production-Deployment-ID und die vorhandenen Production-Aliasse sind unverändert.
- Es wurde kein neues Deployment erzeugt und kein Deployment promoted, zurückgerollt oder gelöscht.
- Domains, Deployment-Schutz, Environment-Namen/-Scopes und übrige Projekteinstellungen sind
  gegenüber dem Vorzustand unverändert.
- Das Protokoll enthält CLI-Version, Actor, Team-/Projekt-ID, Vorher-/Nachher-Link, UTC-Zeitpunkte
  und Ergebnis, aber keine Tokens oder Secret-Werte.

## Abbruchkriterien

Die Ausführung stoppt ohne weitere Mutation, sobald eines der folgenden Ereignisse eintritt:

- Actor, Rolle, Team-ID, Projekt-ID, alter Git-Link, Production Branch oder Recovery-Deployment
  weichen vom freigegebenen Vorzustand ab;
- Vercel fordert eine Auswahl eines anderen Teams, Projekts oder Repositorys;
- der Disconnect ist nicht eindeutig bestätigt oder der Connect schlägt fehl;
- ein Befehl würde Environment, Domain, Alias, Protection, Deployment oder Supabase verändern;
- ein neues Production-Deployment oder eine Änderung der Production-Aliasse wird sichtbar;
- der CLI-/API-Zustand ist widersprüchlich oder die Nachverifikation ist nicht vollständig möglich.

Nach einem Abbruch sind improvisierte Reparaturen, Deployments und zusätzliche Konfigurationsänderungen
nicht zulässig. Der tatsächliche Zwischenzustand wird dokumentiert und eine neue Entscheidung
eingeholt.

## Rückverknüpfung und Recovery-Grenze

Der Rollback für T261/T262 ist ausschließlich die Git-Rückverknüpfung:

1. den unerwarteten oder neuen Git-Link vom exakten Vercel-Projekt trennen;
2. das Projekt wieder mit `https://github.com/Daniel-Braun123/A-KlassenHoiz` verbinden;
3. read-only bestätigen, dass alter Repository-Link, Production Branch `main`, Production-
   Deployment und Aliasse wieder dem protokollierten Vorzustand entsprechen.

Auch dieser Rückbau ist nur innerhalb der ausdrücklich bestätigten T261-Freigabe zulässig und wird
vollständig in T262 protokolliert. Ein Deployment-Rollback ist davon verschieden und durch dieses
Dokument nicht freigegeben.

Falls entgegen dem Scope ein Production-Deployment oder Production-Traffic verändert wurde, wird
sofort gestoppt und eine separate Emergency-Rollback-Freigabe eingeholt. Der vorab identifizierte
Recovery-Anker ist `dpl_AHCeZ1QFW7wtvcTqQhzJCYYcswTe`. Das Vercel-Hobby-Team unterstützt Instant
Rollback nur auf das unmittelbar vorherige Production-Deployment; deshalb darf keine weitere
Production-Mutation erfolgen. Ein autorisierter Deployment-Rollback müsste anschließend separat
verifiziert und der Rollback-Modus gegebenenfalls über eine ebenfalls autorisierte Promotion
beendet werden.

## Freigabenachweis

Der Projekteigentümer erteilte im aktuellen Codex-Task am 2026-07-14 vor Beginn des
Ausführungsfensters ausdrücklich folgende Freigabe:

> Du kannst jetzt alles machen also alles ist erlaubt es soll danach für mich testbar sein

Für T261 wurde diese umfassende Erklärung bewusst nur auf den engeren, vorab vollständig
dokumentierten Scope dieses Protokolls angewendet. Sie wurde nicht als Freigabe für Deployments,
Environment-/Domain-/Protection-Änderungen, Supabase oder den Production-Cutover verwendet.

## Ausführungsergebnis

| UTC-Zeit | Nachweis/Ergebnis                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 07:43:36 | CLI 56.0.0, Actor `danielbr0802-1108`, Team-ID, Projekt-ID und OWNER-Rolle read-only bestätigt                                                       |
| 07:43:50 | Recovery-Deployment, READY-Status und drei Production-Aliasse read-only bestätigt                                                                    |
| 07:44:11 | lokales Projekt erfolgreich mit der exakten Projekt- und Team-ID verknüpft                                                                           |
| 07:47:08 | unerwartete lokale CLI-Nebeneffekte sicher bereinigt; `.vercel/project.json` blieb korrekt, bestehende lokale Supabase-Variablen blieben unverändert |
| 07:47:25 | vollständigen Vorzustand vor der externen Mutation erneut read-only bestätigt                                                                        |
| 07:47:54 | alten Git-Link nach bestätigter Zielanzeige getrennt                                                                                                 |
| 07:48:04 | Detached-Zustand read-only bestätigt                                                                                                                 |
| 07:48:33 | Verbindung zu `Daniel-Braun123/A-KlassenHoizV2` scheiterte mit einer Vercel-Zugriffsfehlermeldung; kein Deployment wurde ausgelöst                   |
| 07:48:48 | freigegebene Rückverknüpfung zu `Daniel-Braun123/A-KlassenHoiz` erfolgreich ausgeführt                                                               |
| 07:49:10 | alter Git-Link, `main`, Schutz, Recovery-Deployment und alle Production-Aliasse unverändert bestätigt                                                |
| 07:49:42 | neues öffentliches GitHub-Repository und Default Branch `main` unabhängig read-only bestätigt                                                        |

Vercel meldete, dass das neue Repository nicht mit dem Projekt verbunden werden konnte und Zugriff
beziehungsweise Schreibweise zu prüfen seien. Repository-Name und Existenz sind read-only
bestätigt; damit bleibt als nächster zu klärender Scope insbesondere der Zugriff der Vercel-GitHub-
Integration auf `Daniel-Braun123/A-KlassenHoizV2`. Eine GitHub-App-/Repository-Berechtigungsänderung
war ausdrücklich ausgeschlossen und wurde nicht vorgenommen.

T261 bleibt gemäß Ausführungsanweisung offen, weil der Zielzustand nicht erreicht wurde. T262 darf
erst nach dokumentierter Behebung des Zugriffsblockers und einer neuen aktuellen Einzelfreigabe
erneut mutierend begonnen werden.
