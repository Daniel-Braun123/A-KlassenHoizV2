# Source Layout

Die Anwendung bleibt ein einzelnes Next.js-Projekt mit vertikalen Fachmodulen.

- `app/`: Routing, Server Components, Route Handler und dünne Seitengrenzen
- `components/ui/`: fachneutrale zugängliche Primitives
- `components/patterns/`: wiederverwendbare Seiten-, Status- und Navigationsmuster
- `components/<domain>/`: sichtbare Fachkomponenten
- `features/<domain>/`: Schemas, DTOs, server-only Services und dünne Server Actions
- `lib/`: Supabase-Clients, Auth-Guards, Cache-, Logging- und Validierungsgrundlage
- `styles/`: Tokens, globale Regeln und kleine Utilities
- `supabase/migrations/`: ausschließlich neue V2-Migrationen
- `supabase/tests/`: pgTAP-, RLS- und Storage-Nachweise
- `tests/`: Unit-, Component-, Integration-, E2E-, PWA- und Accessibility-Tests
- `scripts/`: lokale Qualitätskommandos und separat gesperrte Betriebsrunbooks

Server Actions prüfen Authentifizierung und Objektrecht selbst und delegieren an `server-only`
Services. Der Browser erhält ausschließlich minimale DTOs und niemals Secret-/Service-Role-Keys.
