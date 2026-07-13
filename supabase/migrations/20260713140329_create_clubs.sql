create table app.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  logo_path text,
  status app.club_status not null default 'active',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint clubs_name_trimmed check (name = btrim(name) and char_length(name) between 1 and 120),
  constraint clubs_short_name_trimmed check (short_name = btrim(short_name) and char_length(short_name) between 1 and 20),
  constraint clubs_logo_path check (logo_path is null or logo_path ~ ('^clubs/' || id::text || '/v[1-9][0-9]*\.(png|jpe?g|webp)$'))
);

create unique index clubs_name_ci_unique on app.clubs (lower(name));
create unique index clubs_short_name_ci_unique on app.clubs (lower(short_name));

create table app.league_season_clubs (
  league_season_id uuid not null references app.league_seasons(id),
  club_id uuid not null references app.clubs(id),
  status app.league_season_club_status not null default 'active',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (league_season_id, club_id)
);

create trigger clubs_set_updated_at before update on app.clubs for each row execute function private.set_updated_at();
create trigger league_season_clubs_set_updated_at before update on app.league_season_clubs for each row execute function private.set_updated_at();
