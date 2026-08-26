-- Auditing "check the other festivals for the same issue" (the Lost Lands
-- fabricated-schedule problem) turned up the same pattern in three more
-- upcoming festivals -- confirmed via fresh research that none of them
-- have published real per-artist set times yet:
--
-- - All Things Go: stage_id was literally the string 'stage-tba' (a
--   placeholder that gave away it was never real), and every day's
--   start_min ran the identical 180/231/283/334/386-minute sequence --
--   an obviously synthetic uniform spacing, not sourced times.
-- - Nocturnal Wonderland: the exact same 180/231/283/...-minute uniform
--   sequence repeated for both days -- same synthetic pattern.
-- - EDC Orlando: only 4 headliners with suspiciously round times
--   (all multiples of 30 min); official coverage confirms day-by-day
--   headliner assignment but explicitly says exact set times aren't
--   published yet.
--
-- Nulling stage_id/start_min/end_min for all three -- day_id (which is
-- independently verified against real day-by-day lineup announcements)
-- is left untouched. The app's `hasTimeData` check (src/App.jsx) now
-- renders these as the same "pick who you want to see" checklist as
-- Lost Lands instead of a grid built on invented times.
update festival_sets set stage_id = null, start_min = null, end_min = null where festival_id = 'all-things-go';
update festival_sets set stage_id = null, start_min = null, end_min = null where festival_id = 'nocturnal-wonderland';
update festival_sets set stage_id = null, start_min = null, end_min = null where festival_id = 'edc-orlando';

-- All Things Go DC 2026's real day-by-day lineup (BrooklynVegan) has 32
-- more confirmed real artists than the 15 already on file -- added as the
-- same day-only, no-fabricated-time entries.
insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(1800, 'all-things-go', 'fri', 'Robby Hoffman', null, null, null, null, null, null, '{}'),
(1801, 'all-things-go', 'fri', 'Balu Brigada', null, null, null, null, null, null, '{}'),
(1802, 'all-things-go', 'fri', 'Ninajirachi', null, null, null, null, null, null, '{}'),
(1803, 'all-things-go', 'fri', 'Rico Nasty', null, null, null, null, null, null, '{}'),
(1804, 'all-things-go', 'fri', 'SYML', null, null, null, null, null, null, '{}'),
(1805, 'all-things-go', 'fri', 'Wes Parker', null, null, null, null, null, null, '{}'),
(1806, 'all-things-go', 'sat', 'She & Him', null, null, null, null, null, null, '{}'),
(1807, 'all-things-go', 'sat', 'The Beaches', null, null, null, null, null, null, '{}'),
(1808, 'all-things-go', 'sat', 'The Beths', null, null, null, null, null, null, '{}'),
(1809, 'all-things-go', 'sat', 'Rebecca Black', null, null, null, null, null, null, '{}'),
(1810, 'all-things-go', 'sat', 'Naika', null, null, null, null, null, null, '{}'),
(1811, 'all-things-go', 'sat', 'Hemlocke Springs', null, null, null, null, null, null, '{}'),
(1812, 'all-things-go', 'sat', 'Haute & Freddy', null, null, null, null, null, null, '{}'),
(1813, 'all-things-go', 'sat', 'Grace Ives', null, null, null, null, null, null, '{}'),
(1814, 'all-things-go', 'sat', 'Zolita', null, null, null, null, null, null, '{}'),
(1815, 'all-things-go', 'sat', 'Love Spells', null, null, null, null, null, null, '{}'),
(1816, 'all-things-go', 'sat', 'Susannah Joffe', null, null, null, null, null, null, '{}'),
(1817, 'all-things-go', 'sat', 'Glom', null, null, null, null, null, null, '{}'),
(1818, 'all-things-go', 'sat', 'Kevin Atwater', null, null, null, null, null, null, '{}'),
(1819, 'all-things-go', 'sun', 'Flipturn', null, null, null, null, null, null, '{}'),
(1820, 'all-things-go', 'sun', 'Wolf Alice', null, null, null, null, null, null, '{}'),
(1821, 'all-things-go', 'sun', 'CMAT', null, null, null, null, null, null, '{}'),
(1822, 'all-things-go', 'sun', 'Jensen McRae', null, null, null, null, null, null, '{}'),
(1823, 'all-things-go', 'sun', 'Ryan Beatty', null, null, null, null, null, null, '{}'),
(1824, 'all-things-go', 'sun', 'Stella Lefty', null, null, null, null, null, null, '{}'),
(1825, 'all-things-go', 'sun', 'Rochelle Jordan', null, null, null, null, null, null, '{}'),
(1826, 'all-things-go', 'sun', 'Tiny Habits', null, null, null, null, null, null, '{}'),
(1827, 'all-things-go', 'sun', 'Trousdale', null, null, null, null, null, null, '{}'),
(1828, 'all-things-go', 'sun', 'Violet Grohl', null, null, null, null, null, null, '{}'),
(1829, 'all-things-go', 'sun', 'Natalie Jinju', null, null, null, null, null, null, '{}'),
(1830, 'all-things-go', 'sun', 'googly eyes', null, null, null, null, null, null, '{}'),
(1831, 'all-things-go', 'sun', 'Jake Minch', null, null, null, null, null, null, '{}');

-- Secret Dreams (25 rows) was NOT touched here -- its times use varied,
-- non-uniform gaps (unlike ATG/Nocturnal Wonderland's giveaway uniform
-- pattern) and a same-titled "Set Times & Schedule" article exists for it
-- (thedailyfrequency.com, blocked by a 403 when fetched), so there's a
-- real chance actual times exist behind that block rather than this being
-- fabricated. Left as-is pending a clearer read on that source rather
-- than guessing either way.
