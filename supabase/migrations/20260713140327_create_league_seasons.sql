create table app.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  status app.catalog_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint leagues_name_trimmed check (name = btrim(name) and char_length(name) between 1 and 120),
  constraint leagues_short_name_trimmed check (short_name is null or (short_name = btrim(short_name) and char_length(short_name) between 1 and 20))
);

create unique index leagues_name_ci_unique on app.leagues (lower(name));
create unique index leagues_short_name_ci_unique on app.leagues (lower(short_name)) where short_name is not null;

create table app.seasons (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  starts_on date not null,
  ends_on date not null,
  status app.catalog_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint seasons_label_trimmed check (label = btrim(label) and char_length(label) between 1 and 40),
  constraint seasons_date_order check (starts_on <= ends_on)
);

create table app.league_seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references app.leagues(id),
  season_id uuid not null references app.seasons(id),
  status app.league_season_status not null default 'draft',
  published_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (league_id, season_id),
  constraint league_seasons_lifecycle_dates check (
    (status = 'draft' and published_at is null and completed_at is null and archived_at is null)
    or (status = 'published' and published_at is not null and completed_at is null and archived_at is null)
    or (status = 'completed' and published_at is not null and completed_at is not null and archived_at is null)
    or (status = 'archived' and published_at is not null and archived_at is not null)
  )
);

create trigger leagues_set_updated_at before update on app.leagues for each row execute function private.set_updated_at();
create trigger seasons_set_updated_at before update on app.seasons for each row execute function private.set_updated_at();
create trigger league_seasons_set_updated_at before update on app.league_seasons for each row execute function private.set_updated_at();
