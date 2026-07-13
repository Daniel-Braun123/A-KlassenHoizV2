begin;create extension if not exists pgtap with schema extensions;set local search_path=extensions,public,pg_catalog;select plan(7);
select function_privs_are('api','create_support_access',array['uuid','text','text','smallint'],'authenticated',array['EXECUTE'],'grant boundary is authenticated RPC');
select function_privs_are('api','get_support_metadata',array['uuid'],'authenticated',array['EXECUTE'],'read boundary is authenticated RPC');
select function_privs_are('api','revoke_support_access',array['uuid'],'authenticated',array['EXECUTE'],'revoke boundary is authenticated RPC');
select tests.authenticate_as('app_admin');set local role authenticated;select is((select count(*) from app.predictions),0::bigint,'app admin receives no predictions through RLS');reset role;
select ok(not has_table_privilege('authenticated','private.invitations','SELECT'),'app admin has no invitation-token grant');
select ok(not has_table_privilege('authenticated','auth.users','SELECT'),'app admin has no auth email source grant');
select ok(not exists(select 1 from information_schema.routines where routine_schema='api' and routine_name like '%support%list%'),'no support list or export routine exists');
select * from finish();rollback;
