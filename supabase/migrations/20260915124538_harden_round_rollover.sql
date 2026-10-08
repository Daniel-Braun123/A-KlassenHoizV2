-- All public invitation writers lock the round before the invitation. This
-- matches rollover/member lifecycle operations and avoids FK-lock deadlocks.
create or replace function api.join_round(p_token_hash bytea, p_nickname text, p_idempotency_key uuid)
returns uuid
language plpgsql security definer set search_path = '' as $function$
declare
  actor uuid;
  target_round uuid;
  membership_id uuid := gen_random_uuid();
  claimed uuid;
  existing_id uuid;
begin
  actor := private.require_round_user();
  select i.round_id into target_round from private.invitations i where i.token_hash = p_token_hash;
  if target_round is null then
    raise exception using errcode = 'P0002', message = 'Invitation unavailable';
  end if;

  perform 1 from app.prediction_rounds where id = target_round for update;
  -- Recheck after acquiring the lock: rollover/rotation may have committed
  -- while this request was waiting.
  perform 1 from private.invitations i
  join app.prediction_rounds r on r.id = i.round_id
  where i.token_hash = p_token_hash and i.round_id = target_round
    and i.revoked_at is null and i.expires_at > clock_timestamp() and r.status = 'active'
    and not exists (select 1 from app.prediction_rounds s where s.predecessor_round_id = r.id)
  for update of i;
  if not found then
    raise exception using errcode = 'P0002', message = 'Invitation unavailable';
  end if;

  select id into existing_id from app.round_memberships
  where round_id = target_round and user_id = actor and status = 'active';
  if existing_id is not null then
    update app.profiles set last_active_round_id = target_round where user_id = actor;
    return existing_id;
  end if;
  insert into private.mutation_idempotency(user_id, scope, idempotency_key, result_id)
  values(actor, 'join_round', p_idempotency_key, membership_id)
  on conflict do nothing returning result_id into claimed;
  if claimed is null then
    select result_id into claimed from private.mutation_idempotency
    where user_id = actor and scope = 'join_round' and idempotency_key = p_idempotency_key;
    return claimed;
  end if;
  insert into app.round_memberships(id, round_id, user_id, role, nickname)
  values(membership_id, target_round, actor, 'member', btrim(p_nickname));
  update app.profiles set last_active_round_id = target_round where user_id = actor;
  return membership_id;
end
$function$;

create or replace function api.rotate_round_invitation(p_round_id uuid, p_token_hash bytea)
returns table(invitation_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $function$
declare
  actor uuid;
  actor_membership uuid;
  new_id uuid := gen_random_uuid();
  expiry timestamptz := clock_timestamp() + interval '7 days';
begin
  actor := private.require_round_user();
  perform 1 from app.prediction_rounds where id = p_round_id for update;
  select id into actor_membership from app.round_memberships
  where round_id = p_round_id and user_id = actor and role = 'owner' and status = 'active';
  if actor_membership is null then
    raise exception using errcode = '42501', message = 'Round owner required';
  end if;
  if exists (select 1 from app.prediction_rounds where predecessor_round_id = p_round_id) then
    raise exception using errcode = '23514', message = 'Invitations are unavailable after a season rollover';
  end if;
  perform private.enforce_rate_limit(actor, 'invitation:' || p_round_id::text, 5, interval '5 minutes');
  if octet_length(p_token_hash) <> 32 then
    raise exception using errcode = '22023', message = 'SHA-256 token hash required';
  end if;
  update private.invitations set revoked_at = clock_timestamp()
  where round_id = p_round_id and revoked_at is null;
  insert into private.invitations(id, round_id, token_hash, created_by_membership_id, expires_at)
  values(new_id, p_round_id, p_token_hash, actor_membership, expiry);
  return query select new_id, expiry;
end
$function$;

-- The existence flag remains true if the actor has lost access to the successor.
-- Expose no successor identity or information about rounds the actor cannot read.
create function private.round_has_successor(p_round_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select private.is_round_member(p_round_id) and exists (
    select 1 from app.prediction_rounds where predecessor_round_id = p_round_id
  )
$function$;
revoke all on function private.round_has_successor(uuid) from public, anon;
grant execute on function private.round_has_successor(uuid) to authenticated, service_role;

create or replace view api.my_rounds with (security_invoker = true) as
select r.id, r.name, r.status, r.version, r.league_season_id, m.id as membership_id, m.role, m.nickname,
  l.name as league_name, s.label as season_label, r.created_at,
  predecessor.id as predecessor_round_id, successor.id as successor_round_id,
  private.round_has_successor(r.id) as has_successor
from app.prediction_rounds r
join app.round_memberships m on m.round_id = r.id
  and m.user_id = (select auth.uid()) and m.status = 'active'
join app.league_seasons ls on ls.id = r.league_season_id
join app.leagues l on l.id = ls.league_id
join app.seasons s on s.id = ls.season_id
left join app.prediction_rounds predecessor on predecessor.id = r.predecessor_round_id
left join app.prediction_rounds successor on successor.predecessor_round_id = r.id;

create or replace view api.round_rollover_options with (security_invoker = true) as
select source.id as source_round_id, target.id as league_season_id,
  league.name as league_name, league.short_name as league_short_name,
  target_season.label as season_label, target_season.starts_on, target_season.ends_on
from app.prediction_rounds source
join app.round_memberships owner_membership on owner_membership.round_id = source.id
  and owner_membership.user_id = (select auth.uid())
  and owner_membership.role = 'owner' and owner_membership.status = 'active'
join app.league_seasons source_league_season on source_league_season.id = source.league_season_id
join app.seasons source_season on source_season.id = source_league_season.season_id
join app.league_seasons target on target.status = 'published'
join app.seasons target_season on target_season.id = target.season_id
  and target_season.starts_on > source_season.ends_on
join app.leagues league on league.id = target.league_id
where source_league_season.status in ('completed', 'archived')
  and not private.round_has_successor(source.id);

notify pgrst, 'reload schema';
