-- The 7 existing lost-lands rows (ids 209-215) were both tiny (Friday only,
-- out of Lost Lands' real 5-day Wed-Sun lineup) and wrong: 5 of the 7 --
-- Subtronics, Ganja White Night, Seven Lions, Crankdat b2b Alleycvt, Flux
-- Pavilion -- are actually Saturday or Sunday per the festival's own 2026
-- daily-lineup poster (lostlandsfestival.com/lineup), not Friday. On top of
-- that, Lost Lands (like Camp Flog Gnaw -- see the note by
-- FESTIVAL_LINEUP_IMAGES["camp-flog-gnaw"] in App.jsx) only publishes a
-- day-level artist lineup, never per-artist stage/set times, so there's no
-- real source to responsibly rebuild an accurate schedule grid from.
--
-- Removing the wrong rows outright rather than leaving stale/incorrect data
-- in place. The real, complete 5-day poster is already shown as-is via
-- FESTIVAL_LINEUP_IMAGES["lost-lands"] (public/festival-lineups/lost-lands.jpg)
-- -- that stays the accurate source for browsing the full lineup. "My
-- Schedule" / "% Match" will be empty for this festival until Lost Lands
-- publishes real per-artist times.

delete from festival_sets where festival_id = 'lost-lands';
