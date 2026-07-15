# A-KlassenHoiz

A-KlassenHoiz ist eine mobile-first PWA für private Fußball-Tipprunden. Nutzer können Runden erstellen oder per Einladung beitreten, Tipps bis zum Anpfiff abgeben und Gesamt- sowie Spieltagsranglisten verfolgen. Liga-Saisons, Vereine, Spielpläne und Ergebnisse werden zentral verwaltet.

## Technologien

- Next.js 16, React 19 und TypeScript im Strict-Modus
- Supabase Auth, PostgreSQL, Storage und Row Level Security (RLS)
- Vitest für Unit- und Integrationstests
- Playwright für End-to-End-, Responsive- und PWA-Tests
- Vercel für Build und Deployment

## Lokale Entwicklung

Voraussetzungen sind Node.js 24, npm 11 und Docker Desktop. Supabase läuft lokal in Docker-Containern.

```bash
npm install
cp .env.example .env.local
npm run db:start
npm run db:reset
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar. Supabase Studio läuft standardmäßig unter `http://127.0.0.1:54323`.

`npm run db:reset` erstellt ausschließlich die lokale Datenbank aus den Migrationen und Seed-Daten neu.

## Wichtige Befehle

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript prüfen
npm run test:unit     # Unit- und Komponententests
npm run test:e2e      # Playwright-E2E-Tests
npm run build         # Produktions-Build
```

Produktiv: [a-klassenhoiz.vercel.app](https://a-klassenhoiz.vercel.app/)
