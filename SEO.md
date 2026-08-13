# SEO für A-KlassenHoiz

## Implementierte Maßnahmen

- Zentrale Website-Konfiguration in `lib/config/site.ts` mit Titel, Beschreibung, Locale und Basis-URL
- Next.js Metadata API für Title, Description, Canonical, Robots, Open Graph und Twitter Card
- Serverseitig erzeugte Open-Graph- und Twitter-Bilder ohne externen Dienst
- Erweiterte, semantische Landingpage mit Produktbeschreibung, echten Funktionen, Ablauf und FAQ
- Valides JSON-LD für `WebSite`, `WebApplication` und den sichtbaren FAQ-Bereich
- Frameworkgerechte `robots.txt`, `sitemap.xml`, Noindex-Metadaten und echte 404-Seite
- Weiterverwendung des bestehenden PWA-Manifests, Brandings, Icon-Sets und Designsystems

## Zielkeywords

Primär sind Suchintentionen rund um „Fußball-Tippspiel“, „Fußball-Tippspiel kostenlos“, „Tippspiel mit Freunden“ und „private Tipprunde erstellen“. Sekundär werden natürliche Varianten wie „Fußball-Tipprunde“, „Online Fußball-Tippspiel“, „Fußball Ergebnisse tippen“ und ligabezogene Tippspiel-Suchen abgedeckt. „Fußballtipps“ ist bewusst kein Hauptbegriff, weil A-KlassenHoiz keine Wett- oder Prognoseberatung anbietet.

## Indexierbare Seiten

Aktuell soll ausschließlich die öffentliche Startseite `/` indexiert werden. Sie ist die zentrale Produkt- und Einstiegseite und die einzige URL in der Sitemap.

## Noindex-Seiten

Login, Registrierung, Passwort-Wiederherstellung, Einladungen, Datenschutz-/Nutzungshinweise, Offline-Seite, Start/Dashboard, Profile, private Tipprunden und Administration sind bewusst `noindex, follow`. Öffentlich erreichbare Utility-Seiten dürfen gecrawlt werden, damit Suchmaschinen diese Anweisung zuverlässig lesen können.

Die `robots.txt` enthält deshalb keine `Disallow`-Regeln. Geschützte Bereiche werden nicht durch Crawling-Regeln abgesichert, sondern durch die bestehende serverseitige Authentifizierung und Autorisierung. Anonyme Aufrufe werden auf die ebenfalls mit `noindex, follow` markierte Anmeldung umgeleitet oder als nicht verfügbar behandelt. Die Sitemap nennt weiterhin ausschließlich die indexierbare Startseite; Auth-Callbacks und private Daten sind nicht darin enthalten. `robots.txt` ist ausdrücklich kein Sicherheitsmechanismus.

## Google Search Console

Nach dem Deployment:

1. [Google Search Console](https://search.google.com/search-console/) öffnen.
2. Die Domain-Property für `a-klassenhoiz.de` hinzufügen und verifizieren.
3. Die von Google verlangte Verifizierung durchführen. Für eine Domain-Property ist dafür normalerweise ein DNS-TXT-Eintrag nötig.
4. Unter „Sitemaps“ `https://a-klassenhoiz.de/sitemap.xml` einreichen.
5. Die Startseite über die URL-Prüfung live testen.
6. Für die Startseite die Indexierung beantragen.
7. Den Bericht zur Seitenindexierung auf Fehler, ausgeschlossene Duplikate und Crawling-Probleme kontrollieren.
8. Den Bericht zu Core Web Vitals beobachten, sobald Google genügend reale Nutzungsdaten gesammelt hat.
9. Unter „Leistung“ Suchanfragen, Impressionen, Klicks und durchschnittliche Position regelmäßig auswerten.

## Domainwechsel

Die kanonische Basis kommt aus `NEXT_PUBLIC_SITE_URL`; der Produktions-Fallback steht einmalig in `lib/config/site.ts`. Bei einem späteren Domainwechsel müssen beide Werte auf die neue HTTPS-Origin gesetzt werden. Danach neu deployen, Sitemap und Canonicals prüfen, die neue Search-Console-Property verifizieren und dauerhafte Weiterleitungen von den bisherigen Domains einrichten.

## Performance-Verifikation

Die Startseite wurde als Production Build mit Lighthouse 13.4 dreimal im mobilen Simulationsprofil (360 × 640 Pixel, simulierte Drosselung) geprüft. Die Medianwerte lagen bei Performance 98, LCP 2.383 ms, CLS 0 und TBT 33 ms; Accessibility, Best Practices und SEO erreichten jeweils 100. INP ist eine Feldmetrik und wird ohne Real-User-Monitoring nicht im Lab gemessen; TBT dient hier nur als reproduzierbarer Lab-Indikator für Reaktionsfähigkeit.
