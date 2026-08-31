-- Backs "alert everyone in your crew when someone drops a new camp pin"
-- (send-camp-pin-push edge function + a Database Webhook on camp_pins
-- INSERT, see supabase/README.md). Two pieces:
--
-- 1. A fix to shares_crew_with() (011_camp_pins.sql): it only matched
--    `c.festival_id = check_festival_id`, so a *persistent* crew (valid at
--    every festival, not just the one it was created at) silently didn't
--    count outside its origin festival -- meaning persistent crewmates
--    couldn't see each other's camp pins, or schedule picks, anywhere but
--    that one festival. That's the same bug the new alert feature would
--    otherwise inherit, so it's worth fixing here rather than copying it
--    into a second function.
-- 2. crewmates_for_festival(): same join shares_crew_with() already does,
--    but parameterized on an explicit profile id instead of auth.uid() --
--    the edge function runs with the service-role key, under no user JWT,
--    so auth.uid() would just be null there.

create or replace function public.shares_crew_with(other_profile_id uuid, check_festival_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from crew_members mine
    join crew_members theirs on theirs.crew_id = mine.crew_id
    join crews c on c.id = mine.crew_id
    where mine.profile_id = auth.uid()
      and theirs.profile_id = other_profile_id
      and (c.festival_id = check_festival_id or c.persistent)
  );
$$;

create or replace function public.crewmates_for_festival(p_profile_id uuid, p_festival_id text)
returns table(profile_id uuid)
language sql
security definer
stable
set search_path = public
as $$
  select distinct theirs.profile_id
  from crew_members mine
  join crew_members theirs on theirs.crew_id = mine.crew_id
  join crews c on c.id = mine.crew_id
  where mine.profile_id = p_profile_id
    and theirs.profile_id != p_profile_id
    and (c.festival_id = p_festival_id or c.persistent);
$$;
