-- Lets the client do a plain name match between a festival lineup artist
-- (SETS only ever has artist name strings, never a Spotify id) and
-- someone's own top-20 Spotify artists, without needing to resolve every
-- lineup artist to a Spotify id via a search call. Same order/index as
-- top_artist_ids.
alter table spotify_taste add column if not exists top_artist_names jsonb not null default '[]'::jsonb;
