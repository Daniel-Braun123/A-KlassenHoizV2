# US7 manuelle Accessibility-Matrix

**V1-Status 2026-07-14:** Der Product Owner hat die Screenreader-Abnahme ausdrücklich
zurückgestellt. Die offenen Einträge unten werden nicht als bestanden umgedeutet; automatisierte
Axe-, Fokus-, Reflow-, Kontrast- und Reduced-Motion-Prüfungen sind grün.

Die automatisierten WCAG-2.2-AA- und Reflow-Prüfungen sind Teil der lokalen CI. Reale Screenreader-, Forced-Colors- und Geräteprüfungen werden nach dem Protokoll `manual-accessibility-protocol.md` durchgeführt. Diese Datei behauptet keine noch nicht ausgeführte manuelle Prüfung.

| Prüfung                 | Status                                   |
| ----------------------- | ---------------------------------------- |
| Tastatur Kernreise      | offen für reale Abnahme                  |
| NVDA                    | offen für reale Abnahme                  |
| VoiceOver iOS           | offen für reale Abnahme                  |
| 200 % Text / 400 % Zoom | automatisiert vorbereitet, manuell offen |
| Forced Colors           | CSS implementiert, manuell offen         |
| Reduced Motion          | CSS implementiert, manuell offen         |
