# Production Environment

Vercel Production enthält ausschließlich `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` und serverseitig
`SUPABASE_SECRET_KEY`. Die Werte zeigen auf V2 und wurden ohne BOM/Zeilenumbruch gesetzt. Die alten
Variablen `APP_URL`, `SUPABASE_PROJECT_REF` und `SUPABASE_SERVICE_ROLE_KEY` wurden entfernt.
