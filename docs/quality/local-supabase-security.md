# Lokaler Supabase-Sicherheitscheck

Am 13. Juli 2026 wurde der lokale V2-Stack vollständig neu aufgebaut und mit `supabase db lint --local --schema api,app,extensions,private,public,tests` geprüft.

- DB-Lint: keine Befunde;
- pgTAP: 22 Dateien, 201 Assertions bestanden;
- RLS auf exponierten Read-Modellen und Basistabellen nachgewiesen;
- direkte Browser-DML minimiert, kontrollierte RPCs explizit erteilt;
- Storage-MIME-, Größen-, Pfad- und Rollenmatrix bestanden.

Es fand bei diesem Check keine Remote-Mutation statt.
