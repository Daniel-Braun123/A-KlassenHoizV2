# Observability-Grenze für V1

**Aufgabe:** T014  
**Stand:** 2026-07-13  
**Status:** VERBINDLICH

## V1 erhebt keine Produktbeobachtung

A-KlassenHoiz V1 integriert weder Produktanalytics noch Real-User Monitoring (RUM), Session Replay,
Heatmaps, Werbe-/Tracking-Pixel, Nutzer-Fingerprinting oder clientseitige Telemetrie-SDKs. Es gibt
keine Feldmetrik-Releasegrenze und insbesondere kein p75-Gate aus realen Nutzersitzungen.

Nicht zulässige Beispiele sind Vercel Web Analytics/Speed Insights, Google Analytics, Sentry
Replay/Performance, PostHog, Plausible, Mixpanel und selbst gebaute Ereignistabellen. Eine spätere
PII-freie, aggregierte Beobachtung benötigt eine eigene Spezifikation, Datenschutzentscheidung und
ausdrückliche Freigabe.

## Zulässige technische Betriebsdaten

Notwendige Server-/Plattformlogs dürfen nur Diagnoseinformationen enthalten:

- zufällige Request-/Korrelations-ID;
- grobe Operation oder stabiler, nicht personenbezogener Fehlercode;
- Zeitpunkt, Laufzeit, HTTP-Statusklasse und Umgebung;
- interne, nicht sprechende Objekt-ID nur, wenn sie für Security-/Auditnachweise erforderlich ist;
- keine automatische dauerhafte Zuordnung zu einem Nutzerprofil.

Verbotene Log-, Fehler- und Trace-Payloads:

- E-Mail-Adressen, Namen und private Tipprundennamen;
- Passwörter, Cookies, JWTs, Refresh-Tokens, API-Keys und Einladungs-Tokens;
- Tipps, Ergebnisseingaben vor Commit und sonstige fachliche Form-/Request-Bodies;
- vollständige URLs oder Referrer mit Einladungstoken/privatem Identifier;
- Auth-Metadaten oder Stack-Kontext, der Secrets beziehungsweise personenbezogene Werte enthält.

`lib/observability/redact.ts` muss diese Kategorien strukturell redigieren. `logger.ts` darf nur
einen lokalen/serverseitigen Logger ohne Analytics-Sink bereitstellen. Client-Code erhält keine
Secrets und sendet keine eigenen Telemetrieereignisse.

## Release-Nachweise

Performance wird ausschließlich in einem reproduzierbaren Lighthouse-Mobile-Labor gemessen:
Median aus drei Production-Build-Läufen, Performance mindestens 90, LCP höchstens 2,5 Sekunden,
CLS höchstens 0,1 und TBT höchstens 200 Millisekunden. Gerät, Netzwerkprofil, Buildmodus und Ablauf
werden im Qualitätsnachweis fixiert.

Vor Release prüfen Dependency-/Bundle-Audit, Netzwerkaufzeichnung und Code-Suche, dass kein
Analytics-/RUM-SDK und keine private Log-Payload vorhanden ist. Sicherheits- und Admin-Audits sind
fachliche, minimal gehaltene Nachweise und dürfen nicht als Produktanalytics zweckentfremdet werden.
