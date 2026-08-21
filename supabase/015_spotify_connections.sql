-- Stores each profile's Spotify tokens once they connect, plus a computed
-- top genre pulled from their top artists. Tokens are only ever written by
-- the spotify-callback edge function (via the service role key, which
-- bypasses RLS) -- the client can read and disconnect its own row, but
-- never writes tokens directly.
create table if not exists spotify_connections (
  profile_id uuid primary key references profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  top_genre text,
  connected_at timestamptz not null default now()
);

alter table spotify_connections enable row level security;

drop policy if exists "you can read your own spotify connection" on spotify_connections;
create policy "you can read your own spotify connection"
  on spotify_connections for select
  using (profile_id = auth.uid());

drop policy if exists "you can disconnect your own spotify connection" on spotify_connections;
create policy "you can disconnect your own spotify connection"
  on spotify_connections for delete
  using (profile_id = auth.uid());
