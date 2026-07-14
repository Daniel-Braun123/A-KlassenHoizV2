begin;create extension if not exists pgtap with schema extensions;set local search_path=extensions,public,pg_catalog;select plan(7);
select policies_are('app','prediction_scores',array['prediction_scores_round_member_read'],'scores have one round-member read policy');
select ok(not has_table_privilege('authenticated','app.prediction_scores','INSERT'),'no direct score insert');
select ok(not has_table_privilege('authenticated','app.prediction_scores','UPDATE'),'no direct score update');
select ok(not has_table_privilege('authenticated','app.prediction_scores','DELETE'),'no direct score delete');
select ok(has_table_privilege('authenticated','api.overall_ranking','SELECT'),'members can query overall ranking view');
select ok(has_table_privilege('authenticated','api.matchday_ranking','SELECT'),'members can query matchday ranking view');
select tests.authenticate_as('app_admin');set local role authenticated;select is((select count(*) from app.prediction_scores),0::bigint,'app admin has no private score bypass');reset role;
select * from finish();rollback;
