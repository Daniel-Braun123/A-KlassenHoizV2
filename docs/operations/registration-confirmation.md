# Registrierung und E-Mail-Bestätigung

## Lokaler Stand

Die Registrierung zeigt die eingegebene Adresse, Links zu Gmail und Outlook sowie erneutes Senden
mit 60 Sekunden Wartezeit. Supabase setzt zusätzlich seine eigenen Versandlimits durch.
Die Antworten unterscheiden nicht zwischen bestehenden und unbekannten Konten.

„E-Mail-Adresse korrigieren“ öffnet die Registrierung mit dem bisherigen Namen und der Adresse.
Das Passwort muss erneut eingegeben werden. Eine falsch eingegebene, unbestätigte Registrierung
wird dabei nicht administrativ geändert oder gelöscht.

Die Mail-Buttons sind HTTPS-Links. Ob eine installierte Mail-App übernimmt, hängt von Gerät und
Anbieter ab; es gibt keine erzwungene App-Erkennung und keinen automatischen App-Store-Aufruf.

## Bestätigungslink

Signup und erneutes Senden setzen `emailRedirectTo` auf die eigene `/auth/callback`-Route mit
`source=register` und einem URL-kodierten internen `next`-Ziel.
`supabase/templates/confirmation.html` ergänzt `token_hash={{ .TokenHash }}` an `{{ .RedirectTo }}`.
Die Route prüft den Einmaltoken mit `verifyOtp({ type: "email", token_hash })`, setzt über den
SSR-Client die Sitzungscookies und leitet anschließend zum ursprünglichen Ziel weiter.
Der Browser benötigt dafür keinen PKCE-Verifier aus der Registrierung. Alte PKCE-Links sowie
Google-Anmeldung, Kontolöschung und Passwortwiederherstellung bleiben separat unterstützt.

Die Weiterleitung entfernt den Token aus der Ziel-URL, ist nicht cachebar und übermittelt keinen
Referer. Ungültige oder abgelaufene Links führen zu einem Formular zum erneuten Anfordern der Mail.
Eine Anmeldung gilt im Browser, der den Link öffnet. Beim Zurückkehren in einen anderen Tab
desselben Browsers prüft die Bestätigungsansicht die eigene Sitzung und setzt den Ablauf fort.
Andere Geräte oder getrennte Browser-/PWA-Sitzungen werden nicht automatisch angemeldet.

## Veröffentlichung

Ein Git-Push allein aktualisiert keine Supabase-E-Mail-Vorlage.
Nach Veröffentlichung der kompatiblen Callback-Route muss im vorgesehenen
Supabase-Projekt die Vorlage **Confirm signup** durch den Inhalt von
`supabase/templates/confirmation.html` ersetzt werden. Die URL-Konfiguration muss die verwendete
App-Domain und ihre Callback-URLs erlauben. Neue Links verwenden dann das browserunabhängige
Verfahren; bereits verschickte PKCE-Links behalten ihre bisherigen Einschränkungen.

Lokal lädt Supabase die Vorlage über `auth.email.template.confirmation.content_path` in
`supabase/config.toml`. Ein bereits laufender lokaler Auth-Dienst muss die geänderte Vorlage neu laden.

## Prüfung

- Unit-/Komponententests: normale und bestehende Registrierungen, Versandlimits, sichere
  Weiterleitungen, ungültige Links, Sitzungsvoraussetzungen, Fokus, Mail-Buttons und Adresskorrektur.
- `tests/e2e/auth/registration-confirmation.spec.ts`: echte lokale Mailpit-Mail in einem frischen
  Browser öffnen, angemeldet bleiben und korrigierte Adresse mit Einladungsziel prüfen.
- Die E2E-Tests verwenden ausschließlich lokale Supabase-/Mailpit-Dienste und synthetische Konten.

Lokale Browserprüfung am 15.09.2026: Smartphone (320/390 px), Desktop und dunkles Design geprüft.
Mit synthetischem lokalem Auth-Server funktionierten Bestätigung in einem frischen Browser,
Sitzung nach Neuladen, Rückkehr in den ursprünglichen Tab, erneutes Senden, Adresskorrektur und
Wiederherstellung nach einem verbrauchten Link. Axe meldete in der Bestätigungsansicht keine
WCAG-A/AA-Verstöße. Docker war auf dem lokalen Rechner nicht verfügbar.

Am 08.10.2026 bestanden die echten Supabase-/Mailpit-E2E-Tests in einer isolierten
GitHub-Actions-Umgebung: Bestätigung in einem frischen Browser und Adresskorrektur
mit anschließendem Einladungsziel. Die Produktionsvorlage wurde an diesem Tag
vollständig mit der Repository-Vorlage verglichen; sie ist identisch. Site URL
und erlaubte Callback-Adressen passen zur Produktionsdomain `a-klassenhoiz.de`.

Referenzen: [Supabase E-Mail-Vorlagen](https://supabase.com/docs/guides/auth/auth-email-templates),
[Passwortbasierte Registrierung](https://supabase.com/docs/guides/auth/passwords).
