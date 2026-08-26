-- EDC Las Vegas's stored single "fri" day was a composite: 5 of 8 artists
-- (Fisher, Porter Robinson, Charlotte de Witte, Underworld, Meduza) really
-- did play together on EDC Vegas 2026's real Friday May 15 on the correct
-- stages (verified via 1001tracklists/EDM press), but 3 were wrong:
--   - Subtronics actually played Saturday May 16 on kineticFIELD, not
--     Friday on circuitGROUNDS.
--   - Vintage Culture actually played Sunday May 17 (correct stage,
--     circuitGROUNDS, wrong day).
--   - Sara Landry has no verifiable EDC Las Vegas 2026 set at all -- her
--     only confirmed EDC Vegas appearance is a full year earlier (2025).
-- Removing Sara Landry rather than guess a real 2026 slot for her, and
-- moving Subtronics/Vintage Culture to their real days/stage.

delete from festival_sets where festival_id = 'edc-vegas' and artist = 'Sara Landry';

update festival_sets set day_id = 'sat', stage_id = 'kineticfield'
  where festival_id = 'edc-vegas' and artist = 'Subtronics';

update festival_sets set day_id = 'sun'
  where festival_id = 'edc-vegas' and artist = 'Vintage Culture';
