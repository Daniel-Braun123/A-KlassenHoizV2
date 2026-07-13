# Clean-Room-Baseline

**Stand:** 2026-07-13  
**Repository:** `Daniel-Braun123/A-KlassenHoizV2`  
**Ausgangscommit:** `8984578`

## Verifizierter Ausgangszustand

Der Neubau startet in einem Repository, das vor der Implementierung ausschließlich Spec-Kit-
Fähigkeiten, die Projektverfassung, das kanonische `docs/PRD.md` und die Artefakte unter
`specs/001-rebuild-a-klassenhoiz/` enthielt. Es waren weder Anwendungscode noch lokale
Supabase-Migrationen, Datenbankmodelle, Build-Artefakte oder exportierte Altanwendungsdaten vorhanden.

## Ausgeschlossene Quellen

- alter Anwendungscode und alte Quellverzeichnisse;
- alte Supabase-Migrationen, Tabellenentwürfe, Funktionen, Policies und generierte Datenbanktypen;
- Exporte alter Auth-Nutzer, Storage-Objekte oder Anwendungsdaten;
- ein `supabase db pull` des Altbestands als V2-Baseline;
- manuell kopierte Secrets oder Environment-Werte aus einem alten Repository.

Das bestehende Supabase- und Vercel-Projekt sind ausschließlich später separat freizugebende
Infrastrukturziele. Ihr Istbestand darf nicht als fachliche oder technische Vorlage dienen.

## Lokale, nicht versionierte Umgebung

Im Arbeitsverzeichnis existiert eine bereits ignorierte `.env.local` mit den Variablennamen
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` und
`VERCEL_OIDC_TOKEN`. Der Projekteigentümer hat bestätigt, dass die Werte zu den bestehenden alten
Supabase- und Vercel-Infrastrukturprojekten gehören und für den Neubau verwendet werden dürfen.
Werte wurden weder ausgegeben noch in Quellcode, Dokumentation oder `.env.example` übernommen. Die
Datei ist keine fachliche oder technische Clean-Room-Quelle und autorisiert keine Remote-Mutation;
jede solche Aktion bleibt an ihrem eigenen Freigabegate gesperrt.

Eine read-only-Prüfung am 2026-07-13 bestätigte, dass das Supabase-Ziel erreichbar ist und der bereits
im Remote-Guard gesperrten Projektreferenz entspricht. E-Mail-Login und Registrierung sind aktiv, die
Altprojektkonfiguration liefert jedoch `mailer_autoconfirm=false` und verlangt damit aktuell noch die
E-Mail-Bestätigung. Diese Abweichung zum PRD wurde nicht verändert. Der vorhandene Vercel-OIDC-Token
enthält einen Vercel-Aussteller und Projektbezug, ist aber abgelaufen und kann keine spätere
Live-Verknüpfung authentisieren.

## Projektlokale Runtime

Node.js 24.18.0 wurde als offizielles Windows-x64-Archiv heruntergeladen, gegen die offizielle
SHA-256-Liste geprüft und unter `.tools/` entpackt. npm 11.18.0 ist ebenfalls ausschließlich unter
`.tools/` installiert. `scripts/install-project-runtime.ps1` reproduziert die Installation;
`scripts/project-npm.ps1` führt Projektkommandos mit exakt dieser Runtime aus. `.tools/` bleibt in Git,
Docker und Prettier ausgeschlossen.

## Prüfregel

Der spätere Skriptcheck `scripts/audit-clean-room.ps1` blockiert bekannte Altpfade, alte
Migrationspräfixe und nicht freigegebene Datenexporte. Jede neue Datenbankänderung beginnt in
`supabase/migrations/` mit der V2-Historie dieses Repositorys.
