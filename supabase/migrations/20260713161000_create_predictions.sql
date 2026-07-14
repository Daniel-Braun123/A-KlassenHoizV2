create table app.predictions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references app.prediction_rounds(id) on delete cascade,
  membership_id uuid not null references app.round_memberships(id) on delete cascade,
  match_id uuid not null references app.matches(id),
  home_goals smallint not null check(home_goals between 0 and 99),
  away_goals smallint not null check(away_goals between 0 and 99),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create trigger predictions_set_updated_at before update on app.predictions for each row execute function private.set_updated_at();
