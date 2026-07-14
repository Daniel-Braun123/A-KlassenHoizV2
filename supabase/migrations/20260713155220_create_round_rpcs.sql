create function private.require_round_user() returns uuid language plpgsql stable security definer set search_path='' as $function$
declare user_id uuid := auth.uid();
begin
  if user_id is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if not private.is_active_user() or private.is_app_admin() then raise exception using errcode='42501',message='Active round user required'; end if;
  return user_id;
end $function$;
revoke all on function private.require_round_user() from public,anon,authenticated;

create function api.create_round(p_name text,p_league_season_id uuid,p_nickname text,p_idempotency_key uuid) returns uuid
language plpgsql security definer set search_path='' as $function$
declare actor uuid; round_id uuid:=gen_random_uuid(); membership_id uuid:=gen_random_uuid(); claimed uuid;
begin
  actor:=private.require_round_user();
  if not exists(select 1 from app.league_seasons where id=p_league_season_id and status='published') then raise exception using errcode='22023',message='Published league season required'; end if;
  insert into private.mutation_idempotency(user_id,scope,idempotency_key,result_id) values(actor,'create_round',p_idempotency_key,round_id)
  on conflict do nothing returning result_id into claimed;
  if claimed is null then select result_id into claimed from private.mutation_idempotency where user_id=actor and scope='create_round' and idempotency_key=p_idempotency_key; return claimed; end if;
  insert into app.prediction_rounds(id,name,league_season_id,owner_membership_id) values(round_id,btrim(p_name),p_league_season_id,membership_id);
  insert into app.round_memberships(id,round_id,user_id,role,nickname) values(membership_id,round_id,actor,'owner',btrim(p_nickname));
  update app.profiles set last_active_round_id=round_id where user_id=actor;
  return round_id;
end $function$;

create function api.update_round(p_round_id uuid,p_expected_version integer,p_name text,p_league_season_id uuid) returns integer
language plpgsql security definer set search_path='' as $function$
declare new_version integer;
begin
  perform private.require_round_user();
  if not private.is_round_owner(p_round_id) then raise exception using errcode='42501',message='Round owner required'; end if;
  if not exists(select 1 from app.league_seasons where id=p_league_season_id and status='published') then raise exception using errcode='22023',message='Published league season required'; end if;
  update app.prediction_rounds set name=btrim(p_name), league_season_id=case when has_predictions then league_season_id else p_league_season_id end, version=version+1
  where id=p_round_id and version=p_expected_version and (not has_predictions or league_season_id=p_league_season_id) returning version into new_version;
  if new_version is null then raise exception using errcode='P0001',message='Version conflict or league season locked'; end if;
  return new_version;
end $function$;

revoke all on function api.create_round(text,uuid,text,uuid),api.update_round(uuid,integer,text,uuid) from public,anon;
grant execute on function api.create_round(text,uuid,text,uuid),api.update_round(uuid,integer,text,uuid) to authenticated,service_role;
