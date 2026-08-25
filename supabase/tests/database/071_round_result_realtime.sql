begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(7);

select has_function(
  'private',
  'can_receive_round_broadcast',
  array['text'],
  'round broadcast authorization helper exists'
);
select has_function(
  'private',
  'broadcast_match_result_change',
  array[]::text[],
  'result broadcast trigger function exists'
);
select has_trigger(
  'app',
  'match_results',
  'match_results_broadcast_change',
  'result changes emit realtime events'
);
select is(
  (
    select count(*)
    from pg_indexes
    where schemaname = 'app'
      and indexname = 'round_memberships_active_round_user_idx'
  ),
  1::bigint,
  'active round membership lookups are indexed'
);

insert into app.leagues(id, name, short_name)
values ('71000000-0000-4000-8000-000000000001', 'Realtime Liga', 'RTL');
insert into app.seasons(id, label, starts_on, ends_on)
values ('71000000-0000-4000-8000-000000000002', '26/27', '2026-07-01', '2027-06-30');
insert into app.league_seasons(id, league_id, season_id, status, published_at)
values (
  '71000000-0000-4000-8000-000000000003',
  '71000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000002',
  'published',
  clock_timestamp()
);
insert into app.clubs(id, name, short_name)
values
  ('71000000-0000-4000-8000-000000000004', 'Realtime Heim', 'RTH'),
  ('71000000-0000-4000-8000-000000000005', 'Realtime Gast', 'RTG');
insert into app.league_season_clubs(league_season_id, club_id)
values
  ('71000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000004'),
  ('71000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000005');
insert into app.matchdays(id, league_season_id, number, status, starts_on, ends_on)
values (
  '71000000-0000-4000-8000-000000000006',
  '71000000-0000-4000-8000-000000000003',
  1,
  'completed',
  '2026-07-01',
  '2026-07-01'
);
insert into app.matches(id, matchday_id, home_club_id, away_club_id, kickoff_at, status)
values (
  '71000000-0000-4000-8000-000000000007',
  '71000000-0000-4000-8000-000000000006',
  '71000000-0000-4000-8000-000000000004',
  '71000000-0000-4000-8000-000000000005',
  '2026-07-01 12:00+00',
  'completed'
);

set constraints all deferred;
insert into app.prediction_rounds(id, name, league_season_id, owner_membership_id)
values (
  '71000000-0000-4000-8000-000000000008',
  'Realtime Runde',
  '71000000-0000-4000-8000-000000000003',
  '71000000-0000-4000-8000-000000000009'
);
insert into app.round_memberships(id, round_id, user_id, nickname, role)
values (
  '71000000-0000-4000-8000-000000000009',
  '71000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000003',
  'Realtime Owner',
  'owner'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000003',
  true
);
select ok(
  private.can_receive_round_broadcast('round:71000000-0000-4000-8000-000000000008'),
  'an active member can receive its round updates'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000001',
  true
);
select ok(
  not private.can_receive_round_broadcast('round:71000000-0000-4000-8000-000000000008'),
  'a nonmember cannot receive another round updates'
);

insert into app.match_results(match_id, decision, home_goals, away_goals, revision_no, updated_by)
values (
  '71000000-0000-4000-8000-000000000007',
  'official',
  2,
  1,
  1,
  '00000000-0000-4000-8000-000000000004'
);
select is(
  (
    select count(*)
    from realtime.messages
    where topic = 'round:71000000-0000-4000-8000-000000000008'
      and event = 'result_changed'
  ),
  1::bigint,
  'an official result emits one minimal round event'
);

select * from finish();
rollback;
