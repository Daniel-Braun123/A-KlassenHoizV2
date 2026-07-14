alter table app.prediction_rounds add constraint prediction_rounds_owner_membership_fk
foreign key(owner_membership_id) references app.round_memberships(id) deferrable initially deferred;

alter table app.profiles add constraint profiles_last_active_round_fk
foreign key(last_active_round_id) references app.prediction_rounds(id) on delete set null deferrable initially deferred;

create unique index round_memberships_one_active_owner_idx on app.round_memberships(round_id) where role = 'owner' and status = 'active';
create unique index round_memberships_active_user_idx on app.round_memberships(round_id,user_id) where status = 'active' and user_id is not null;
create unique index round_memberships_active_nickname_idx on app.round_memberships(round_id,lower(nickname)) where status = 'active';

create function private.validate_round_owner(p_round_id uuid)
returns void language plpgsql security definer set search_path = '' as $function$
declare owner_id uuid;
begin
  select owner_membership_id into owner_id from app.prediction_rounds where id = p_round_id;
  if not found then return; end if;
  if not exists(select 1 from app.round_memberships m where m.id = owner_id and m.round_id = p_round_id and m.role = 'owner' and m.status = 'active') then
    raise exception using errcode = '23514', message = 'Round must reference its one active owner membership';
  end if;
end $function$;

create function private.round_owner_from_round_trigger()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  perform private.validate_round_owner(coalesce(new.id, old.id));
  return coalesce(new, old);
end $function$;

create function private.round_owner_from_membership_trigger()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  perform private.validate_round_owner(coalesce(new.round_id, old.round_id));
  return coalesce(new, old);
end $function$;

create constraint trigger prediction_rounds_owner_invariant after insert or update of owner_membership_id on app.prediction_rounds
deferrable initially deferred for each row execute function private.round_owner_from_round_trigger();
create constraint trigger round_memberships_owner_invariant after insert or update of role,status,round_id or delete on app.round_memberships
deferrable initially deferred for each row execute function private.round_owner_from_membership_trigger();
revoke all on function private.validate_round_owner(uuid), private.round_owner_from_round_trigger(), private.round_owner_from_membership_trigger() from public, anon, authenticated;
