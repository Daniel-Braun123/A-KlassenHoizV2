create table app.matchdays (
  id uuid primary key default gen_random_uuid(),
  league_season_id uuid not null references app.league_seasons(id),
  number smallint not null check (number > 0),
  display_name text,
  status app.matchday_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (league_season_id, number),
  unique (id, league_season_id),
  constraint matchdays_display_name_trimmed check (display_name is null or (display_name = btrim(display_name) and char_length(display_name) between 1 and 80))
);

create table app.matches (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references app.matchdays(id),
  home_club_id uuid not null references app.clubs(id),
  away_club_id uuid not null references app.clubs(id),
  kickoff_at timestamptz not null,
  status app.match_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint matches_different_clubs check (home_club_id <> away_club_id),
  unique (matchday_id, home_club_id, away_club_id, kickoff_at)
);

create function private.validate_match_club_assignments()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare target_league_season_id uuid;
begin
  select league_season_id into target_league_season_id from app.matchdays where id = new.matchday_id;
  if target_league_season_id is null then raise exception using errcode = '23503', message = 'Unknown matchday'; end if;
  if not exists (
    select 1 from app.league_season_clubs
    where league_season_id = target_league_season_id and club_id = new.home_club_id and status = 'active'
  ) or not exists (
    select 1 from app.league_season_clubs
    where league_season_id = target_league_season_id and club_id = new.away_club_id and status = 'active'
  ) then raise exception using errcode = '23514', message = 'Both clubs must be active in the league season'; end if;
  return new;
end $function$;

create trigger matches_validate_clubs before insert or update of matchday_id, home_club_id, away_club_id on app.matches
for each row execute function private.validate_match_club_assignments();
create trigger matchdays_set_updated_at before update on app.matchdays for each row execute function private.set_updated_at();
create trigger matches_set_updated_at before update on app.matches for each row execute function private.set_updated_at();
revoke all on function private.validate_match_club_assignments() from public, anon, authenticated;
