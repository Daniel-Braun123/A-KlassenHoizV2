# Supabase-Freigabe B – V2-Rollout

**Aufgabe:** T275  
**Stand:** 2026-07-13  
**Status:** ERTEILT – NOCH NICHT AUSGEFÜHRT

## Freigabe

Der Projekteigentümer Daniel Braun hat im aktuellen Codex-Task ausdrücklich erklärt:

> „Supabase ist ab jetzt freigegeben also du kannst jetzt alles einstellen und einspielen was du
> willst“

Die Freigabe gilt für das bereits bestätigte Projekt `A-KlassenHoiz` mit der Projektreferenz
`ewqzhdnfoozjzenzmtlm` in `eu-central-1` und umfasst ausschließlich:

- vollständig neue, lokal geprüfte V2-Migrationen aus diesem Repository;
- die dazugehörige `api`-/Auth-/Storage-Konfiguration;
- notwendige read-only Verifikationen und Security Advisor;
- das neue Datenmodell ohne Import von Altcode, Altmigrationen oder Altdaten.

## Ausführungsgrenzen

- T276 wird erst ausgeführt, wenn das vollständige V2-Schema lokal grün ist; kein Zwischenstand wird
  als fertiges Produktionsbackend ausgegeben.
- App-Admin-Provisionierung und synthetische Produktionsdaten bleiben die getrennten Aufgaben
  T278–T282 und benötigen weiterhin ihren jeweils konkret dokumentierten Scope.
- Vercel-Cutover und Domainumschaltung bleiben an T283–T291 gebunden.
- Bei einem Migrationsfehler wird gestoppt und ausschließlich vorwärts korrigiert. Der vor T276
  bestätigte leere V2-Ausgangszustand ist der Rollbackanker; alter Datenbestand existiert aufgrund
  der ausdrücklich ohne Backup ausgeführten Freigabe A nicht mehr.

Die Freigabe läuft nach erfolgreicher Verifikation T277 aus.
