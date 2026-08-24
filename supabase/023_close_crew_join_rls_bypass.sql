-- RLS audit finding: 022's rate-limited join_crew_by_code() RPC can be
-- bypassed entirely by calling the REST API directly, because two older
-- policies still allow the same access with zero rate limiting:
--
-- 1. crews SELECT policy "any signed-in user can look up a crew to join"
--    (auth.uid() is not null) lets any signed-in user select every crew's
--    row directly -- including its `code` column -- with no limit. That's
--    an unlimited oracle for brute-forcing/enumerating codes, dating from
--    before join_crew_by_code() existed and did this lookup server-side.
--
-- 2. crew_members INSERT policy "users can join a crew (insert their own
--    membership)" only checks profile_id = auth.uid() -- it never verified
--    knowledge of a code at all. Any signed-in user can insert themselves
--    into any crew_id they can see, with no rate limit.
--
-- Together, these mean a script can still hammer crew_members inserts
-- across incrementing/known crew_ids (or list every crew's code via #1)
-- without ever touching the RPC or its 10-per-5-minutes limit.
--
-- join_crew_by_code() runs as the migration owner, which already bypasses
-- RLS on both tables (same reason crew_join_attempts works with zero
-- policies) -- so tightening these does not affect that RPC.

drop policy if exists "any signed-in user can look up a crew to join" on crews;

drop policy if exists "users can join a crew (insert their own membership)" on crew_members;

-- createCrew() still needs to insert the creator's own membership row
-- directly (useCrews.js) right after creating the crew -- allow that one
-- case (you're inserting yourself into a crew you created), and nothing
-- else, so joining anyone else's crew has no path except join_crew_by_code().
create policy "crew creator can add themselves as the first member"
  on crew_members for insert
  with check (
    profile_id = auth.uid()
    and exists (select 1 from crews where id = crew_id and created_by = auth.uid())
  );
