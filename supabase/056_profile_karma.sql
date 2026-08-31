-- Real Community karma, replacing App.jsx's mock USER_KARMA object.
-- Matches the existing "each post/comment starts at a base score of 1"
-- convention useCommunity.js already uses for individual scores (the
-- author's implicit self-upvote) -- karma is that same idea summed
-- across everything a profile has ever posted or commented, across
-- every festival: +1 per post authored, +1 per comment authored, plus
-- every real vote.value their content has received.
--
-- security_invoker makes the view query with the calling user's own
-- RLS rather than the view owner's -- moot here in practice, since
-- community_posts/comments/votes are all already readable by any
-- signed-in user, but it's the correct default per Supabase's own
-- guidance rather than leaving it to fall back on definer semantics.
create or replace view public.profile_karma
with (security_invoker = true)
as
select profile_id, sum(karma)::int as karma
from (
  select author_id as profile_id, 1 as karma from community_posts
  union all
  select author_id as profile_id, 1 as karma from community_comments
  union all
  select cp.author_id as profile_id, cv.value as karma
  from community_votes cv join community_posts cp on cp.id = cv.post_id
  union all
  select cc.author_id as profile_id, cv.value as karma
  from community_votes cv join community_comments cc on cc.id = cv.comment_id
) all_karma
group by profile_id;

-- New views don't inherit 002_grants.sql's blanket
-- "all tables in schema public" grant (it only applied to what existed
-- at the time), so this needs its own -- authenticated only, matching
-- the underlying tables' "any signed-in user" read policies (no anon
-- grant, since anon can't read the underlying data either).
grant select on public.profile_karma to authenticated;
