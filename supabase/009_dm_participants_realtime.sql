-- A brand-new incoming DM thread never showed up for the recipient until
-- they reloaded the app. dm_messages is realtime-enabled, but that only
-- helps once the client already knows about the thread — the very first
-- message in a new thread arrives on a thread the client has never seen,
-- so the existing dm_messages subscription intentionally ignores it
-- (see the comment in useDMs.js) and waits for a refresh() that never came.
--
-- Fix: make dm_participants realtime too, so the client can hear "you were
-- just added to a thread" and fetch it immediately.
alter publication supabase_realtime add table dm_participants;
