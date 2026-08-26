-- Bug found while creating a test crew: createCrew() in useCrews.js does
-- `.insert({...}).select().single()`, and that .select() (Postgres
-- INSERT...RETURNING under the hood) has been failing for every user with
-- "new row violates row-level security policy for table crews" ever since
-- 023_close_crew_join_rls_bypass.sql dropped the old "any signed-in user
-- can look up a crew to join" SELECT policy.
--
-- That drop was correct -- that policy was an unlimited oracle for
-- brute-forcing crew join codes -- but it was also the only SELECT policy
-- broad enough to cover "can the creator see the crew they just made,"
-- since the creator isn't in crew_members yet at the exact instant of the
-- crews insert (that row is added a moment later, as a separate query).
-- Postgres enforces SELECT policies on the RETURNING clause of an INSERT,
-- so with no policy covering this instant, the whole insert failed and
-- rolled back -- crew creation has been completely broken since 023.
--
-- Narrow fix: let a user see a crew they created themselves, independent
-- of crew_members membership. This does not reopen the brute-force gap --
-- created_by = auth.uid() only ever matches crews you made, never lets you
-- look up an arbitrary crew by guessing its code.
create policy "crew creator can see their own crew"
  on crews for select
  using (created_by = auth.uid());

-- Diagnostic-only function added while investigating this bug (see the
-- app's own debugging session) -- never referenced by client code, safe to
-- drop now that the real fix above is in place.
drop function if exists public.debug_whoami();
