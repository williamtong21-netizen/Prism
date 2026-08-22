-- Splits the shareable half of a Spotify connection (top genre/artist and
-- the top-20 artist id list used for match %) out of spotify_connections,
-- which stays private (it holds the actual OAuth tokens). This table is
-- what crew-mates are allowed to read from each other -- never tokens.
create table if not exists spotify_taste (
  profile_id uuid primary key references profiles(id) on delete cascade,
  top_genre text,
  top_artist text,
  top_artist_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table spotify_taste enable row level security;

-- Same shape as shares_crew_with (011) but not festival-scoped -- a music
-- match between two people is about the crew relationship, not which
-- festival they happen to share a crew for.
create or replace function public.shares_any_crew_with(other_profile_id uuid)
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
    where mine.profile_id = auth.uid()
      and theirs.profile_id = other_profile_id
  );
$$;

drop policy if exists "you can read your own spotify taste" on spotify_taste;
create policy "you can read your own spotify taste"
  on spotify_taste for select
  using (profile_id = auth.uid());

drop policy if exists "crew mates can read your spotify taste" on spotify_taste;
create policy "crew mates can read your spotify taste"
  on spotify_taste for select
  using (shares_any_crew_with(profile_id));

drop policy if exists "you can delete your own spotify taste" on spotify_taste;
create policy "you can delete your own spotify taste"
  on spotify_taste for delete
  using (profile_id = auth.uid());
