-- Community backend: real posts + nested comment threads + votes,
-- replacing the local-only mock FESTIVAL_POSTS/FLAIRS data in App.jsx
-- (confirmed with the user: "Full real backend + nested threads").
--
-- Karma/tier badges (TIERS/getTier/USER_KARMA in App.jsx) stay a
-- cosmetic mock layer for now -- out of scope here, which is the
-- thread structure itself (posts, arbitrarily-deep replies, voting).

-- ---------------------------------------------------------------------------
-- community_posts — one per festival board post
-- ---------------------------------------------------------------------------
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null,
  author_id uuid not null references profiles(id) on delete cascade,
  flair text not null,
  title text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- community_comments — self-referencing parent_id gives arbitrarily deep
-- nested replies (a reply to a reply to a reply, etc.), not just one flat
-- level under each post.
-- ---------------------------------------------------------------------------
create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  parent_id uuid references community_comments(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- community_votes — one vote per user per post OR comment (never both on
-- the same row). Rows are updated/deleted (not just inserted) so a user
-- can change their mind or retract a vote, rather than accumulating one
-- row per click.
-- ---------------------------------------------------------------------------
create table if not exists community_votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  comment_id uuid references community_comments(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  constraint community_votes_one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

create unique index if not exists community_votes_voter_post_uidx
  on community_votes (voter_id, post_id) where post_id is not null;
create unique index if not exists community_votes_voter_comment_uidx
  on community_votes (voter_id, comment_id) where comment_id is not null;

create index if not exists community_posts_festival_idx on community_posts (festival_id);
create index if not exists community_comments_post_idx on community_comments (post_id);
create index if not exists community_comments_parent_idx on community_comments (parent_id);
create index if not exists community_votes_post_idx on community_votes (post_id);
create index if not exists community_votes_comment_idx on community_votes (comment_id);

alter table community_posts enable row level security;
alter table community_comments enable row level security;
alter table community_votes enable row level security;

create policy "posts are readable by any signed-in user"
  on community_posts for select
  using (auth.uid() is not null);

create policy "users can create their own posts"
  on community_posts for insert
  with check (author_id = auth.uid());

create policy "users can delete their own posts"
  on community_posts for delete
  using (author_id = auth.uid());

create policy "comments are readable by any signed-in user"
  on community_comments for select
  using (auth.uid() is not null);

create policy "users can create their own comments"
  on community_comments for insert
  with check (author_id = auth.uid());

create policy "users can delete their own comments"
  on community_comments for delete
  using (author_id = auth.uid());

create policy "votes are readable by any signed-in user"
  on community_votes for select
  using (auth.uid() is not null);

create policy "users can cast their own votes"
  on community_votes for insert
  with check (voter_id = auth.uid());

create policy "users can change their own votes"
  on community_votes for update
  using (voter_id = auth.uid());

create policy "users can retract their own votes"
  on community_votes for delete
  using (voter_id = auth.uid());
