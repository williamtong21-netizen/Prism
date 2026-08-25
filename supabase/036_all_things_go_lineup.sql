-- All Things Go 2026 (Merriweather Post Pavilion, Columbia, MD, Sep 25-27)
-- is a partial case like Nocturnal Wonderland: allthingsgofestival.com/dmv's
-- own official 2026 lineup poster confirms the complete real per-day
-- lineup, and the venue's own ticket page confirms two real stages
-- (Pavilion Stage, Chrysalis Stage) -- but no artist-to-stage or
-- artist-to-time mapping is published anywhere public yet (unlike the NYC
-- edition, which already has its own set-times page live). Rather than
-- fabricate a stage/time grid for the full ~44-artist roster across 3
-- days, only the clear top-billed acts per day are loaded here, under one
-- honestly-labeled "stage TBA" placeholder with generic evening time slots.
insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(1234, 'all-things-go', 'fri', 'Mitski', 'stage-tba', 180, 221, null, 'Indie Rock', null, '{}'),
(1235, 'all-things-go', 'fri', 'Ethel Cain', 'stage-tba', 231, 272, null, 'Gothic Americana', null, '{}'),
(1236, 'all-things-go', 'fri', 'Rainbow Kitten Surprise', 'stage-tba', 283, 324, null, 'Indie Rock', null, '{}'),
(1237, 'all-things-go', 'fri', 'Magdalena Bay', 'stage-tba', 334, 375, null, 'Synth-Pop', null, '{}'),
(1238, 'all-things-go', 'fri', 'Slayyyter', 'stage-tba', 386, 427, null, 'Hyperpop', null, '{}'),
(1239, 'all-things-go', 'sat', 'Hayley Williams', 'stage-tba', 180, 221, null, 'Alt Rock', null, '{}'),
(1240, 'all-things-go', 'sat', 'Muna', 'stage-tba', 231, 272, null, 'Indie Pop', null, '{}'),
(1241, 'all-things-go', 'sat', 'Zara Larsson', 'stage-tba', 283, 324, null, 'Pop', null, '{}'),
(1242, 'all-things-go', 'sat', 'Suki Waterhouse', 'stage-tba', 334, 375, null, 'Indie Pop', null, '{}'),
(1243, 'all-things-go', 'sat', 'Del Water Gap', 'stage-tba', 386, 427, null, 'Indie Pop', null, '{}'),
(1244, 'all-things-go', 'sun', 'Brandi Carlile', 'stage-tba', 180, 221, null, 'Americana', null, '{}'),
(1245, 'all-things-go', 'sun', 'Lola Young', 'stage-tba', 231, 272, null, 'Pop / Soul', null, '{}'),
(1246, 'all-things-go', 'sun', 'Sienna Spiro', 'stage-tba', 283, 324, null, null, null, '{}'),
(1247, 'all-things-go', 'sun', 'Father John Misty', 'stage-tba', 334, 375, null, 'Indie Folk', null, '{}'),
(1248, 'all-things-go', 'sun', 'Tinashe', 'stage-tba', 386, 427, null, 'R&B / Pop', null, '{}')
on conflict (id) do nothing;
