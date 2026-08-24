-- Crew join-code abuse (Launch Readiness > Trust & Safety, Recommended):
-- joinCrew() previously did a plain client-side select-by-code then insert,
-- with no limit on how many codes a given user could try. Codes are 6 chars
-- from a 32-symbol alphabet (~1B combinations) so brute-forcing one by hand
-- is impractical, but nothing stopped a script from hammering the REST API
-- directly. Moves the whole join into one SECURITY DEFINER RPC that also
-- rate-limits attempts.

-- Attempts, not just successes -- a scripted guesser mostly generates
-- misses, so counting only successful joins wouldn't rate-limit anything.
create table if not exists crew_join_attempts (
  profile_id uuid not null references profiles(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists crew_join_attempts_profile_time_idx
  on crew_join_attempts (profile_id, attempted_at);

alter table crew_join_attempts enable row level security;
-- Deliberately zero policies: this table is only ever touched from inside
-- join_crew_by_code() below (SECURITY DEFINER bypasses RLS for it), so
-- default-deny is exactly right -- no client should read or write it
-- directly.

create or replace function public.join_crew_by_code(join_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_attempts integer;
  target_crew record;
begin
  select count(*) into recent_attempts
  from crew_join_attempts
  where profile_id = auth.uid() and attempted_at > now() - interval '5 minutes';

  -- 10 attempts / 5 minutes is generous for someone hand-typing a code
  -- (including retries for typos) and useless for a brute-force script.
  if recent_attempts >= 10 then
    return json_build_object('error', 'Too many join attempts — wait a few minutes and try again.');
  end if;

  insert into crew_join_attempts (profile_id) values (auth.uid());

  -- join_code arrives already normalized to "XXX-XXX" by the client
  -- (useCrews.js's normalizeCode) -- an exact match is enough here.
  select id, name into target_crew from crews where code = join_code;

  if target_crew.id is null then
    return json_build_object('error', 'No crew found with that code.');
  end if;

  insert into crew_members (crew_id, profile_id)
  values (target_crew.id, auth.uid())
  on conflict do nothing;

  return json_build_object('id', target_crew.id, 'name', target_crew.name);
end;
$$;

grant execute on function public.join_crew_by_code(text) to authenticated;
