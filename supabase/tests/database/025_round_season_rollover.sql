begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
create temp table rollover_fixture as
select
  api.create_admin_league(
    'Saisonwechsel SQL Alt',
    '26/27',
    array[
      api.create_club_simple('Saisonwechsel Heim'),
      api.create_club_simple('Saisonwechsel Gast')
    ]
  ) as source_league_season_id,
  null::uuid as target_league_season_id,
  null::uuid as source_round_id,
  null::uuid as successor_round_id,
  null::uuid as matchday_id,
  null::uuid as match_id;

update rollover_fixture
set target_league_season_id = api.create_admin_league(
  'Saisonwechsel SQL Neu',
  '27/28',
  (
    select club_ids
    from api.admin_leagues
    where id = rollover_fixture.source_league_season_id
  )
);
select api.publish_admin_league(source_league_season_id, 1) from rollover_fixture;
select api.publish_admin_league(target_league_season_id, 1) from rollover_fixture;

update rollover_fixture
set matchday_id = api.create_matchday_auto(
  source_league_season_id,
  'first_leg',
  current_date - 1,
  current_date - 1
);
update rollover_fixture
set match_id = api.create_match_simple(
  matchday_id,
  (select club_ids[1] from api.admin_leagues where id = source_league_season_id),
  (select club_ids[2] from api.admin_leagues where id = source_league_season_id),
  (current_date - 1)::timestamp + interval '12 hours'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
update rollover_fixture
set source_round_id = api.create_round(
  'Freundeskreis',
  source_league_season_id,
  'Chef',
  '25000000-0000-4000-8000-000000000001'
);

insert into app.round_memberships(round_id, user_id, role, nickname)
select source_round_id, '00000000-0000-4000-8000-000000000002', 'member', 'Mitspieler'
from rollover_fixture;

insert into app.round_memberships(round_id, user_id, role, nickname, status, ended_at)
select source_round_id, '00000000-0000-4000-8000-000000000001', 'member', 'Ehemalig', 'removed', clock_timestamp()
from rollover_fixture;

insert into private.invitations(round_id, token_hash, created_by_membership_id, expires_at)
select source_round_id, extensions.digest('alte-einladung', 'sha256'), round.owner_membership_id,
  clock_timestamp() + interval '7 days'
from rollover_fixture fixture
join app.prediction_rounds round on round.id = fixture.source_round_id;

update app.prediction_rounds
set has_predictions = true
where id = (select source_round_id from rollover_fixture);

update app.matchdays set status = 'published'
where id = (select matchday_id from rollover_fixture);
insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
select match_id, 'official', 2, 1, 1, '00000000-0000-4000-8000-000000000004'
from rollover_fixture;
update app.matches set status = 'completed'
where id = (select match_id from rollover_fixture);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select api.transition_league_season(source_league_season_id, league.version, 'completed')
from rollover_fixture fixture
join app.league_seasons league on league.id = fixture.source_league_season_id;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is(
  (select count(*) from api.round_rollover_options),
  0::bigint,
  'members cannot see the owner-only rollover choices'
);
select throws_ok(
  $$select api.rollover_round(source_round_id, target_league_season_id, 1) from rollover_fixture$$,
  '42501',
  null,
  'members cannot create a successor round'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is(
  (select count(*) from api.round_rollover_options),
  1::bigint,
  'the owner sees the later published league season'
);
select throws_ok(
  $$select api.rollover_round(source_round_id, source_league_season_id, 1) from rollover_fixture$$,
  '22023',
  null,
  'the source season cannot be selected as its own successor'
);
select throws_ok(
  $$select api.rollover_round(source_round_id, target_league_season_id, 2) from rollover_fixture$$,
  'P0001',
  null,
  'a stale round version is rejected before creation'
);

update rollover_fixture
set successor_round_id = api.rollover_round(source_round_id, target_league_season_id, 1);

select isnt(
  (select successor_round_id from rollover_fixture),
  null::uuid,
  'rollover returns the new round id'
);
select is(
  (select predecessor_round_id from app.prediction_rounds where id = (select successor_round_id from rollover_fixture)),
  (select source_round_id from rollover_fixture),
  'the successor links back to the completed round'
);
select is(
  (select count(*) from app.prediction_rounds where id = (select source_round_id from rollover_fixture)),
  1::bigint,
  'the completed round remains available'
);
select results_eq(
  $$select role::text, nickname from app.round_memberships
    where round_id = (select successor_round_id from rollover_fixture)
    order by role desc, nickname$$,
  $$values ('owner'::text, 'Chef'::text), ('member'::text, 'Mitspieler'::text)$$,
  'only active members, roles and nicknames are copied'
);
select is(
  (select owner_membership_id from app.prediction_rounds where id = (select successor_round_id from rollover_fixture)),
  (select id from app.round_memberships
    where round_id = (select successor_round_id from rollover_fixture) and role = 'owner'),
  'the copied owner membership owns the new round'
);
select is(
  (select name from app.prediction_rounds where id = (select successor_round_id from rollover_fixture)),
  'Freundeskreis'::text,
  'the round name is retained'
);
select is(
  (select has_predictions from app.prediction_rounds where id = (select successor_round_id from rollover_fixture)),
  false,
  'the prediction latch starts empty'
);
select is(
  (select count(*) from app.predictions where round_id = (select successor_round_id from rollover_fixture)),
  0::bigint,
  'predictions are not copied'
);
select is(
  (select count(*) from app.prediction_scores where round_id = (select successor_round_id from rollover_fixture)),
  0::bigint,
  'points are not copied'
);
select ok(
  (select revoked_at is not null from private.invitations
    where round_id = (select source_round_id from rollover_fixture)),
  'the invitation for the finished round is revoked'
);
select is(
  (select count(*) from private.invitations where round_id = (select successor_round_id from rollover_fixture)),
  0::bigint,
  'the invitation is not copied to the new round'
);
select is(
  (select api.rollover_round(source_round_id, target_league_season_id, 1) from rollover_fixture),
  (select successor_round_id from rollover_fixture),
  'repeating the request returns the existing successor'
);
select is(
  (select count(*) from app.prediction_rounds
    where predecessor_round_id = (select source_round_id from rollover_fixture)),
  1::bigint,
  'only one successor can exist'
);
select throws_ok(
  $$select api.rotate_round_invitation(
    source_round_id,
    extensions.digest('neue-alte-einladung', 'sha256')
  ) from rollover_fixture$$,
  '23514',
  null,
  'a finished predecessor cannot receive a fresh invitation after rollover'
);
select is(
  (select successor_round_id from api.my_rounds where id = (select source_round_id from rollover_fixture)),
  (select successor_round_id from rollover_fixture),
  'the old round exposes its successor link'
);
select is(
  (select predecessor_round_id from api.my_rounds where id = (select successor_round_id from rollover_fixture)),
  (select source_round_id from rollover_fixture),
  'the new round exposes its predecessor link'
);

-- Exercise the view under actual invoker RLS, not just JWT-filtered postgres.
insert into app.round_memberships(round_id, user_id, role, nickname)
select successor_round_id, '00000000-0000-4000-8000-000000000001', 'member', 'Neu dabei'
from rollover_fixture;
grant select on rollover_fixture to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is(
  (select predecessor_round_id from api.my_rounds where id = (select successor_round_id from rollover_fixture)),
  null::uuid,
  'new members never receive a predecessor link they cannot open'
);
select is(
  (select count(*) from api.my_rounds where id = (select source_round_id from rollover_fixture)),
  0::bigint,
  'the API does not disclose rollover state for inaccessible rounds'
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is(
  (select predecessor_round_id from api.my_rounds where id = (select successor_round_id from rollover_fixture)),
  (select source_round_id from rollover_fixture),
  'copied members retain access to the previous season'
);
select api.transfer_round_ownership(
  successor_round_id,
  (select id from api.round_members where round_id = successor_round_id and nickname = 'Mitspieler'),
  1
) from rollover_fixture;
select api.leave_round(successor_round_id) from rollover_fixture;
select is(
  (select successor_round_id from api.my_rounds where id = (select source_round_id from rollover_fixture)),
  null::uuid,
  'leaving the successor hides its navigation link'
);
select is(
  (select has_successor from api.my_rounds where id = (select source_round_id from rollover_fixture)),
  true,
  'the old owner still sees that invitations and another rollover are unavailable'
);
select is(
  (select count(*) from api.round_rollover_options where source_round_id = (select source_round_id from rollover_fixture)),
  0::bigint,
  'an inaccessible successor does not offer another rollover'
);
reset role;
select * from finish();
rollback;
