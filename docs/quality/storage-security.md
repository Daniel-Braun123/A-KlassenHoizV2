# Storage-Sicherheitsabnahme

Der einzige V1-Bucket `club-logos` ist öffentlich lesbar und auf 2 MiB sowie PNG, JPEG und WebP beschränkt. Schreiben, Aktualisieren und Löschen ist ausschließlich aktiven App-Admins erlaubt. Schreibpfade müssen `clubs/<uuid>/v<positive-version>.<extension>` entsprechen.

Die pgTAP-Slices `supabase/tests/storage/000_club_logos.sql` und `020_club_logos.sql` belegen:

- anon/authenticated read und anon/member write deny;
- App-Admin-Write nur mit erlaubtem Pfad, MIME und 1–2.097.152 Byte;
- Deny für falschen Bucket, unzulässige MIME, leere/zu große Datei und nicht versionierten oder fremden Pfad;
- keine privaten Tipp-, Profil- oder Einladungseinträge in Storage.

Ergebnis: 10/10 Storage-Assertions bestanden.
