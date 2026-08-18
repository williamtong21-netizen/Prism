-- Joining a crew by code requires looking up a crew you're not a member of
-- yet — the original "crew members can read their crews" policy only
-- covers crews you're already in, which makes joining impossible (you can't
-- see the crew to join it). Adding a second, broader SELECT policy; Postgres
-- ORs multiple permissive policies together, so this doesn't remove the
-- original, it just also allows any signed-in user to look up any crew by
-- code (crew name/code isn't sensitive — it's meant to be shared as an
-- invite).
create policy "any signed-in user can look up a crew to join"
  on crews for select
  using (auth.uid() is not null);

-- schema.sql never added an UPDATE policy for crews, so toggling
-- "persists after this festival" would silently fail with permission
-- denied. Any current member can update their own crew's settings.
create policy "crew members can update their crew"
  on crews for update
  using (id in (select crew_id from crew_members where profile_id = auth.uid()));
