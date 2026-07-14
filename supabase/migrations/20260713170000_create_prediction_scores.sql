create table app.prediction_scores (
  prediction_id uuid primary key references app.predictions(id) on delete cascade,
  round_id uuid not null references app.prediction_rounds(id) on delete cascade,
  membership_id uuid not null references app.round_memberships(id) on delete cascade,
  match_id uuid not null references app.matches(id) on delete cascade,
  matchday_id uuid not null references app.matchdays(id),
  points smallint not null check (points in (0,2,3,4)),
  result_revision integer not null check (result_revision > 0),
  calculation_version smallint not null check (calculation_version > 0),
  calculated_at timestamptz not null default clock_timestamp(),
  unique (round_id,membership_id,match_id)
);

create index prediction_scores_round_total_idx on app.prediction_scores(round_id,membership_id,points);
create index prediction_scores_round_matchday_idx on app.prediction_scores(round_id,matchday_id,membership_id,points);
create index prediction_scores_match_recalc_idx on app.prediction_scores(match_id,prediction_id);

alter table app.prediction_scores enable row level security;
alter table app.prediction_scores force row level security;
create policy prediction_scores_round_member_read on app.prediction_scores for select to authenticated
using ((select private.is_round_member(round_id)));

revoke all on app.prediction_scores from public,anon,authenticated;
grant select on app.prediction_scores to authenticated,service_role;
