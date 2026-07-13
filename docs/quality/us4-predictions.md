# US4 Qualitätsslice: Tippabgabe

Stand: 13. Juli 2026

| Ebene                 | Nachweis                                                                | Ergebnis                                                      |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| Unit/Component        | `npm run test:unit`                                                     | 12 Dateien, 39 Tests bestanden                                |
| Datenbank/RLS/Storage | `npm run test:db`                                                       | 12 Dateien, 112 Assertions bestanden                          |
| Integration           | `npm run test:integration`                                              | 4 Dateien, 7 Tests bestanden                                  |
| Mobile E2E            | `tests/e2e/predictions/predict-matchday.spec.ts`, Mobile Chrome, 375 px | Acht Spiele, Offline/Retry, Verschiebung und Absage bestanden |
| Accessibility         | `tests/accessibility/predictions.spec.ts`, axe WCAG 2 A/AA und 2.2 AA   | Keine Verstöße                                                |
| Statische Gates       | `npm run typecheck`, `npm run lint`                                     | bestanden                                                     |

Die DB-Tests decken den Zeitpunkt eine Sekunde vor, exakt bei und eine Sekunde nach Anpfiff ab. Der Integrationstest verändert den Anpfiff nach einem erfolgreichen Save und bestätigt, dass ein weiterer Save serverseitig abgewiesen wird.
