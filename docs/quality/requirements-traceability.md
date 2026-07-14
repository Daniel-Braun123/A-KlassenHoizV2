# Requirements Traceability

## Funktionale Anforderungen

| Anforderungen                               | Implementierung/Tasks           | Hauptnachweis                           |
| ------------------------------------------- | ------------------------------- | --------------------------------------- |
| FR-001–FR-009 Auth/Profil                   | T019–T035                       | Auth Unit/Integration/E2E, Profile RLS  |
| FR-010–FR-024 globale Wettbewerbe           | T061–T090                       | Competition pgTAP/RLS/E2E               |
| FR-025–FR-038 private Runden/Einladungen    | T091–T119                       | Round/Invitation DB, Integration, E2E   |
| FR-039–FR-047 Tippabgabe/Frist/Sichtbarkeit | T120–T144                       | Prediction DB/RLS/Integration/E2E       |
| FR-048–FR-054 4/3/2/0/Ranglisten            | T145–T167                       | Scoring Unit/DB/Integration/E2E         |
| FR-055–FR-062 Mobile/PWA/WCAG               | T197–T223, T248–T256            | Responsive, Axe, PWA; reale Gates offen |
| FR-063–FR-066 Datenschutz/Logs/Sprache      | T218–T220, T238–T243, T257–T258 | Privacy, Security- und Sprachscan       |
| FR-067–FR-072 Clean Room/Infrastruktur      | T001–T018, T244, T260–T291      | Clean-Room und Operations-Gates         |
| FR-073 Rundenwechsel                        | T097, T106, T110                | Start-/Runden-E2E                       |
| FR-074 App-Admin/Break-Glass                | T224–T246                       | Support pgTAP/RLS/Integration/E2E       |

Jede ID FR-001 bis FR-074 liegt lückenlos in genau einer Zeile. Detailaktionen und Schnittstellen stehen in `contracts/application-actions.md`; die vollständige Berechtigungsmatrix in `contracts/rls-access-matrix.md`.

## Success Criteria

| Kriterium | Nachweis/Status                                                    |
| --------- | ------------------------------------------------------------------ |
| SC-001    | T254/T255 – reale fünf Personen offen                              |
| SC-002    | automatisiert 9,3 s; realer Median T254 offen                      |
| SC-003    | automatisiert < 3 min; realer Median T254 offen                    |
| SC-004    | T254/T255 – reale 4/5 offen                                        |
| SC-005    | Prediction Deadline pgTAP/RLS bestanden                            |
| SC-006    | Full RLS + Break-Glass 201 Assertions bestanden                    |
| SC-007    | reine Punktefunktion und Randwerte bestanden                       |
| SC-008    | Korrektur und Full Rebuild identisch bestanden                     |
| SC-009    | zwei Runden/ein Ergebnis E2E bestanden                             |
| SC-010    | Ownership-/No-Co-Admin-Slice bestanden                             |
| SC-011    | 320/375/768/1024/1440 automatisiert bestanden                      |
| SC-012    | Axe bestanden; manuelle T252/T223 offen                            |
| SC-013    | automatisiert bestanden; reale Geräte T221/T256 offen              |
| SC-014    | lokale Matrix T248; manuelle Gates offen                           |
| SC-015    | keine kritischen/hohen Security-Befunde                            |
| SC-016    | Chromium-Mobile automatisiert bestanden; Desktop/installiert offen |
