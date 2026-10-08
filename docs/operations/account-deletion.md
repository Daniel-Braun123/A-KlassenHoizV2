# Kontolöschung

E-Mail-Konten bestätigen die Löschung mit ihrem aktuellen Passwort. Für Google-Konten
ist eine neue OAuth-Bestätigung erforderlich. Das signierte, HttpOnly-Cookie bindet
die Bestätigung an Benutzer und Sitzung und läuft nach zehn Minuten ab.
Die eigentliche Löschung bleibt eine separate Aktion mit `KONTO LÖSCHEN`.

## Reihenfolge und Fehlerbehandlung

1. Identität und erneute Bestätigung prüfen.
2. Aktiven Rundenbesitz vorab prüfen; Besitzer müssen ihre Runden zuerst übertragen
   oder endgültig löschen. Die Datenbank wiederholt diese Prüfung bei der Mutation.
3. Alle Refresh-Sitzungen über die Auth-API widerrufen, ohne die Browser-Cookies zu
   entfernen. Fehlschläge stoppen den Ablauf vor der Anonymisierung.
4. Mitgliedschaften und Push-Daten mit `api.prepare_account_deletion()` anonymisieren.
5. Das Auth-Konto idempotent löschen und anschließend lokale Cookies bereinigen.

Access-Tokens bleiben nach dem Sitzungswiderruf bis zu ihrem Ablauf gültig. Der
bereits authentifizierte Client kann damit die Datenbankaktion abschließen.
Scheitert die Auth-Kontolöschung, bleiben die Browser-Zugangsdaten und die
Google-Bestätigung für einen erneuten Versuch erhalten. Nach Ablauf des Access-Tokens
ist eine erneute Anmeldung und Bestätigung erforderlich. Die bereits ausgeführte
Anonymisierung ist unwiderruflich; die Datenbankaktion kann wiederholt werden.
Ein Fehler beim abschließenden Cookie-Logout macht eine erfolgreiche Löschung
nicht wieder rückgängig und wird nicht als fehlgeschlagene Kontolöschung gemeldet.

## Prüfung

- Unit-Tests prüfen widerrufene Sitzungen, fehlgeschlagenen Widerruf, erneute Versuche,
  Kontozuordnung, Rundenbesitz und Fehler bei der abschließenden Cookie-Bereinigung.
- Der lokale Integrationstest prüft, dass die Datenbankaktion nach einem echten
  globalen Sitzungswiderruf weiter funktioniert und idempotent bleibt.

Referenz: [Supabase-Sitzungen](https://supabase.com/docs/guides/auth/sessions).
