-- Report a Community post or comment -- same shape as user_reports
-- (019_block_report_users.sql), just aimed at content instead of a
-- person. No moderation admin UI exists yet either, same as that one --
-- this is the record to build one against, not wired to any automated
-- action (App Store review requires the report path to exist and work,
-- not a full moderation pipeline behind it).

create table if not exists community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  comment_id uuid references community_comments(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  constraint community_reports_one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

create index if not exists community_reports_post_idx on community_reports (post_id);
create index if not exists community_reports_comment_idx on community_reports (comment_id);

alter table community_reports enable row level security;

create policy "you can file a content report"
  on community_reports for insert
  with check (reporter_id = auth.uid());

create policy "you can see your own content reports"
  on community_reports for select
  using (reporter_id = auth.uid());
