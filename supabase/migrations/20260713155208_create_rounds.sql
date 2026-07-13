create table app.prediction_rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  league_season_id uuid not null references app.league_seasons(id),
  owner_membership_id uuid not null,
  status app.round_status not null default 'active',
  has_predictions boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint prediction_rounds_name_trimmed check (name = btrim(name) and char_length(name) between 1 and 80)
);

create table app.round_memberships (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references app.prediction_rounds(id) on delete cascade,
  user_id uuid references app.profiles(user_id),
  role app.round_role not null,
  nickname text not null,
  status app.membership_status not null default 'active',
  joined_at timestamptz not null default clock_timestamp(),
  ended_at timestamptz,
  anonymization_key uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint round_memberships_nickname_trimmed check (nickname = btrim(nickname) and char_length(nickname) between 1 and 40),
  constraint round_memberships_user_shape check ((status = 'anonymized' and user_id is null and anonymization_key is not null) or (status <> 'anonymized' and user_id is not null)),
  constraint round_memberships_end_shape check ((status = 'active' and ended_at is null) or (status <> 'active' and ended_at is not null))
);

create index prediction_rounds_league_season_id_idx on app.prediction_rounds(league_season_id);
create index prediction_rounds_owner_membership_id_idx on app.prediction_rounds(owner_membership_id);
create index round_memberships_round_id_idx on app.round_memberships(round_id, status);
create index round_memberships_user_id_idx on app.round_memberships(user_id) where user_id is not null;
create trigger prediction_rounds_set_updated_at before update on app.prediction_rounds for each row execute function private.set_updated_at();
create trigger round_memberships_set_updated_at before update on app.round_memberships for each row execute function private.set_updated_at();
