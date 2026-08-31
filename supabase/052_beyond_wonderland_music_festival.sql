-- Beyond Wonderland at the Gorge 2026 (Jun 27-28, Gorge Amphitheatre,
-- George, WA) -- 56 rows across sat/sun, 3 stages (Queen's Valley, Mad
-- Hatter's Castle, Caterpillar's Garden).
--
-- Transcribed verbatim from the festival's OWN official set-times pages,
-- recovered via the Wayback Machine since the live site has since
-- rotated to promoting its 2027 edition:
--   web.archive.org/web/20260627044830/https://pnw.beyondwonderland.com/lineup/set-times/
--   web.archive.org/web/20260627044829/https://pnw.beyondwonderland.com/lineup/set-times/day-2/
-- Both start AND end times are explicitly published for every set on
-- both days -- nothing here is inferred/estimated.
--
-- A third-party aggregator (Festival Dust) was tried first but its
-- stage-column attribution didn't match this official source on
-- cross-check -- e.g. it had Apashe closing Queen's Valley and no
-- Kaskade at all, where the official page has Kaskade closing Queen's
-- Valley and Apashe closing Mad Hatter's Castle -- so it was discarded
-- entirely in favor of this official source.
--
-- start_min/end_min are relative to each day's FESTIVAL_DAYS startMin
-- (both days: 3:00 PM / 900 min since midnight -- Mad Hatter's Castle's
-- published start time both days, the earliest of the 3 stages).

insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(2800, 'beyond-wonderland', 'sat', 'KiD CALViN', 'queensvalley', 60, 150, null, null, null, '{}'),
(2801, 'beyond-wonderland', 'sat', 'Atura', 'queensvalley', 150, 210, null, null, null, '{}'),
(2802, 'beyond-wonderland', 'sat', 'Angrybaby', 'queensvalley', 210, 270, null, null, null, '{}'),
(2803, 'beyond-wonderland', 'sat', 'JSTJR', 'queensvalley', 270, 330, null, null, null, '{}'),
(2804, 'beyond-wonderland', 'sat', 'ARMNHMR', 'queensvalley', 330, 390, null, null, null, '{}'),
(2805, 'beyond-wonderland', 'sat', 'Sub Focus', 'queensvalley', 390, 450, null, null, null, '{}'),
(2806, 'beyond-wonderland', 'sat', 'Wooli', 'queensvalley', 450, 510, null, null, null, '{}'),
(2807, 'beyond-wonderland', 'sat', 'Seven Lions', 'queensvalley', 510, 570, null, null, null, '{}'),
(2808, 'beyond-wonderland', 'sat', 'Kaskade', 'queensvalley', 570, 630, null, null, null, '{}'),
(2809, 'beyond-wonderland', 'sat', 'Kaiyo', 'madhatterscastle', 0, 90, null, null, null, '{}'),
(2810, 'beyond-wonderland', 'sat', 'Bella Renee', 'madhatterscastle', 90, 150, null, null, null, '{}'),
(2811, 'beyond-wonderland', 'sat', 'Mad Dubz', 'madhatterscastle', 150, 210, null, null, null, '{}'),
(2812, 'beyond-wonderland', 'sat', 'Grabbitz', 'madhatterscastle', 210, 270, null, null, null, '{}'),
(2813, 'beyond-wonderland', 'sat', 'Reaper', 'madhatterscastle', 270, 330, null, null, null, '{}'),
(2814, 'beyond-wonderland', 'sat', 'TVBOO', 'madhatterscastle', 330, 390, null, null, null, '{}'),
(2815, 'beyond-wonderland', 'sat', 'Kompany', 'madhatterscastle', 390, 450, null, null, null, '{}'),
(2816, 'beyond-wonderland', 'sat', 'Wilkinson', 'madhatterscastle', 450, 510, null, null, null, '{}'),
(2817, 'beyond-wonderland', 'sat', 'Riot Ten B2B INFEKT', 'madhatterscastle', 510, 570, null, null, null, '{}'),
(2818, 'beyond-wonderland', 'sat', 'Apashe', 'madhatterscastle', 570, 630, null, null, null, '{}'),
(2819, 'beyond-wonderland', 'sat', 'Jaogaz', 'caterpillarsgarden', 60, 150, null, null, null, '{}'),
(2820, 'beyond-wonderland', 'sat', 'AMP', 'caterpillarsgarden', 150, 210, null, null, null, '{}'),
(2821, 'beyond-wonderland', 'sat', 'Fallon', 'caterpillarsgarden', 210, 270, null, null, null, '{}'),
(2822, 'beyond-wonderland', 'sat', 'Kaleena Zanders', 'caterpillarsgarden', 270, 330, null, null, null, '{}'),
(2823, 'beyond-wonderland', 'sat', 'Girl Math', 'caterpillarsgarden', 330, 390, null, null, null, '{}'),
(2824, 'beyond-wonderland', 'sat', 'OMNOM', 'caterpillarsgarden', 390, 450, null, null, null, '{}'),
(2825, 'beyond-wonderland', 'sat', 'Noizu', 'caterpillarsgarden', 450, 510, null, null, null, '{}'),
(2826, 'beyond-wonderland', 'sat', 'Matroda', 'caterpillarsgarden', 510, 570, null, null, null, '{}'),
(2827, 'beyond-wonderland', 'sat', 'SIDEPIECE', 'caterpillarsgarden', 570, 630, null, null, null, '{}'),
(2828, 'beyond-wonderland', 'sun', 'Nash Rly', 'queensvalley', 60, 120, null, null, null, '{}'),
(2829, 'beyond-wonderland', 'sun', 'BOLO', 'queensvalley', 120, 180, null, null, null, '{}'),
(2830, 'beyond-wonderland', 'sun', 'Justin Jay', 'queensvalley', 180, 240, null, null, null, '{}'),
(2831, 'beyond-wonderland', 'sun', 'Blanke', 'queensvalley', 240, 300, null, null, null, '{}'),
(2832, 'beyond-wonderland', 'sun', 'Odd Mob', 'queensvalley', 300, 360, null, null, null, '{}'),
(2833, 'beyond-wonderland', 'sun', 'Dabin', 'queensvalley', 365, 425, null, null, null, '{}'),
(2834, 'beyond-wonderland', 'sun', 'Black Tiger Sex Machine', 'queensvalley', 425, 495, null, null, null, '{}'),
(2835, 'beyond-wonderland', 'sun', 'Zeds Dead', 'queensvalley', 505, 565, null, null, null, '{}'),
(2836, 'beyond-wonderland', 'sun', 'Fisher', 'queensvalley', 570, 630, null, null, null, '{}'),
(2837, 'beyond-wonderland', 'sun', 'Keeb', 'madhatterscastle', 0, 85, null, null, null, '{}'),
(2838, 'beyond-wonderland', 'sun', 'Don Jamal', 'madhatterscastle', 85, 145, null, null, null, '{}'),
(2839, 'beyond-wonderland', 'sun', 'HVDES', 'madhatterscastle', 145, 205, null, null, null, '{}'),
(2840, 'beyond-wonderland', 'sun', '1991', 'madhatterscastle', 205, 265, null, null, null, '{}'),
(2841, 'beyond-wonderland', 'sun', 'Eliminate', 'madhatterscastle', 265, 325, null, null, null, '{}'),
(2842, 'beyond-wonderland', 'sun', 'YDG', 'madhatterscastle', 325, 385, null, null, null, '{}'),
(2843, 'beyond-wonderland', 'sun', 'Getter', 'madhatterscastle', 385, 445, null, null, null, '{}'),
(2844, 'beyond-wonderland', 'sun', 'Hedex', 'madhatterscastle', 445, 505, null, null, null, '{}'),
(2845, 'beyond-wonderland', 'sun', 'Dr. Fresch', 'madhatterscastle', 505, 565, null, null, null, '{}'),
(2846, 'beyond-wonderland', 'sun', 'Liquid Stranger', 'madhatterscastle', 570, 630, null, null, null, '{}'),
(2847, 'beyond-wonderland', 'sun', 'Sloane Motion', 'caterpillarsgarden', 60, 105, null, null, null, '{}'),
(2848, 'beyond-wonderland', 'sun', 'Slugg', 'caterpillarsgarden', 105, 165, null, null, null, '{}'),
(2849, 'beyond-wonderland', 'sun', 'RUZE', 'caterpillarsgarden', 165, 225, null, null, null, '{}'),
(2850, 'beyond-wonderland', 'sun', 'Marco Strous', 'caterpillarsgarden', 225, 285, null, null, null, '{}'),
(2851, 'beyond-wonderland', 'sun', 'Azzecca', 'caterpillarsgarden', 285, 345, null, null, null, '{}'),
(2852, 'beyond-wonderland', 'sun', 'Green Velvet', 'caterpillarsgarden', 345, 420, null, null, null, '{}'),
(2853, 'beyond-wonderland', 'sun', 'AYYBO', 'caterpillarsgarden', 420, 495, null, null, null, '{}'),
(2854, 'beyond-wonderland', 'sun', 'Swimming Paul', 'caterpillarsgarden', 495, 555, null, null, null, '{}'),
(2855, 'beyond-wonderland', 'sun', '999999999', 'caterpillarsgarden', 555, 630, null, null, null, '{}');
