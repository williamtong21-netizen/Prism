-- Shaky Knees 2026 (Piedmont Park, Atlanta, Sep 18-20) -- real per-artist
-- set times for all 4 official stages (Peachtree, Piedmont, Ponce de Leon,
-- Criminal Records) across all 3 real days, transcribed directly from the
-- festival's own official daily schedule graphics
-- (shakykneesfestival.com/schedule). Friday doors open 4:00pm; Saturday
-- and Sunday doors open 11:30am -- offsets are 0-based from each day's own
-- doors time.
-- Note: the official 2026 lineup poster (musicfestivalwizard.com mirror)
-- also lists Wolf Alice and Cruz Beckham on Saturday and Japanese
-- Breakfast on Sunday, but none of the three appear in the official daily
-- schedule graphics above -- likely Late Night Shows (a separate off-site
-- program per the site's own nav) rather than main-stage sets. Not
-- included here since no confirmed stage/time exists for them in the
-- actual schedule data (same rule as elsewhere: no guessing).
insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(1249, 'shaky-knees', 'fri', 'Hot Mulligan', 'peachtree', 90, 150, null, 'Emo / Pop Punk', null, '{}'),
(1250, 'shaky-knees', 'fri', 'Turnstile', 'peachtree', 210, 270, null, 'Hardcore Punk', null, '{}'),
(1251, 'shaky-knees', 'fri', 'The Strokes', 'peachtree', 330, 420, null, 'Rock', null, '{}'),
(1252, 'shaky-knees', 'fri', 'Ben Howard', 'piedmont', 30, 90, null, 'Folk', null, '{}'),
(1253, 'shaky-knees', 'fri', 'Geese', 'piedmont', 150, 210, null, 'Rock', null, '{}'),
(1254, 'shaky-knees', 'fri', 'Fontaines D.C.', 'piedmont', 270, 330, null, 'Post-Punk', null, '{}'),
(1255, 'shaky-knees', 'fri', 'Cartel', 'poncedeleon', 30, 90, null, 'Pop Rock', null, '{}'),
(1256, 'shaky-knees', 'fri', 'Snow Strippers', 'poncedeleon', 150, 200, null, 'Electroclash', null, '{}'),
(1257, 'shaky-knees', 'fri', 'Danny Elfman', 'poncedeleon', 270, 330, null, 'Alternative / Film Score', null, '{}'),
(1258, 'shaky-knees', 'fri', 'Goldford', 'criminalrecords', 90, 150, null, 'Rock', null, '{}'),
(1259, 'shaky-knees', 'fri', 'Alice Phoebe Lou', 'criminalrecords', 210, 270, null, 'Folk / Soul', null, '{}'),
(1260, 'shaky-knees', 'sat', 'Songs For Kids', 'peachtree', 15, 45, null, null, null, '{}'),
(1261, 'shaky-knees', 'sat', 'The Inspector Cluzo', 'peachtree', 75, 120, null, null, null, '{}'),
(1262, 'shaky-knees', 'sat', 'Elio Mei', 'peachtree', 165, 210, null, null, null, '{}'),
(1263, 'shaky-knees', 'sat', 'The Rapture', 'peachtree', 255, 300, null, null, null, '{}'),
(1264, 'shaky-knees', 'sat', 'Jimmy Eat World', 'peachtree', 360, 420, null, 'Emo / Rock', null, '{}'),
(1265, 'shaky-knees', 'sat', 'Pierce The Veil', 'peachtree', 480, 540, null, 'Post-Hardcore', null, '{}'),
(1266, 'shaky-knees', 'sat', 'Twenty One Pilots', 'peachtree', 600, 690, null, 'Alt-Pop / Rock', null, '{}'),
(1267, 'shaky-knees', 'sat', 'Old Mervs', 'piedmont', 30, 75, null, null, null, '{}'),
(1268, 'shaky-knees', 'sat', 'Villanelle', 'piedmont', 120, 165, null, null, null, '{}'),
(1269, 'shaky-knees', 'sat', 'Sir Chloe', 'piedmont', 210, 255, null, null, null, '{}'),
(1270, 'shaky-knees', 'sat', 'Minus The Bear', 'piedmont', 300, 360, null, 'Indie Rock', null, '{}'),
(1271, 'shaky-knees', 'sat', 'Blood Orange', 'piedmont', 420, 480, null, 'R&B / Indie', null, '{}'),
(1272, 'shaky-knees', 'sat', 'The Prodigy', 'piedmont', 540, 600, null, 'Electronic / Big Beat', null, '{}'),
(1273, 'shaky-knees', 'sat', 'Sophie''s Body', 'poncedeleon', 30, 75, null, null, null, '{}'),
(1274, 'shaky-knees', 'sat', 'Fat, Evil Children', 'poncedeleon', 120, 165, null, null, null, '{}'),
(1275, 'shaky-knees', 'sat', 'Rehash', 'poncedeleon', 210, 255, null, null, null, '{}'),
(1276, 'shaky-knees', 'sat', 'Peach Pit', 'poncedeleon', 300, 360, null, 'Indie Rock', null, '{}'),
(1277, 'shaky-knees', 'sat', 'Taking Back Sunday', 'poncedeleon', 420, 480, null, 'Emo', null, '{}'),
(1278, 'shaky-knees', 'sat', 'Pavement', 'poncedeleon', 540, 600, null, 'Indie Rock', null, '{}'),
(1279, 'shaky-knees', 'sat', 'Hotel Fiction', 'criminalrecords', 75, 120, null, null, null, '{}'),
(1280, 'shaky-knees', 'sat', 'Rum Jungle', 'criminalrecords', 165, 210, null, null, null, '{}'),
(1281, 'shaky-knees', 'sat', 'Geordie Greep', 'criminalrecords', 255, 300, null, 'Art Rock', null, '{}'),
(1282, 'shaky-knees', 'sat', 'Congress The Band', 'criminalrecords', 360, 420, null, null, null, '{}'),
(1283, 'shaky-knees', 'sat', 'Psychedelic Porn Crumpets', 'criminalrecords', 480, 540, null, 'Psychedelic Rock', null, '{}'),
(1284, 'shaky-knees', 'sun', 'Songs For Kids', 'peachtree', 15, 45, null, null, null, '{}'),
(1285, 'shaky-knees', 'sun', 'Cardinals', 'peachtree', 90, 135, null, null, null, '{}'),
(1286, 'shaky-knees', 'sun', 'Coheed and Cambria', 'peachtree', 195, 255, null, 'Prog Rock', null, '{}'),
(1287, 'shaky-knees', 'sun', 'Santigold', 'peachtree', 315, 375, null, 'Alt / Pop', null, '{}'),
(1288, 'shaky-knees', 'sun', 'Wu-Tang Clan', 'peachtree', 435, 495, null, 'Hip-Hop', null, '{}'),
(1289, 'shaky-knees', 'sun', 'Gorillaz', 'peachtree', 570, 660, null, 'Alt / Hip-Hop', null, '{}'),
(1290, 'shaky-knees', 'sun', 'Garbagebarbie', 'piedmont', 45, 90, null, null, null, '{}'),
(1291, 'shaky-knees', 'sun', 'Violet Grohl', 'piedmont', 135, 195, null, null, null, '{}'),
(1292, 'shaky-knees', 'sun', 'Jet', 'piedmont', 255, 315, null, 'Rock', null, '{}'),
(1293, 'shaky-knees', 'sun', 'Modest Mouse', 'piedmont', 375, 435, null, 'Indie Rock', null, '{}'),
(1294, 'shaky-knees', 'sun', 'LCD Soundsystem', 'piedmont', 495, 570, null, 'Dance-Punk', null, '{}'),
(1295, 'shaky-knees', 'sun', 'Showing Teeth', 'poncedeleon', 45, 90, null, null, null, '{}'),
(1296, 'shaky-knees', 'sun', 'The Two Lips', 'poncedeleon', 135, 195, null, null, null, '{}'),
(1297, 'shaky-knees', 'sun', 'OK Go', 'poncedeleon', 255, 315, null, 'Alt Rock', null, '{}'),
(1298, 'shaky-knees', 'sun', 'Bone Thugs-N-Harmony', 'poncedeleon', 375, 435, null, 'Hip-Hop', null, '{}'),
(1299, 'shaky-knees', 'sun', 'Knocked Loose', 'poncedeleon', 495, 555, null, 'Metalcore', null, '{}'),
(1300, 'shaky-knees', 'sun', 'Porch Light', 'criminalrecords', 90, 135, null, null, null, '{}'),
(1301, 'shaky-knees', 'sun', 'Big Special', 'criminalrecords', 195, 255, null, null, null, '{}'),
(1302, 'shaky-knees', 'sun', 'American Hi-Fi', 'criminalrecords', 315, 375, null, null, null, '{}'),
(1303, 'shaky-knees', 'sun', 'FCUKERS', 'criminalrecords', 435, 495, null, null, null, '{}')
on conflict (id) do nothing;
