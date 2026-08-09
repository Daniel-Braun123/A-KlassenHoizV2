# Kein Analytics/RUM in V1

> **Abgelöst am 10. August 2026:** Dieser Nachweis dokumentiert den ursprünglichen Releasezustand.
> Der Projekteigentümer hat danach die eng begrenzte Integration von Vercel Speed Insights
> freigegeben. Produktanalytics und Session Replay bleiben ausgeschlossen; private dynamische
> URL-Segmente und Parameter werden vor der anonymen Web-Vitals-Übertragung entfernt.

Geprüft am 13. Juli 2026:

- Laufzeitabhängigkeiten und direkte Entwicklungsabhängigkeiten enthalten kein PostHog, Mixpanel, Segment, Amplitude, Sentry, Datadog oder New Relic SDK;
- das Lockfile enthält Sentry ausschließlich transitiv im dev-only Lighthouse-CLI-Baum; es wird weder importiert noch gebündelt oder zur Laufzeit initialisiert (`npm explain @sentry/node` → `lighthouse@13.4.0`);
- Quellcode initialisiert keinen Analytics-, Session-Replay- oder RUM-Client;
- Service Worker speichert keine privaten Navigationen, Auth-, RSC- oder Supabase-Antworten;
- `scripts/audit-observability.ps1` blockiert nicht redigierte Logs sowie bekannte SDKs;
- es existiert kein p75-/INP-Feldgate.

Ergebnis: `OBSERVABILITY_PRIVACY_BOUNDARY_CONFIRMED`.
