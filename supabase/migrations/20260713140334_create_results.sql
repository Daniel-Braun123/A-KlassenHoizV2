create table app.match_results (
  match_id uuid primary key references app.matches(id),
  decision app.result_decision not null,
  home_goals smallint,
  away_goals smallint,
  revision_no integer not null check (revision_no > 0),
  updated_by uuid not null references app.profiles(user_id),
  updated_at timestamptz not null default clock_timestamp(),
  constraint match_results_goals_range check (
    (home_goals is null or home_goals between 0 and 99) and (away_goals is null or away_goals between 0 and 99)
  ),
  constraint match_results_decision_shape check (
    (decision = 'official' and home_goals is not null and away_goals is not null)
    or (decision = 'excluded' and home_goals is null and away_goals is null)
  )
);

create table app.result_revisions (
  id bigint generated always as identity primary key,
  match_id uuid not null references app.matches(id),
  revision_no integer not null check (revision_no > 0),
  old_decision app.result_decision,
  old_home_goals smallint,
  old_away_goals smallint,
  new_decision app.result_decision not null,
  new_home_goals smallint,
  new_away_goals smallint,
  changed_by uuid not null references app.profiles(user_id),
  reason text,
  changed_at timestamptz not null default clock_timestamp(),
  unique (match_id, revision_no),
  constraint result_revisions_reason_trimmed check (reason is null or (reason = btrim(reason) and char_length(reason) between 1 and 500)),
  constraint result_revisions_new_shape check (
    (new_decision = 'official' and new_home_goals between 0 and 99 and new_away_goals between 0 and 99)
    or (new_decision = 'excluded' and new_home_goals is null and new_away_goals is null)
  )
);
