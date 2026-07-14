begin;create extension if not exists pgtap with schema extensions;set local search_path=extensions,public,pg_catalog;select plan(7);
select has_function('api','transfer_round_ownership',array['uuid','uuid','integer'],'ownership transfer exists');
select has_function('api','remove_round_member',array['uuid','uuid'],'member removal exists');
select has_function('api','leave_round',array['uuid'],'leave exists');
select has_function('api','archive_round',array['uuid','integer'],'archive exists');
select has_function('api','reactivate_round',array['uuid','integer'],'reactivation exists');
select is((select count(*) from pg_indexes where schemaname='app' and indexname='round_memberships_one_active_owner_idx'),1::bigint,'one active owner remains database-enforced');
select col_is_fk('app','prediction_rounds','owner_membership_id','round owner remains referentially constrained');
select * from finish();rollback;
