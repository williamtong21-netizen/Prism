-- Secret Dreams' existing 25 rows had real errors, found while checking
-- whether it had the same fabricated-time problem as Lost Lands/All Things
-- Go/Nocturnal Wonderland/EDC Orlando. It turned out the opposite: real,
-- specific set times DO exist -- they're just published as per-day image
-- graphics on thedailyfrequency.com's "Secret Dreams 2026 Set Times &
-- Schedule" article, not text, so they were missed/guessed at before.
--
-- Read all 4 day-graphics directly (Thu/Fri/Sat/Sun) and found the
-- existing data was wrong in multiple ways: wrong stage groupings (all 6
-- Thursday acts were alternated between "woods"/"pg" by hand; the real
-- graphic has 5 of them together on a third stage, "Lucid Stage", which
-- didn't even exist in FESTIVAL_STAGES), wrong order (Saturna was
-- actually first, not Yoko), and missing acts entirely (e.g. "Nocturnal
-- Emissions" wasn't in the data at all). Full rebuild below replaces all
-- 25 old rows with 99 real acts across all 4 days, transcribed set-by-set
-- from the actual graphics (ids re-verified at 2-3x zoom after catching
-- several low-resolution misreads, e.g. "Imzo"->"Inzo", "Isaac Miller"->
-- "Mac Miller", "Gogosteppa"->"Goopsteppa").
--
-- Companion code changes (src/App.jsx): added "Lucid Stage" to
-- FESTIVAL_STAGES (was missing), and corrected FESTIVAL_DAYS' startMin
-- for thu/fri/sun to match each day's real earliest set (all three were
-- off by an hour from a guess made before this real data existed).
delete from festival_sets where festival_id = 'secret-dreams';
insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(2000, 'secret-dreams', 'thu', 'Saturna', 'lucid', 0, 60, null, null, null, '{}'),
(2001, 'secret-dreams', 'thu', 'Yoko', 'lucid', 60, 120, null, null, null, '{}'),
(2002, 'secret-dreams', 'thu', 'Skysia', 'lucid', 120, 180, null, null, null, '{}'),
(2003, 'secret-dreams', 'thu', 'Mickman', 'lucid', 180, 240, null, null, null, '{}'),
(2004, 'secret-dreams', 'thu', 'CloZee', 'lucid', 250, 310, null, null, null, '{}'),
(2005, 'secret-dreams', 'thu', 'The Werks', 'woods', 315, 390, null, null, null, '{}'),
(2006, 'secret-dreams', 'thu', 'Nocturnal Emissions (In The Beginning)', 'pg', 315, 360, null, null, null, '{}'),
(2007, 'secret-dreams', 'fri', 'Smigonaut', 'lucid', 0, 60, null, null, null, '{}'),
(2008, 'secret-dreams', 'fri', 'Two Guys', 'lucid', 60, 120, null, null, null, '{}'),
(2009, 'secret-dreams', 'fri', 'Chef Boyarbeatz', 'lucid', 120, 200, null, null, null, '{}'),
(2010, 'secret-dreams', 'fri', 'Mickman (420 Set)', 'lucid', 200, 270, null, null, null, '{}'),
(2011, 'secret-dreams', 'fri', 'Crawdad Sniper', 'lucid', 270, 330, null, null, null, '{}'),
(2012, 'secret-dreams', 'fri', 'Cool Customer', 'lucid', 330, 390, null, null, null, '{}'),
(2013, 'secret-dreams', 'fri', 'Opiuo', 'lucid', 390, 450, null, null, null, '{}'),
(2014, 'secret-dreams', 'fri', 'Herbalistek', 'lucid', 450, 510, null, null, null, '{}'),
(2015, 'secret-dreams', 'fri', 'Mr. Bill', 'lucid', 510, 570, null, null, null, '{}'),
(2016, 'secret-dreams', 'fri', 'Detox Unit', 'lucid', 570, 630, null, null, null, '{}'),
(2017, 'secret-dreams', 'fri', 'Of The Trees', 'lucid', 630, 690, null, null, null, '{}'),
(2018, 'secret-dreams', 'fri', 'Entangled Mind', 'lucid', 720, 780, null, null, null, '{}'),
(2019, 'secret-dreams', 'fri', 'Foxtail', 'lucid', 780, 840, null, null, null, '{}'),
(2020, 'secret-dreams', 'fri', 'Malakai', 'lucid', 840, 900, null, null, null, '{}'),
(2021, 'secret-dreams', 'fri', 'Cloudchord', 'lucid', 900, 960, null, null, null, '{}'),
(2022, 'secret-dreams', 'fri', '5AM', 'lucid', 960, 1020, null, null, null, '{}'),
(2023, 'secret-dreams', 'fri', 'Emancipator (Sunrise)', 'lucid', 1020, 1080, null, null, null, '{}'),
(2024, 'secret-dreams', 'fri', 'Mcwavy', 'woods', 0, 60, null, null, null, '{}'),
(2025, 'secret-dreams', 'fri', 'Joslyn & The Sweet Compressions', 'woods', 90, 150, null, null, null, '{}'),
(2026, 'secret-dreams', 'fri', 'Hive Mind (ft. Allen Aucoin)', 'woods', 180, 240, null, null, null, '{}'),
(2027, 'secret-dreams', 'fri', 'High Step Society', 'woods', 270, 330, null, null, null, '{}'),
(2028, 'secret-dreams', 'fri', 'Polyrhythmics', 'woods', 360, 420, null, null, null, '{}'),
(2029, 'secret-dreams', 'fri', 'Dogs In A Pile', 'woods', 450, 510, null, null, null, '{}'),
(2030, 'secret-dreams', 'fri', 'Pigeons Playing Ping Pong', 'woods', 540, 615, null, null, null, '{}'),
(2031, 'secret-dreams', 'fri', 'Pigeons Playing Ping Pong (Late Night)', 'woods', 660, 795, null, null, null, '{}'),
(2032, 'secret-dreams', 'fri', 'Big Blitz', 'woods', 825, 900, null, null, null, '{}'),
(2033, 'secret-dreams', 'fri', 'Dewpoint', 'pg', 0, 60, null, null, null, '{}'),
(2034, 'secret-dreams', 'fri', 'Phurn', 'pg', 60, 120, null, null, null, '{}'),
(2035, 'secret-dreams', 'fri', 'Ferrofluid', 'pg', 120, 180, null, null, null, '{}'),
(2036, 'secret-dreams', 'fri', 'Ashez', 'pg', 180, 240, null, null, null, '{}'),
(2037, 'secret-dreams', 'fri', 'Saturna', 'pg', 240, 300, null, null, null, '{}'),
(2038, 'secret-dreams', 'fri', 'Daggz', 'pg', 300, 360, null, null, null, '{}'),
(2039, 'secret-dreams', 'fri', 'Chmura', 'pg', 360, 420, null, null, null, '{}'),
(2040, 'secret-dreams', 'fri', 'The Sponges', 'pg', 420, 480, null, null, null, '{}'),
(2041, 'secret-dreams', 'fri', 'Nocturnal Emissions (Daydream Delight)', 'pg', 705, 735, null, null, null, '{}'),
(2042, 'secret-dreams', 'fri', 'Sousastep', 'pg', 795, 870, null, null, null, '{}'),
(2043, 'secret-dreams', 'fri', 'J-Rose Loops', 'pg', 900, 990, null, null, null, '{}'),
(2044, 'secret-dreams', 'sat', 'Pheel.', 'lucid', 0, 60, null, null, null, '{}'),
(2045, 'secret-dreams', 'sat', 'Parkbreezy', 'lucid', 60, 120, null, null, null, '{}'),
(2046, 'secret-dreams', 'sat', 'Thought Process (Live Band)', 'lucid', 120, 200, null, null, null, '{}'),
(2047, 'secret-dreams', 'sat', 'Detox Unit', 'lucid', 200, 270, null, null, null, '{}'),
(2048, 'secret-dreams', 'sat', 'Inzo (Nexum Set)', 'lucid', 270, 330, null, null, null, '{}'),
(2049, 'secret-dreams', 'sat', 'Daily Bread', 'lucid', 330, 390, null, null, null, '{}'),
(2050, 'secret-dreams', 'sat', 'Pretty Lights (Two Sets)', 'lucid', 450, 630, null, null, null, '{}'),
(2051, 'secret-dreams', 'sat', 'Wonky Llama', 'lucid', 660, 720, null, null, null, '{}'),
(2052, 'secret-dreams', 'sat', 'Goopsteppa', 'lucid', 720, 780, null, null, null, '{}'),
(2053, 'secret-dreams', 'sat', 'Cualli', 'lucid', 780, 840, null, null, null, '{}'),
(2054, 'secret-dreams', 'sat', 'Lusine', 'lucid', 840, 900, null, null, null, '{}'),
(2055, 'secret-dreams', 'sat', 'Gunk - The Band', 'woods', 0, 60, null, null, null, '{}'),
(2056, 'secret-dreams', 'sat', 'Ghost Gardens Live', 'woods', 90, 150, null, null, null, '{}'),
(2057, 'secret-dreams', 'sat', 'Sneezy', 'woods', 180, 240, null, null, null, '{}'),
(2058, 'secret-dreams', 'sat', 'Come Back To Earth (Mac Miller Tribute Band)', 'woods', 270, 330, null, null, null, '{}'),
(2059, 'secret-dreams', 'sat', 'Earthgang', 'woods', 360, 435, null, null, null, '{}'),
(2060, 'secret-dreams', 'sat', 'Sunsquabi', 'woods', 690, 780, null, null, null, '{}'),
(2061, 'secret-dreams', 'sat', 'Dizgo', 'woods', 810, 900, null, null, null, '{}'),
(2062, 'secret-dreams', 'sat', 'Gunk', 'pg', 0, 60, null, null, null, '{}'),
(2063, 'secret-dreams', 'sat', 'Vinja', 'pg', 60, 120, null, null, null, '{}'),
(2064, 'secret-dreams', 'sat', 'Base2', 'pg', 120, 180, null, null, null, '{}'),
(2065, 'secret-dreams', 'sat', 'Blookah', 'pg', 180, 240, null, null, null, '{}'),
(2066, 'secret-dreams', 'sat', 'Pipe Leak', 'pg', 240, 300, null, null, null, '{}'),
(2067, 'secret-dreams', 'sat', 'Audio Goblin', 'pg', 300, 360, null, null, null, '{}'),
(2068, 'secret-dreams', 'sat', 'Inzo', 'pg', 390, 450, null, null, null, '{}'),
(2069, 'secret-dreams', 'sat', 'Steel Beans', 'pg', 735, 810, null, null, null, '{}'),
(2070, 'secret-dreams', 'sat', 'Nocturnal Emissions (Gavinski''s Fever Dream)', 'pg', 825, 870, null, null, null, '{}'),
(2071, 'secret-dreams', 'sun', 'Motifv', 'lucid', 60, 120, null, null, null, '{}'),
(2072, 'secret-dreams', 'sun', 'Flamingosis', 'lucid', 120, 180, null, null, null, '{}'),
(2073, 'secret-dreams', 'sun', 'Late Night Radio B2B Artifakts', 'lucid', 180, 260, null, null, null, '{}'),
(2074, 'secret-dreams', 'sun', 'Daily Bread', 'lucid', 260, 330, null, null, null, '{}'),
(2075, 'secret-dreams', 'sun', 'Gramatik', 'lucid', 330, 390, null, null, null, '{}'),
(2076, 'secret-dreams', 'sun', 'Tape B', 'lucid', 390, 480, null, null, null, '{}'),
(2077, 'secret-dreams', 'sun', 'Pretty Lights (Two Sets)', 'lucid', 540, 720, null, null, null, '{}'),
(2078, 'secret-dreams', 'sun', 'Cosmic Trigger: Lucid Night', 'lucid', 750, 810, null, null, null, '{}'),
(2079, 'secret-dreams', 'sun', 'Bluetech', 'lucid', 810, 870, null, null, null, '{}'),
(2080, 'secret-dreams', 'sun', 'Bread Winner', 'lucid', 870, 930, null, null, null, '{}'),
(2081, 'secret-dreams', 'sun', 'Amy Winehouse Tribute', 'woods', 60, 120, null, null, null, '{}'),
(2082, 'secret-dreams', 'sun', 'Eeli', 'woods', 150, 210, null, null, null, '{}'),
(2083, 'secret-dreams', 'sun', '3420', 'woods', 260, 330, null, null, null, '{}'),
(2084, 'secret-dreams', 'sun', 'Lespecial', 'woods', 360, 420, null, null, null, '{}'),
(2085, 'secret-dreams', 'sun', 'Lettuce', 'woods', 450, 540, null, null, null, '{}'),
(2086, 'secret-dreams', 'sun', 'Lettuce (Late Night)', 'woods', 735, 825, null, null, null, '{}'),
(2087, 'secret-dreams', 'sun', 'Chalk Dinosaur', 'woods', 855, 900, null, null, null, '{}'),
(2088, 'secret-dreams', 'sun', 'Vusive B2B Abby Vice', 'pg', 0, 60, null, null, null, '{}'),
(2089, 'secret-dreams', 'sun', 'Yilo', 'pg', 60, 120, null, null, null, '{}'),
(2090, 'secret-dreams', 'sun', 'Flintwick', 'pg', 120, 180, null, null, null, '{}'),
(2091, 'secret-dreams', 'sun', 'Ooga', 'pg', 180, 240, null, null, null, '{}'),
(2092, 'secret-dreams', 'sun', 'Humandala', 'pg', 240, 300, null, null, null, '{}'),
(2093, 'secret-dreams', 'sun', 'Duffrey', 'pg', 300, 360, null, null, null, '{}'),
(2094, 'secret-dreams', 'sun', 'The Librarian', 'pg', 360, 420, null, null, null, '{}'),
(2095, 'secret-dreams', 'sun', 'Allen Mock', 'pg', 420, 480, null, null, null, '{}'),
(2096, 'secret-dreams', 'sun', 'Maddy O''Neal', 'pg', 480, 540, null, null, null, '{}'),
(2097, 'secret-dreams', 'sun', 'Healyside>Elf Machine', 'pg', 735, 825, null, null, null, '{}'),
(2098, 'secret-dreams', 'sun', 'Nocturnal Emissions (The Big Finish)', 'pg', 825, 870, null, null, null, '{}');
