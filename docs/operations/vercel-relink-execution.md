# Vercel-Git-Relink: Ausführungsprotokoll

**Aufgabe:** T262  
**Stand:** 2026-07-14  
**Status:** BLOCKIERT – ZIEL-REPOSITORY FÜR VERCEL NICHT ZUGREIFBAR  
**Freigabe:** einmaliges T261-Fenster beendet; keine aktuelle Wiederholungsfreigabe

## Ergebnis des kontrollierten Versuchs

Der am 2026-07-14 innerhalb des T261-Scope ausgeführte Relink-Versuch erreichte den Zielzustand
nicht. Die Trennung vom alten Repository war erfolgreich, die Verbindung zu
`Daniel-Braun123/A-KlassenHoizV2` wurde von Vercel jedoch mit einer Zugriffsfehlermeldung abgelehnt.
Die freigegebene Rückverknüpfung wurde unmittelbar ausgeführt und vollständig verifiziert.

Aktueller bestätigter Zustand nach dem Rückbau:

| Feld                  | Read-only bestätigter Wert                                  |
| --------------------- | ----------------------------------------------------------- |
| Actor                 | `danielbr0802-1108`                                         |
| Team                  | `daniel-braun-s-projects` / `team_PdN8jxldp515T43rstMAZuz0` |
| Rolle                 | `OWNER`                                                     |
| Projekt               | `a-klassenhoiz` / `prj_srgbv5gQZSV22whidgXkaBfzHFh9`        |
| aktueller Git-Link    | `Daniel-Braun123/A-KlassenHoiz`                             |
| gewünschter Git-Link  | `Daniel-Braun123/A-KlassenHoizV2`                           |
| Production Branch     | `main`                                                      |
| Production-Deployment | `dpl_AHCeZ1QFW7wtvcTqQhzJCYYcswTe`, `READY`                 |
| Deployment-Schutz     | `ssoProtection.deploymentType = all_except_custom_domains`  |
| lokaler Vercel-Link   | exakte Projekt- und Team-ID in `.vercel/project.json`       |

Unverändert bestätigte Production-Aliasse:

- `a-klassenhoiz.vercel.app`
- `a-klassenhoiz-daniel-braun-s-projects.vercel.app`
- `a-klassenhoiz-git-main-daniel-braun-s-projects.vercel.app`

Es wurden kein Deployment, keine Promotion, kein Deployment-Rollback und keine Änderung an
Environment, Domain, Alias, Protection oder Supabase ausgeführt. Secret-Werte wurden nicht
protokolliert.

## Blocker

GitHub bestätigt read-only, dass `Daniel-Braun123/A-KlassenHoizV2` öffentlich, nicht leer und mit
Default Branch `main` vorhanden ist. Vercel konnte das Repository dennoch nicht verbinden. Vor
einem neuen Versuch muss deshalb insbesondere geprüft werden, ob die Vercel-GitHub-Integration für
das neue Repository installiert beziehungsweise freigegeben ist.

Die Änderung einer GitHub-App-Installation oder Repository-Berechtigung gehört nicht zum
abgelaufenen T261-Scope. Sie benötigt eine eigene, zielgenaue Freigabe und ein eigenes
Ausführungsprotokoll. Ohne bestätigten Vercel-Zugriff erfolgt kein weiterer Disconnect.

## Read-only Vorbereitung für einen neuen T262-Lauf

Ein neuer Lauf beginnt erst, wenn alle folgenden Punkte ohne Mutation bestätigt sind:

1. Actor, OWNER-Rolle, Team-ID und Projekt-ID stimmen weiterhin mit diesem Protokoll überein.
2. Vercel kann `Daniel-Braun123/A-KlassenHoizV2` über die autorisierte GitHub-Integration sehen.
3. Repository, Default Branch `main`, lokales `origin` und Vercel-Zielprojekt sind eindeutig.
4. Der bestehende Git-Link zeigt vor dem Lauf weiterhin auf `Daniel-Braun123/A-KlassenHoiz`.
5. Recovery-Deployment, READY-Status, Production-Aliasse und Deployment-Schutz sind unverändert.
6. Während des Ausführungsfensters erfolgt kein Push oder Merge nach `main`.
7. Eine neue aktuelle Einzelfreigabe nennt Actor, Team-/Projekt-ID, ALT → NEU, `main`,
   Recovery-Anker, Git-Rückverknüpfung und weiterhin ausgeschlossene Mutationen.

Erst danach ist derselbe eng begrenzte Ablauf zulässig:

```text
vercel git disconnect --yes --scope team_PdN8jxldp515T43rstMAZuz0
vercel git connect https://github.com/Daniel-Braun123/A-KlassenHoizV2 --yes --scope team_PdN8jxldp515T43rstMAZuz0
```

Nach dem Connect werden Git-Link und Production Branch zuerst read-only geprüft. Anschließend
müssen Recovery-Deployment, Aliasse, Schutz, Environment-Namen/-Scopes sowie die Abwesenheit eines
neuen Deployments bestätigt werden. Bei jeder Abweichung gilt ausschließlich der in
`docs/operations/approvals/vercel-relink.md` definierte Rückverknüpfungspfad.

T262 bleibt offen, bis der neue Git-Link erfolgreich hergestellt und die vollständige
Nachverifikation protokolliert ist.
