# Vollständige lokale CI-Matrix

Stand: 13. Juli 2026. Ziel war ausschließlich der lokale V2-Supabase-Stack; es gab keine Remote-Mutation.

| Gate                     | Ergebnis                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| TypeScript strict        | bestanden (`tsc --noEmit`)                                                                      |
| ESLint                   | bestanden, 0 Warnungen                                                                          |
| Unit/Component           | 14 Dateien, 46/46 Tests bestanden                                                               |
| Integration              | 10 Dateien, 17/17 Tests bestanden                                                               |
| DB/RLS/Storage           | 22 Dateien, 201/201 pgTAP-Assertions bestanden                                                  |
| Supabase DB-Lint         | bestanden, keine Befunde                                                                        |
| Next.js Production Build | bestanden, 26 App-Routen plus Proxy                                                             |
| E2E                      | 14/14 je Chromium, Firefox, WebKit, Mobile Chrome und Mobile Safari; 70/70 Durchläufe bestanden |
| Axe WCAG 2.2 AA          | 14/14 je Browserprofil; 70/70 automatisierte Scans bestanden                                    |
| PWA                      | 2/2 je Browserprofil; 10/10 Prüfungen bestanden                                                 |

Die Browserläufe verwenden einen mit lokalen Supabase-Werten gebauten Next.js-Production-Build. Für E2E und Axe wird jedes Browserprojekt gegen eine frisch zurückgesetzte lokale Datenbank ausgeführt. Rein technische Fixture-RPCs verwenden lokale, kurzlebige Test-JWTs; der echte Auth-Ablauf bleibt in der Auth-E2E-Strecke geprüft und die produktnahe Rate-Limit-Konfiguration unverändert.

Nicht Bestandteil dieses automatisierten Erfolgs sind die weiterhin offenen manuellen Geräte-, Screenreader- und Usability-Gates. Das separate Lighthouse-Gate ist ebenfalls noch nicht bestanden, weil die LCP-Mediane über 2,5 Sekunden liegen.
