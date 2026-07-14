# Komponenten und Zustände

Alle interaktiven Ziele sind mindestens 44 × 44 CSS-Pixel groß und besitzen einen sichtbaren `:focus-visible`-Ring. Bedeutung wird nie allein durch Farbe vermittelt.

| Primitive      | Zustände                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Button         | Standard, Hover, gedrückt per 1-px-Translation, Disabled, Pending über deaktivierten Button und Live-Text, Gefahr |
| Link           | Text oder Buttonform, Hover, Fokus, `aria-current`                                                                |
| Input/Select   | Label, Hint, Fehlertext, `aria-invalid`, Disabled                                                                 |
| Dialog         | nativer Modal-Dialog, Titel/Description, Escape/Cancel, fokussierbarer Schließen-Button                           |
| StatusState    | Loading, Empty, Error, Locked, Success, Offline; Symbol plus Text                                                 |
| FormStatus     | `status`/`alert`, polite/assertive Live-Region, Busy                                                              |
| PredictionCard | incomplete, saving, saved, error, locked; nie falsches Gespeichert                                                |
| Ranking        | semantische Tabelle, Eigenmarkierung mit Text „Du“, horizontal fokussierbare Region                               |

Bei `prefers-reduced-motion` werden Animationen und Übergänge praktisch deaktiviert. Forced Colors und erhöhte Kontraste erhalten explizite Rahmen beziehungsweise Outlines.
