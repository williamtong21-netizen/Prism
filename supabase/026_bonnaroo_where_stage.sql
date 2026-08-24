-- Bonnaroo's "Where Stage" (new for 2026, Centeroo late-night bass/electronic
-- programming) was missing entirely -- confirmed real via The Daily
-- Frequency's coverage of the announced lineup. No exact set times are
-- published, so each artist gets a reasonable sequential late-night slot,
-- same approach used elsewhere for similarly sparse data.

insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(327, 'bonnaroo', 'fri', 'EAZYBAKED', 'where', 480, 525, null, 'Bass / Dubstep', null, '{}'),
(328, 'bonnaroo', 'fri', 'Lumasi', 'where', 525, 570, null, 'Bass / Electronic', null, '{}'),
(329, 'bonnaroo', 'fri', 'Mary Droppinz', 'where', 570, 615, null, 'Bass / Trap', null, '{}'),
(330, 'bonnaroo', 'fri', 'ProbCause', 'where', 615, 660, null, 'Bass / Hip-Hop', null, '{}'),
(331, 'bonnaroo', 'fri', 'Richard Finger', 'where', 660, 705, null, 'Bass / Electronic', null, '{}'),
(332, 'bonnaroo', 'sat', 'Big Gigantic', 'where', 495, 555, null, 'Livetronica / Bass', null, '{}'),
(333, 'bonnaroo', 'sat', 'CloZee', 'where', 555, 600, null, 'Global Bass', null, '{}'),
(334, 'bonnaroo', 'sat', 'Costa', 'where', 600, 645, null, 'Bass / Dubstep', null, '{}'),
(335, 'bonnaroo', 'sat', 'Effin', 'where', 645, 690, null, 'Bass / Dubstep', null, '{}'),
(336, 'bonnaroo', 'sat', 'Smoakland', 'where', 690, 735, null, 'Bass / Trap', null, '{}')
on conflict (id) do nothing;
