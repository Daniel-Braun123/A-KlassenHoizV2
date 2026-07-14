# V1 Release-Scorecard

| Gate                                   | Ergebnis                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| Format, Lint, TypeScript strict, Build | bestanden                                                             |
| Unit / Integration                     | 48/48 und 17/17 bestanden                                             |
| DB, RLS, Storage                       | 201/201 bestanden; 15/15 exponierte App-Tabellen mit RLS + Force RLS  |
| E2E                                    | 70 Browserfälle bestanden                                             |
| Supabase Production                    | 51/51 Migrationen, Dry-Run `up to date`                               |
| Production Smoke                       | Auth, Isolation, Frist, 4/3, Ranking, PWA bestanden; Smoke-Daten null |
| Vercel                                 | `READY`, Hauptalias `https://a-klassenhoiz.vercel.app`                |
| Performance                            | Score-Gate erfüllt; LCP auf zwei Laborrouten über 2,5 s – V1-Ausnahme |
| Manuelle Screenreader-/Gerätetests     | nicht durchgeführt; ausdrücklich zurückgestellt                       |
| Fünf-Personen-Usability                | nicht durchgeführt; ausdrücklich zurückgestellt                       |
| Analytics/RUM                          | nicht vorhanden                                                       |

Freigabeentscheidung: privater, testbarer V1-Release mit den drei transparenten Ausnahmen oben.
