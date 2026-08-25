-- Nocturnal Wonderland 2026 (Glen Helen Regional Park, San Bernardino,
-- Sep 19-20) is a partial case: nocturnalwonderland.com's own lineup page
-- and official poster only group ~80 real artists by day (Saturday vs
-- Sunday) -- no stage or set-time breakdown is published anywhere public
-- yet, unlike Reading & Leeds/Rock in Rio/Louder Than Life/Riot Fest.
-- The venue's 4 real stages (Mystic Wild, Dawn Mountain, Aurora Plains,
-- Rave Cave, per nocturnalwonderland.com/experience/stages) aren't mapped
-- to specific artists anywhere, and 80 sets can't fit non-overlapping on
-- one stage column. Rather than fabricate a stage/time grid for the full
-- roster, only the clear headliner-tier acts are loaded here (real,
-- day-confirmed), under one honestly-labeled "stage TBA" placeholder with
-- generic evening time slots.
insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(1109, 'nocturnal-wonderland', 'sat', 'Deorro', 'mysticwild', 180, 221, null, 'Moombahton / Big Room', null, '{}'),
(1110, 'nocturnal-wonderland', 'sat', 'Green Velvet', 'mysticwild', 231, 272, null, 'House / Techno', null, '{}'),
(1111, 'nocturnal-wonderland', 'sat', 'James Hype', 'mysticwild', 283, 324, null, 'House', null, '{}'),
(1112, 'nocturnal-wonderland', 'sat', 'Malaa', 'mysticwild', 334, 375, null, 'Bass House', null, '{}'),
(1113, 'nocturnal-wonderland', 'sat', 'NGHTMRE', 'mysticwild', 386, 427, null, 'Bass / Trap', null, '{}'),
(1114, 'nocturnal-wonderland', 'sat', 'Patrick Topping', 'mysticwild', 437, 478, null, 'Tech House', null, '{}'),
(1115, 'nocturnal-wonderland', 'sat', 'Deadmau5', 'mysticwild', 489, 530, null, 'Progressive House', null, '{}'),
(1116, 'nocturnal-wonderland', 'sun', 'Barely Alive', 'mysticwild', 180, 221, null, 'Dubstep', null, '{}'),
(1117, 'nocturnal-wonderland', 'sun', 'Eliminate', 'mysticwild', 231, 272, null, 'Dubstep', null, '{}'),
(1118, 'nocturnal-wonderland', 'sun', 'R3HAB', 'mysticwild', 283, 324, null, 'Progressive House', null, '{}'),
(1119, 'nocturnal-wonderland', 'sun', 'Sidepiece', 'mysticwild', 334, 375, null, 'Tech House', null, '{}'),
(1120, 'nocturnal-wonderland', 'sun', 'Troyboi', 'mysticwild', 386, 427, null, 'Bass / Trap', null, '{}'),
(1121, 'nocturnal-wonderland', 'sun', 'Seven Lions', 'mysticwild', 437, 478, null, 'Melodic Dubstep', null, '{}'),
(1122, 'nocturnal-wonderland', 'sun', 'Illenium', 'mysticwild', 489, 530, null, 'Melodic Bass', null, '{}')
on conflict (id) do nothing;
