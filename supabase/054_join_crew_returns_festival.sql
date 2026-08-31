-- join_crew_by_code() only ever returned {id, name} -- enough for the
-- in-app "Join with a code" sheet, which is opened from inside whatever
-- festival the user already happened to be viewing. A shared invite link
-- (new Share button on the Crew tab) can land someone on any festival's
-- crew from cold, though, and the app has no other way to know which
-- festival that crew belongs to in order to switch them there. Adding
-- festival_id to the return is a pure addition to the existing payload --
-- no schema change, no effect on any caller that ignores the new field.

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

  if recent_attempts >= 10 then
    return json_build_object('error', 'Too many join attempts — wait a few minutes and try again.');
  end if;

  insert into crew_join_attempts (profile_id) values (auth.uid());

  select id, name, festival_id into target_crew from crews where code = join_code;

  if target_crew.id is null then
    return json_build_object('error', 'No crew found with that code.');
  end if;

  insert into crew_members (crew_id, profile_id)
  values (target_crew.id, auth.uid())
  on conflict do nothing;

  return json_build_object('id', target_crew.id, 'name', target_crew.name, 'festival_id', target_crew.festival_id);
end;
$$;
