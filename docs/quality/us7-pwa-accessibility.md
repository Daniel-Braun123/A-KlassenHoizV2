# US7 automatisierter PWA-/Accessibility-Slice

Stand: 13. Juli 2026

- 46 Unit-/Component-Tests einschließlich Designsystemzuständen bestanden.
- Manifest, 192-/512-/Maskable-Icons, Service Worker und Offline-Fallback bestanden.
- Der Service Worker cached ausschließlich freigegebene öffentliche Assets und niemals private Navigationen, RSC-, Auth- oder Supabase-Antworten.
- Kernseiten bei 320, 375, 768, 1024 und 1440 Pixeln besitzen keinen horizontalen Seitenscroll.
- Mobile Tipp-, Ranglisten- und Destruktivabläufe bestehen ihre WCAG-2.2-AA-Axe-Prüfungen.
- Reduced Motion, Forced Colors, Kontrasterhöhung, Safe Areas, Standalone und Landscape besitzen explizite Styles.

Die verbleibenden realen Geräte- und Screenreader-Prüfungen werden bewusst getrennt ausgewiesen und nicht durch Emulation als abgeschlossen behauptet.
