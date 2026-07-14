# UI, PWA and Quality Contract

## Responsive und Designsystem

- Unterstützte Abnahmebreiten: 320, 375, 768, 1024 und 1440 CSS-Pixel; Kernflows ohne horizontalen Seitenscroll.
- Mobile Rundennavigation besitzt exakt die vier Primärziele Übersicht, Tippen, Rangliste, Ergebnisse. Profil, Rundenwechsel und Einstellungen bleiben sekundär.
- Jede Kernansicht besitzt eine primäre Aktion und definierte Empty-, Loading-, Error-, Locked-, Offline-, Success- und Destructive-States.
- Komponenten verwenden ausschließlich dokumentierte semantische Tokens. Keine ungeprüften Einzelwerte, keine Farbe als alleiniger Statusindikator.
- Touch-Ziele mindestens 44 × 44 CSS-Pixel; Tippfelder verwenden sichtbare Labels, numerischen Eingabemodus und klaren Feld-/Speicherstatus.

## WCAG 2.2 AA

- Tastatur: vollständige Bedienung, logische Reihenfolge, sichtbarer und nicht verdeckter Fokus, Fokus-Rückgabe nach Dialogen.
- Struktur: semantische Landmarks/Headings; Ranglisten als zugängliche Tabelle oder Liste; Fehler sind programmgesteuert zugeordnet.
- Auth: Passwortmanager, Paste, Anzeigen/Verbergen und korrekte `autocomplete`-Werte; keine kognitiven Tests als alleinige Auth-Hürde.
- Darstellung: normaler Text ≥ 4,5:1, großer Text/Komponentengrenzen gemäß WCAG; 200 % Text, 400 % Zoom/320-px-Reflow; beide Orientierungen.
- Status: Autosave/Fehler/Offline über nicht fokussraubende Live-Region; reduzierte Bewegung respektieren.
- Automated Gate: `eslint-plugin-jsx-a11y`, Komponentenprüfung und `@axe-core/playwright` mit `wcag22aa` ohne offene A/AA-Funde.
- Manual Gate: Keyboard-only, NVDA+Chrome, VoiceOver+Safari/iOS, High Contrast, Zoom/Reflow, Reduced Motion und Touchziele.

## PWA

- Manifest: Name, Kurzname, `start_url`, enger Scope, `display: standalone`, Theme-/Background-Farben, 192/512-Icons, maskable Icons und Apple-Touch-Icon.
- Service Worker: nur öffentliche Shell-Assets/Offline-Fallback; network-first Navigation; niemals private Daten, Auth-Antworten, RSC-Payloads oder Supabase-Responses persistent cachen.
- Keine Background Sync API und keine Offline-Tippqueue.
- Offline-UI bestätigt niemals eine Mutation. Reconnect erlaubt manuelles/automatisches erneutes Senden nur mit erneuter Serverfristprüfung.
- Update: neue Version wird angekündigt; Aktivierung/Reload passiert kontrolliert, ohne ungespeicherte Tippfelder still zu verlieren.
- Automated: Manifest/Icons, Registrierung/Aktivierung, Offline-Fallback, Cache-Allowlist und Updatepfad unter Chromium.
- Manual: echte Installation/Standalone auf Android Chrome, Desktop Chromium und iOS Safari.

## Performance- und Datenschutzbudgets

- Kein RUM, keine Produktanalytics und kein p75-/INP-Feldgate in V1.
- Reproduzierbares Lighthouse-Mobile-Labor im Production Build mit gepinnten Chromium-/Lighthouse-
  Versionen, Emulation 360×640 CSS-px/DPR 2,625, simulierten 150 ms RTT, 1.638,4 Kbit/s und CPU×4,
  kaltem Cache sowie deterministischen lokalen Testdaten. Verbindliche Oberflächen sind
  Start/Login, authentifizierte Rundenübersicht, Tippansicht mit acht Spielen, Gesamtrangliste und
  globale Spiel-/Ergebnis-Administration; jede erhält drei isolierte Läufe.
