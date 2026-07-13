create view api.my_rounds with (security_invoker=true) as
select r.id, r.name, r.status, r.version, r.league_season_id, m.id as membership_id, m.role, m.nickname,
  l.name as league_name, s.label as season_label, r.created_at
from app.prediction_rounds r
join app.round_memberships m on m.round_id=r.id and m.user_id=(select auth.uid()) and m.status='active'
join app.league_seasons ls on ls.id=r.league_season_id
join app.leagues l on l.id=ls.league_id
join app.seasons s on s.id=ls.season_id;

create view api.round_members with (security_invoker=true) as
select m.id, m.round_id, m.nickname, m.role, m.status, m.joined_at, m.ended_at
from app.round_memberships m;

revoke all on api.my_rounds, api.round_members from public, anon;
grant select on api.my_rounds, api.round_members to authenticated, service_role;

create function api.get_invitation_preview(p_token_hash bytea)
returns table(round_name text,league_name text,season_label text,expires_at timestamptz)
language sql stable security definer set search_path='' as $function$
  select r.name,l.name,s.label,i.expires_at
  from private.invitations i
  join app.prediction_rounds r on r.id=i.round_id and r.status='active'
  join app.league_seasons ls on ls.id=r.league_season_id
  join app.leagues l on l.id=ls.league_id
  join app.seasons s on s.id=ls.season_id
  where i.token_hash=p_token_hash and i.revoked_at is null and i.expires_at>clock_timestamp()
$function$;
revoke all on function api.get_invitation_preview(bytea) from public;
grant execute on function api.get_invitation_preview(bytea) to anon,authenticated,service_role;
