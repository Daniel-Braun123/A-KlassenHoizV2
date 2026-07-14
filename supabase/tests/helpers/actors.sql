create schema if not exists tests;

create or replace function tests.actor_id(actor_name text)
returns uuid
language sql
immutable
strict
set search_path = ''
as $function$
  select case actor_name
    when 'nonmember' then '00000000-0000-4000-8000-000000000001'::uuid
    when 'member' then '00000000-0000-4000-8000-000000000002'::uuid
    when 'owner' then '00000000-0000-4000-8000-000000000003'::uuid
    when 'app_admin' then '00000000-0000-4000-8000-000000000004'::uuid
    when 'disabled' then '00000000-0000-4000-8000-000000000005'::uuid
  end
$function$;

create or replace function tests.authenticate_as(actor_name text)
returns void
language plpgsql
set search_path = ''
as $function$
declare
  actor_user_id uuid := tests.actor_id(actor_name);
begin
  if actor_user_id is null then
    raise exception 'Unknown deterministic test actor: %', actor_name;
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', actor_user_id::text, true);
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', actor_user_id,
      'role', 'authenticated',
      'aud', 'authenticated',
      'app_metadata', pg_catalog.json_build_object(
        'app_role', case when actor_name = 'app_admin' then 'app_admin' else 'user' end
      )
    )::text,
    true
  );
end
$function$;

create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
set search_path = ''
as $function$
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', '', true);
  perform pg_catalog.set_config(
    'request.jwt.claims',
    '{"role":"anon","aud":"anon"}',
    true
  );
end
$function$;

grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

select extensions.plan(1);
select extensions.pass('deterministic actor helpers installed');
select * from extensions.finish();
