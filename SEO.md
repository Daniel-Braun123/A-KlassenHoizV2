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

Login, Registrierung, Passwort-Wiederherstellung, Einladungen, Datenschutz-/Nutzungshinweise, Offline-Seite, Start/Dashboard, Profile, private Tipprunden und Administration sind bewusst `noindex, follow`. Auth-Callbacks und private Daten bleiben zusätzlich technisch geschützt; `robots.txt` ist kein Sicherheitsmechanismus.

## Google Search Console

Nach dem Deployment:

1. [Google Search Console](https://search.google.com/search-console/) öffnen.
2. Eine Domain-Property für eine eigene Domain oder zunächst eine URL-Präfix-Property für `https://a-klassenhoiz.vercel.app/` hinzufügen.
3. Die von Google verlangte Verifizierung durchführen. Für eine Domain-Property ist dafür normalerweise ein DNS-TXT-Eintrag nötig.
4. Unter „Sitemaps“ `https://a-klassenhoiz.vercel.app/sitemap.xml` einreichen.
5. Die Startseite über die URL-Prüfung live testen.
6. Für die Startseite die Indexierung beantragen.
7. Den Bericht zur Seitenindexierung auf Fehler, ausgeschlossene Duplikate und Crawling-Probleme kontrollieren.
8. Den Bericht zu Core Web Vitals beobachten, sobald Google genügend reale Nutzungsdaten gesammelt hat.
9. Unter „Leistung“ Suchanfragen, Impressionen, Klicks und durchschnittliche Position regelmäßig auswerten.

## Domainwechsel

Die kanonische Basis kommt aus `NEXT_PUBLIC_SITE_URL`; der Produktions-Fallback steht einmalig in `lib/config/site.ts`. Bei einem Wechsel auf `https://a-klassenhoiz.de/` muss die Vercel-Umgebungsvariable auf diese URL gesetzt werden. Danach neu deployen, Sitemap und Canonicals prüfen, die neue Search-Console-Property verifizieren und dauerhafte Weiterleitungen von der alten Domain einrichten.

## Performance-Verifikation

Die Startseite wurde als Production Build mit Lighthouse 13.4 dreimal im mobilen Simulationsprofil (360 × 640 Pixel, simulierte Drosselung) geprüft. Die Medianwerte lagen bei Performance 98, LCP 2.383 ms, CLS 0 und TBT 33 ms; Accessibility, Best Practices und SEO erreichten jeweils 100. INP ist eine Feldmetrik und wird ohne Real-User-Monitoring nicht im Lab gemessen; TBT dient hier nur als reproduzierbarer Lab-Indikator für Reaktionsfähigkeit.
