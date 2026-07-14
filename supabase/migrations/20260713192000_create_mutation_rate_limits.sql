create table private.mutation_rate_limits (
  actor_id uuid not null,
  scope text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (actor_id, scope, window_started_at)
);

revoke all on private.mutation_rate_limits from public, anon, authenticated;
grant all on private.mutation_rate_limits to service_role;

create function private.enforce_rate_limit(
  p_actor_id uuid,
  p_scope text,
  p_limit integer,
  p_window interval
) returns void
language plpgsql security definer set search_path = '' as $function$
declare
  window_start timestamptz;
  new_count integer;
begin
  if p_actor_id is null or p_limit < 1 or p_window <= interval '0 seconds' then
    raise exception using errcode = '22023', message = 'Invalid rate limit configuration';
  end if;

  window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / extract(epoch from p_window))
    * extract(epoch from p_window)
  );

  insert into private.mutation_rate_limits(actor_id, scope, window_started_at, request_count)
  values (p_actor_id, p_scope, window_start, 1)
  on conflict (actor_id, scope, window_started_at)
  do update set request_count = private.mutation_rate_limits.request_count + 1
  returning request_count into new_count;

  if new_count > p_limit then
    raise exception using errcode = 'P0003', message = 'Rate limit exceeded';
  end if;
end $function$;

revoke all on function private.enforce_rate_limit(uuid,text,integer,interval) from public, anon, authenticated;
grant execute on function private.enforce_rate_limit(uuid,text,integer,interval) to service_role;