- Der Median der drei Läufe muss Performance ≥ 90, LCP ≤ 2,5 s, CLS ≤ 0,1 und TBT ≤ 200 ms
  erfüllen. Konfiguration, Build-Hash, Route und alle Einzelwerte werden dokumentiert.
- Keine Hauptjourney hängt von einem schweren, synchron geladenen optionalen Paket ab; QR-Renderer wird bei Bedarf dynamisch geladen.
- PII-freies RUM oder Produktanalytics kann erst nach V1 durch eine separate Spezifikation und
  Datenschutzentscheidung eingeführt werden. Technische Logs enthalten keine E-Mail,
  Einladungstokens, Tippwerte oder private Rundennamen.
- Service-Worker-/Browsercaches werden in automatisierten Tests auf private Antworten geprüft.

## Usability und rechtliche Freigabe

- Mindestens fünf repräsentative ungeschulte Personen; Mischung aus iOS Safari und Android Chrome,
  mindestens ein ergänzender Desktop-Test.
- Keine Moderationshilfe bei Navigation oder Bedienung. Start, Ende, Messgrenzen, Ergebnis und
  technische Ausfälle werden je Aufgabe dokumentiert.
- 5/5 schließen Registrierung, Beitritt und vollständige Tippabgabe ohne Hilfe ab; mindestens 4/5
  erkennen die nächste offene Tippaktion selbstständig. Zeitziele verwenden den Median der
  erfolgreichen Durchläufe. Technische Ausfälle bleiben separat sichtbar.
- Vor der technischen Einbindung müssen die private, nicht-kommerzielle Nutzungsgrenze und der
  Nutzungs- und Datenschutzhinweis gegen die tatsächlich eingebundenen Dienstleister,
  Datenkategorien sowie Konto- und Löschwege geprüft sein. Ein Impressum sowie private Anschrift-,
  Steuer-, Register- oder Unternehmensangaben werden in V1 nicht eingebunden. Der Build darf keine
  erfundenen Platzhalter als freigegebenen Inhalt ausliefern.

## Test- und Release-Matrix

| Ebene | Werkzeug | Blockierende Nachweise |
|---|---|---|
| Unit | Vitest / pgTAP | 4/3/2/0, Ranking, Statusübergänge, Validierung; kritische pure Funktionen 100 % Branch/Function/Line |
| Component | RTL + axe | Formzustände, Autosave-Status, Dialogfokus, Empty/Error/Locked, responsive Semantik |
| DB/RLS | lokales Supabase + pgTAP | Constraints, Grants, komplette Rollen-/Zeit-/Rundenmatrix, Storage |
| Integration | Vitest + lokales Supabase | Auth-Session, Server Action → RPC, Idempotenz, Parallelität, Anonymisierungs-Saga |
| E2E | Playwright | Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari; Production Build |
| PWA | Playwright Chromium + Real Device | Manifest, SW, Offline, Update, Installation/Standalone |
| Accessibility | axe + manuell | WCAG 2.2 AA über alle Kernjourneys |
| Performance | Lighthouse Mobile | gepinntes Laborszenario, drei Läufe, Median erfüllt Score/LCP/CLS/TBT |
| Usability | moderiertes Protokoll | 5/5 kritische Abläufe, 4/5 offene Aktion, Median-Zeitziele |
| Release | CI + Preview-Abnahme | kritische Gesamtjourney, Rechtstextfreigabe, Securityscan, keine kritischen/hohen Befunde |

Die kritische Gesamtjourney umfasst: Liga-Saison und Spielplan → Registrierung → Runde → Einladung/QR → zwei Mitglieder tippen → individuelle Sperrfristen → Ergebnis/Korrektur → Wertungen → Gesamt-/Spieltagsrangliste → mobile, Desktop- und installierte PWA-Abnahme.
