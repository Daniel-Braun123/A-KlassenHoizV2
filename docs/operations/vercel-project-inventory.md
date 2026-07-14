# Vercel-Projektinventar

Read-only geprüft am 13. Juli 2026 mit Vercel CLI 56.0.0. Es wurden keine Secret-Werte ausgegeben oder gespeichert.

| Feld                        | Ergebnis                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| angemeldeter CLI-Nutzer     | `danielbr0802-1108`                                                                                                                         |
| Team                        | `daniel-braun-s-projects` / `team_PdN8jxldp515T43rstMAZuz0`                                                                                 |
| Projekt                     | `a-klassenhoiz`                                                                                                                             |
| Projekt-ID                  | `prj_srgbv5gQZSV22whidgXkaBfzHFh9`                                                                                                          |
| Framework/Runtime           | Next.js / Node.js 24.x                                                                                                                      |
| bestehender Git-Link        | GitHub `Daniel-Braun123/A-KlassenHoiz`, Production Branch `main`                                                                            |
| vorgesehener neuer Git-Link | `Daniel-Braun123/A-KlassenHoizV2`                                                                                                           |
| Git-Remote lokal            | korrekt auf das neue Repository gesetzt                                                                                                     |
| Produktionsdeployment       | `dpl_AHCeZ1QFW7wtvcTqQhzJCYYcswTe`                                                                                                          |
| Deployment-URL              | `a-klassenhoiz-5hasb2hib-daniel-braun-s-projects.vercel.app`                                                                                |
| Projekt-Aliasse             | `a-klassenhoiz.vercel.app`, `a-klassenhoiz-daniel-braun-s-projects.vercel.app`, `a-klassenhoiz-git-main-daniel-braun-s-projects.vercel.app` |
| eigene Domains im Team      | keine                                                                                                                                       |

## Variablennamen und Scopes

| Name                                   | Scope      | Typ       |
| -------------------------------------- | ---------- | --------- |
| `APP_URL`                              | Production | encrypted |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production | encrypted |
| `NEXT_PUBLIC_SUPABASE_URL`             | Production | encrypted |
| `SUPABASE_PROJECT_REF`                 | Production | encrypted |
| `SUPABASE_SERVICE_ROLE_KEY`            | Production | sensitive |

Die derzeitige Konfiguration besitzt keine Preview-/Development-Variablen. Das bestätigt zugleich, dass T263 vor einem geschützten Preview zwingend ein isoliertes Nicht-Produktiv-Backend und passende Scopes benötigt. Die Git-Neuverknüpfung bleibt bis zu einer aktuellen, projekt- und rollbackgenauen Freigabe offen.
