# US1 – Authentifizierung

**Aufgabe:** T060  
**Stand:** 2026-07-13  
**Status:** BESTANDEN

## Implementierter Slice

- Registrierung mit E-Mail, Passwort und Anzeigename sowie unmittelbarer Sitzung ohne
  Bestätigungszwischenschritt;
- Login, Logout, neutraler Passwort-Reset und neue Passwortvergabe;
- Supabase-SSR-Clients, Cookie-Proxy und `getClaims()`-basierter Seitenschutz;
- frische Profile mit eigener RLS-Sicht, serverkontrollierter Rollenmutation und operativer
  App-Admin-Grenze;
- Einladungsziel bleibt über Registrierung und Login erhalten;
- mobile Formulare mit Passwortmanager, Paste, Anzeigen/Verbergen, permanenten Labels und
  Live-Status.

## Nachweise

| Prüfung                     | Ergebnis                                                                         |
| --------------------------- | -------------------------------------------------------------------------------- |
| Auth-Unit                   | Validierung, Redirect-Allowlist, Zielauflösung und neutrale Fehlerabbildung grün |
| Lokale Supabase-Integration | Signup mit aktiver Sitzung und Profil, Logout/Login und Reset grün               |
| pgTAP/RLS                   | eigene/fremde/gesperrte/App-Admin-Profile sowie Grants und Security-Invoker grün |
| Mobile E2E                  | Einladungskontext und Register-/Login-/Reset-Navigation auf Mobile Chrome grün   |
| Accessibility               | vier Auth-Routen ohne Axe-Verstoß in `wcag2a`, `wcag2aa`, `wcag22aa`             |
| Strict Types/Lint/Build     | grün                                                                             |

Supabase-Providerfehler, E-Mail-Adressen und Passwörter werden nicht geloggt oder in öffentliche
Fehlermeldungen übernommen. Supabase-Auth-Rate-Limits werden als neutraler `RATE_LIMITED`-Zustand
abgebildet.
