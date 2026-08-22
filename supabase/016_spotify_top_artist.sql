-- Fallback for when Spotify's top-artists response has no genre tags
-- (happening under the tightened Development Mode access) -- lets the
-- profile sheet show "Top artist: X" instead of just "Connected".
alter table spotify_connections add column if not exists top_artist text;
