-- Browser roles receive only explicit API-schema grants. Base schemas stay private.
revoke all on schema public from public, anon, authenticated;
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

revoke all on schema app from public, anon, authenticated;
revoke all on schema private from public, anon, authenticated;
grant usage on schema api to anon, authenticated, service_role;

alter default privileges for role postgres in schema app
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema app
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema app
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke execute on functions from public, anon, authenticated;
