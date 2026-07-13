-- A-KlassenHoiz V2 starts from new schemas. No legacy schema is imported.
create schema app authorization postgres;
create schema private authorization postgres;
create schema api authorization postgres;

comment on schema app is 'Non-exposed A-KlassenHoiz V2 domain tables';
comment on schema private is 'Non-exposed privileged helpers and private V2 data';
comment on schema api is 'Only schema exposed through the Supabase Data API';

revoke all on schema app from public, anon, authenticated;
revoke all on schema private from public, anon, authenticated;
revoke all on schema api from public, anon, authenticated;

revoke create on schema public from public;
