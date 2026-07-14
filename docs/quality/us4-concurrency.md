# US4 Parallelität und Idempotenz

Die verbindliche Sperrreihenfolge der Tippmutation ist: Spiel, Tipprunde, aktive Mitgliedschaft, vorhandener Tipp. Dadurch prüft `save_prediction` den aktuellsten Anpfiff unter einer Zeilensperre, bevor ein Tipp geschrieben wird.

- Jede Client-Anfrage besitzt einen UUID-Idempotenzschlüssel im Scope `save_prediction`.
- Eine Wiederholung desselben Schlüssels liefert die ursprüngliche Serverbestätigung und verändert den Tipp nicht erneut.
- Verschiedene Schlüssel zweier gleichzeitig angemeldeter Clients werden serialisiert; es bleibt durch den Unique-Index genau ein Tipp pro Runde, Mitglied und Spiel.
- Die UI serialisiert Requests zusätzlich pro Spielkarte. Eine alte Bestätigung kann einen neueren `saving`-Zustand nicht als `saved` markieren.
- Es gibt keine Offline-Queue. Offline-Eingaben bleiben sichtbar, werden aber erst nach einer erfolgreichen Serverbestätigung als gespeichert angezeigt.

Verifiziert durch `tests/integration/predictions/save-prediction.test.ts` sowie die Unit-Tests der Autosave-Zustandsmaschine.
