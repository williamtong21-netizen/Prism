-- Correct the original 3-entry ACL placeholder data, then add ACL's real
-- 2026 lineup researched from CultureMap Austin, KLBJ, and onestowatch.com
-- (day-by-day breakdown + weekend-2 exclusives). Day assignment and
-- headliner status are real; exact stage/set time aren't published this
-- far from the event, so each artist gets a reasonable sequential slot,
-- same approach already used for edc-orlando's sparse data.

-- Kings of Leon is a confirmed weekend-2-only exclusive (Fri Oct 9), not
-- weekend-1 Friday -- the original placeholder had this wrong.
update festival_sets set day_id = 'fri2', start_min = 570, end_min = 645 where id = 183;
-- Re-time the two other original rows for ACL's now-full noon-start day
-- (they were built around a 6pm marker back when only 3 sets existed).
update festival_sets set start_min = 570, end_min = 660 where id = 182; -- Skrillex
update festival_sets set start_min = 480, end_min = 555 where id = 184; -- Charli XCX

insert into festival_sets (id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources) values
(287, 'acl', 'fri', 'Rebecca Black', 'honda', 60, 105, null, 'Pop', null, '{}'),
(288, 'acl', 'fri', 'Leon Thomas', 'millerlite', 105, 150, null, 'R&B', null, '{}'),
(289, 'acl', 'fri', 'Amyl and the Sniffers', 'tmobile-acl', 150, 195, null, 'Punk', null, '{}'),
(290, 'acl', 'fri', 'Brandon Flowers', 'honda', 210, 270, null, 'Rock', null, '{}'),
(291, 'acl', 'fri', 'The Chainsmokers', 'millerlite', 270, 345, null, 'EDM Pop', null, '{}'),
(292, 'acl', 'fri', 'Labrinth', 'tmobile-acl', 315, 375, null, 'Alt R&B / Pop', null, '{}'),
(293, 'acl', 'fri', 'Turnstile', 'honda', 390, 465, null, 'Hardcore / Post-Hardcore', null, '{}'),
(294, 'acl', 'sat', 'Snow Strippers', 'honda', 60, 105, null, 'Electroclash', null, '{}'),
(295, 'acl', 'sat', 'Ryan Beatty', 'millerlite', 105, 150, null, 'Indie Pop / R&B', null, '{}'),
(296, 'acl', 'sat', 'Rodrigo y Gabriela', 'tmobile-acl', 150, 210, null, 'Instrumental Guitar / Flamenco', null, '{}'),
(297, 'acl', 'sat', 'Suki Waterhouse', 'honda', 225, 285, null, 'Indie Pop', null, '{}'),
(298, 'acl', 'sat', 'Lykke Li', 'millerlite', 300, 360, null, 'Indie Pop', null, '{}'),
(299, 'acl', 'sat', 'Bleachers', 'tmobile-acl', 375, 450, null, 'Indie Pop / Rock', null, '{}'),
(300, 'acl', 'sat', 'Young Miko', 'honda', 450, 510, null, 'Reggaeton / Latin Trap', null, '{}'),
(301, 'acl', 'sat', 'Lola Young', 'millerlite', 525, 585, null, 'Alt Pop / Soul', null, '{}'),
(302, 'acl', 'sat', 'RÜFÜS DU SOL', 'tmobile-acl', 600, 690, null, 'Electronic', null, '{}'),
(303, 'acl', 'sat', 'Lorde', 'honda', 600, 690, null, 'Art Pop', null, '{}'),
(304, 'acl', 'sun', 'Calder Allen', 'honda', 60, 105, null, 'Indie Folk', null, '{}'),
(305, 'acl', 'sun', 'Saint Motel', 'millerlite', 105, 150, null, 'Indie Pop', null, '{}'),
(306, 'acl', 'sun', 'Blood Orange', 'tmobile-acl', 165, 225, null, 'Alt R&B', null, '{}'),
(307, 'acl', 'sun', 'The War on Drugs', 'honda', 240, 315, null, 'Indie Rock / Americana', null, '{}'),
(308, 'acl', 'sun', 'Parcels', 'millerlite', 330, 390, null, 'Nu-Disco / Indie Pop', null, '{}'),
(309, 'acl', 'sun', 'Geese', 'tmobile-acl', 405, 465, null, 'Indie Rock', null, '{}'),
(310, 'acl', 'sun', 'SOFI TUKKER', 'honda', 480, 555, null, 'Dance Pop / Electronic', null, '{}'),
(311, 'acl', 'sun', 'Twenty One Pilots', 'millerlite', 570, 660, null, 'Alt Rock / Pop', null, '{}'),
(312, 'acl', 'sun', 'The xx', 'tmobile-acl', 570, 660, null, 'Indie Electronic', null, '{}'),
(313, 'acl', 'fri2', 'Bella Kay', 'honda', 90, 135, null, 'Pop', null, '{}'),
(314, 'acl', 'fri2', 'Natasha Bedingfield', 'millerlite', 180, 225, null, 'Pop', null, '{}'),
(315, 'acl', 'fri2', 'Turnstile', 'tmobile-acl', 390, 465, null, 'Hardcore / Post-Hardcore', null, '{}'),
(316, 'acl', 'fri2', 'Charli XCX', 'honda', 450, 525, null, 'Pop / Hyperpop', null, '{}'),
(317, 'acl', 'fri2', 'Kings of Leon', 'millerlite', 555, 630, null, 'Rock', null, '{}'),
(318, 'acl', 'sat2', 'RÜFÜS DU SOL', 'honda', 600, 690, null, 'Electronic', null, '{}'),
(319, 'acl', 'sat2', 'Lorde', 'millerlite', 600, 690, null, 'Art Pop', null, '{}'),
(320, 'acl', 'sat2', 'Lola Young', 'tmobile-acl', 525, 585, null, 'Alt Pop / Soul', null, '{}'),
(321, 'acl', 'sat2', 'Young Miko', 'honda', 450, 510, null, 'Reggaeton / Latin Trap', null, '{}'),
(322, 'acl', 'sun2', 'Houndmouth', 'honda', 90, 135, null, 'Americana / Indie Rock', null, '{}'),
(323, 'acl', 'sun2', 'Twenty One Pilots', 'millerlite', 570, 660, null, 'Alt Rock / Pop', null, '{}'),
(324, 'acl', 'sun2', 'The xx', 'tmobile-acl', 570, 660, null, 'Indie Electronic', null, '{}'),
(325, 'acl', 'sun2', 'Geese', 'honda', 405, 465, null, 'Indie Rock', null, '{}'),
(326, 'acl', 'sun2', 'SOFI TUKKER', 'millerlite', 480, 555, null, 'Dance Pop / Electronic', null, '{}')
on conflict (id) do nothing;
