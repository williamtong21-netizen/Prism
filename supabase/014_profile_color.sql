-- Lets someone pick their own avatar color instead of always getting
-- whatever colorForId()'s hash happens to land on. Nullable — existing
-- profiles fall back to the hash-based color until they set one.
alter table profiles add column if not exists color text;
