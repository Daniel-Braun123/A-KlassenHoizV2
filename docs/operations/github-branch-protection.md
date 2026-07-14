# Erforderliche GitHub-Branch-Protection

**Aufgabe:** T015  
**Repository:** `Daniel-Braun123/A-KlassenHoizV2`  
**Stand:** 2026-07-13  
**Status:** REGELN FESTGELEGT – EXTERNE AKTIVIERUNG NICHT FREIGEGEBEN

## Zielregel für `main`

Vor dem ersten Merge oder Production-Cutover muss `main` durch ein GitHub Ruleset oder gleichwertige
Branch Protection geschützt sein:

- Pull Request vor jedem Merge verpflichtend; kein direkter Push und kein Force Push;
- Branch muss vor Merge aktuell sein und alle verpflichtenden Checks bestanden haben;
- mindestens eine Freigabe einer dafür berechtigten Person; neue Commits verwerfen alte Freigaben;
- ungelöste Review-Threads blockieren den Merge;
- Löschung und Umbenennung von `main` verboten;
- Administratoren und Repository-Inhaber umgehen die Regeln im Normalbetrieb nicht;
- signierte Commits sind empfohlen, aber kein V1-Blocker, solange GitHub-Audit und PR-Historie
  erhalten bleiben;
- keine automatische Merge-Freigabe allein aufgrund von Bot-/Dependency-Updates.

## Verpflichtende Statuschecks

Die exakten Checknamen werden nach dem ersten Workflowlauf aus GitHub übernommen. Inhaltlich müssen
mindestens blockieren:

- Quality: Format, ESLint, TypeScript strict, Unit/Component und Production Build;
- Database: lokaler Neuaufbau ausschließlich aus V2-Migrationen, DB-Lint, pgTAP, RLS und Storage;
- E2E/Accessibility/PWA: Playwright, Axe und PWA-Prüfung;
- Release Gates: Lighthouse-Laborgate und Clean-Room-/Secret-Audit.

Ein Check darf nicht als „required“ geraten werden, bevor GitHub seinen tatsächlichen Namen einmal
registriert hat. Danach werden Workflow-/Jobname, Ruleset-ID, Aktivierungszeitpunkt und handelnde
Identität im Freigabenachweis ergänzt.

## Externes Mutationsgate

Dieses Dokument nimmt keine GitHub-Einstellung vor. Die Aktivierung ist eine externe
Repository-Mutation und benötigt eine ausdrückliche Freigabe mit Ziel-Repository, Branch,
handelnder Identität, finalen Checknamen und Rückbauweg. Der Rückbau darf nur über eine erneute
explizite Freigabe erfolgen und muss im GitHub-Auditlog nachvollziehbar bleiben.

Bis zur Aktivierung dürfen keine Produktionsfreigabe, kein Vercel-Cutover und kein Merge ungeprüfter
Implementierung erfolgen.
