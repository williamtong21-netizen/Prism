-- Broader lineup-accuracy audit (triggered by the Lost Lands day-scrambling
-- bug): several festivals had the same class of error on their STAGE field
-- instead of the day field. Verified against real day-by-day/stage recaps
-- (NYSMusic, SFist, Daily Bruin, localnewsmatters -- see commit message /
-- conversation for full source list per artist).
--
-- Governors Ball 2026 (day tag "sat" = real Sat Jun 6, 2026, correct) --
-- 5 of 10 artists were on the wrong stage:
update festival_sets set stage_id = 'verizon' where festival_id = 'governors-ball' and artist = '2hollis';
update festival_sets set stage_id = 'grove' where festival_id = 'governors-ball' and artist = 'Jane Remover';
update festival_sets set stage_id = 'grove' where festival_id = 'governors-ball' and artist = 'Snow Strippers';
update festival_sets set stage_id = 'snapchat' where festival_id = 'governors-ball' and artist = 'Ravyn Lenae';
update festival_sets set stage_id = 'verizon' where festival_id = 'governors-ball' and artist = 'Wet Leg';

-- Outside Lands 2026 (day tag "sat" = real Sat Aug 8, 2026, correct) --
-- 3 of 8 artists were on the wrong stage:
update festival_sets set stage_id = 'landsend' where festival_id = 'outside-lands' and artist = 'Lucy Dacus';
update festival_sets set stage_id = 'landsend' where festival_id = 'outside-lands' and artist = 'Ethel Cain';
update festival_sets set stage_id = 'twinpeaks' where festival_id = 'outside-lands' and artist = 'Dijon';

-- Tomorrowland Winter: "Oliver Heldens' HI-LO b2b Maddix" on "sat" is
-- confirmed real (Tomorrowland Winter 2026 weekend-one Saturday). "Nervo b2b
-- MATTN" and "Dimitri Vegas b2b Steve Aoki" are real TW2026 Orbyz sets, but
-- research turned up conflicting/unconfirmed evidence for which day (one
-- source said Friday, possibly weekend two; nothing confirmed them on
-- "sun" as stored) -- removing rather than guess a day for a festival
-- format (week-long, two weekends) our 2-tab sat/sun day model can't
-- represent precisely anyway.
delete from festival_sets where festival_id = 'tomorrowland-winter' and artist in ('Nervo b2b MATTN', 'Dimitri Vegas b2b Steve Aoki');
