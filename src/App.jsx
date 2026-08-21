import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "./lib/useAuth";
import { usePackingState } from "./lib/usePackingState";
import { useNotifications } from "./lib/useNotifications";
import { useCrews } from "./lib/useCrews";
import { useDMs } from "./lib/useDMs";
import { useCampPins } from "./lib/useCampPins";
import { usePushSubscription } from "./lib/usePushSubscription";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

// Real Bonnaroo 2026 stage names and Friday, June 12 set times (from public
// schedule listings). Match %, "sounds like", and source tags are still
// simulated — there's no real Spotify/SoundCloud connection here, so those
// stay placeholders layered on top of the real lineup data.
//
// Stages and days are scoped per festival so the picker can actually switch
// between festivals rather than just relabeling Bonnaroo's data.
const FESTIVAL_STAGES = {
  bonnaroo: [
    { id: "what", name: "What Stage", color: "#3DF2E0" },
    { id: "which", name: "Which Stage", color: "#FF3DA6" },
    { id: "this", name: "This Tent", color: "#FFB23D" },
    { id: "that", name: "That Tent", color: "#9D6BFF" },
    { id: "other", name: "Other Tent", color: "#5FD97A" },
  ],
  coachella: [
    { id: "coachella-stage", name: "Coachella Stage", color: "#3DF2E0" },
    { id: "outdoor", name: "Outdoor Theatre", color: "#FF3DA6" },
    { id: "sahara", name: "Sahara", color: "#FFB23D" },
    { id: "gobi", name: "Gobi", color: "#9D6BFF" },
    { id: "sonora", name: "Sonora", color: "#5FD97A" },
    { id: "mojave", name: "Mojave", color: "#FF7A3D" },
    { id: "quasar", name: "Quasar", color: "#7ADFFF" },
  ],
  "electric-forest": [
    { id: "ranch", name: "Ranch Arena", color: "#3DF2E0" },
    { id: "sherwood", name: "Sherwood Court", color: "#9D6BFF" },
    { id: "tripolee", name: "Tripolee", color: "#FF3DA6" },
  ],
  "governors-ball": [
    { id: "verizon", name: "GovBallNYC (Verizon)", color: "#3DF2E0" },
    { id: "grove", name: "The Grove", color: "#9D6BFF" },
    { id: "snapchat", name: "Snapchat Stage", color: "#FFB23D" },
  ],
  lollapalooza: [
    { id: "tmobile", name: "T-Mobile Stage", color: "#3DF2E0" },
    { id: "budlight", name: "Bud Light Stage", color: "#FF3DA6" },
    { id: "perrys", name: "Perry's Stage", color: "#9D6BFF" },
  ],
  "outside-lands": [
    { id: "landsend", name: "Lands End", color: "#3DF2E0" },
    { id: "twinpeaks", name: "Twin Peaks", color: "#9D6BFF" },
    { id: "sutro", name: "Sutro", color: "#FF3DA6" },
  ],
  acl: [
    { id: "honda", name: "Honda Stage", color: "#3DF2E0" },
    { id: "millerlite", name: "Miller Lite Stage", color: "#FFB23D" },
    { id: "tmobile-acl", name: "T-Mobile Stage", color: "#9D6BFF" },
  ],
  "edc-vegas": [
    { id: "kineticfield", name: "kineticFIELD", color: "#3DF2E0" },
    { id: "cosmicmeadow", name: "cosmicMEADOW", color: "#FF3DA6" },
    { id: "circuitgrounds", name: "circuitGROUNDS", color: "#FFB23D" },
    { id: "neongarden", name: "neonGARDEN", color: "#9D6BFF" },
  ],
  tomorrowland: [
    { id: "mainstage", name: "Mainstage", color: "#3DF2E0" },
    { id: "freedom", name: "Freedom", color: "#9D6BFF" },
  ],
  "lost-lands": [
    { id: "crater", name: "Crater", color: "#3DF2E0" },
    { id: "ll-mainstage", name: "Mainstage", color: "#FF3DA6" },
  ],
  // Real Ultra Miami 2026 stages, per Ultra's official 2026 site map
  // (ultramusicfestival.com/site-map) — Main Stage, Worldwide Stage, the two
  // RESISTANCE stages (Megastructure + The Cove), and the Live Stage.
  "ultra-miami": [
    { id: "main", name: "Main Stage", color: "#3DF2E0" },
    { id: "worldwide", name: "Worldwide Stage", color: "#FF3DA6" },
    { id: "resistance-mega", name: "Resistance (Megastructure)", color: "#9D6BFF" },
    { id: "resistance-cove", name: "Resistance (The Cove)", color: "#FFB23D" },
    { id: "live", name: "Live Stage", color: "#5FD97A" },
  ],
  // Real Ultra Europe 2026 stages, per Ultra Europe's official 2026 site map
  // (ultraeurope.com/site-map).
  "ultra-europe": [
    { id: "main", name: "Main Stage", color: "#3DF2E0" },
    { id: "resistance", name: "Resistance", color: "#9D6BFF" },
    { id: "umf-radio", name: "UMF Radio", color: "#FFB23D" },
    { id: "oasis", name: "Oasis", color: "#5FD97A" },
  ],
  // Real Tomorrowland Winter 2026 stages, per DJ Mag's coverage of the
  // festival's full lineup/stage announcement (MainStage, Frozen Lotus,
  // Orbyz, Reflection of Love, CORE).
  "tomorrowland-winter": [
    { id: "mainstage", name: "MainStage", color: "#3DF2E0" },
    { id: "frozenlotus", name: "Frozen Lotus", color: "#FF3DA6" },
    { id: "orbyz", name: "Orbyz", color: "#9D6BFF" },
    { id: "reflection", name: "Reflection of Love", color: "#FFB23D" },
    { id: "core", name: "CORE", color: "#5FD97A" },
  ],
  // Real EDC Orlando stages, per Insomniac's own EDC Orlando site
  // (orlando.edc.com/experience/stages) and 2026 lineup coverage.
  "edc-orlando": [
    { id: "kineticfield", name: "kineticFIELD", color: "#3DF2E0" },
    { id: "circuitgrounds", name: "circuitGROUNDS", color: "#FF3DA6" },
    { id: "neongarden", name: "neonGARDEN", color: "#9D6BFF" },
    { id: "wasteland", name: "wasteLAND", color: "#FFB23D" },
    { id: "bakedkathedral", name: "bakedKATHEDRAL", color: "#5FD97A" },
  ],
  // Real EDC Mexico 2026 stages, per the official festival map (released via
  // Insomniac/OCESA and covered by Infobae) and EDM Identity's set-times
  // coverage.
  "edc-mexico": [
    { id: "kineticfield", name: "kineticFIELD", color: "#3DF2E0" },
    { id: "circuitgrounds", name: "circuitGROUNDS", color: "#FF3DA6" },
    { id: "neongarden", name: "neonGARDEN", color: "#9D6BFF" },
    { id: "wasteland", name: "wasteLAND", color: "#FFB23D" },
    { id: "stereobloom", name: "stereoBLOOM", color: "#5FD97A" },
  ],
  // Real Lollapalooza Argentina 2026 stage names (FLOW, SAMSUNG, Alternative,
  // Perry's), per Perfil's coverage of the festival's new 2026 map.
  "lollapalooza-argentina": [
    { id: "flow", name: "FLOW", color: "#3DF2E0" },
    { id: "samsung", name: "SAMSUNG", color: "#FF3DA6" },
    { id: "alternative", name: "Alternative", color: "#9D6BFF" },
    { id: "perrys", name: "Perry's", color: "#FFB23D" },
  ],
  // Real Lollapalooza Berlin 2026 stage names, per the festival's own
  // official site map (lollapaloozade.com — "Der Lageplan ist da").
  "lollapalooza-berlin": [
    { id: "essence", name: "Essence Stage", color: "#3DF2E0" },
    { id: "tkmaxx", name: "TK Maxx Stage", color: "#FF3DA6" },
    { id: "perrys", name: "Perry's Stage", color: "#9D6BFF" },
    { id: "newhorizon", name: "New Horizon Stage", color: "#FFB23D" },
    { id: "fashionpalooza", name: "Fashionpalooza", color: "#5FD97A" },
  ],
};

// Festival catalog — scoped to major, reliably-recurring festivals for now;
// smaller/regional ones come later once this foundation is solid. Only
// Bonnaroo and Coachella have real, researched schedule data loaded so far
// — the rest are real festivals with real dates/locations, but building
// full lineup data for each means either fabricating it or scraping,
// neither of which is right. "Request" reflects the actual path: official
// festival partnerships for real data feeds, the same gap flagged early on
// for how Bonnaroo's own data would ideally get sourced at scale.
const FESTIVALS = [
  { id: "bonnaroo", name: "Bonnaroo", location: "Manchester, TN", dates: "Jun 11–14, 2026", hasData: true },
  { id: "coachella", name: "Coachella", location: "Indio, CA", dates: "Apr 10–19, 2026", hasData: true },
  { id: "edc-vegas", name: "EDC Las Vegas", location: "Las Vegas, NV", dates: "May 15–17, 2026", hasData: true, noCamping: true },
  { id: "electric-forest", name: "Electric Forest", location: "Rothbury, MI", dates: "Jun 25–28, 2026", hasData: true },
  { id: "governors-ball", name: "Governors Ball", location: "New York, NY", dates: "Jun 5–7, 2026", hasData: true, noCamping: true },
  { id: "lollapalooza", name: "Lollapalooza", location: "Chicago, IL", dates: "Jul 30–Aug 2, 2026", hasData: true, noCamping: true },
  { id: "outside-lands", name: "Outside Lands", location: "San Francisco, CA", dates: "Aug 7–9, 2026", hasData: true, noCamping: true },
  { id: "acl", name: "Austin City Limits", location: "Austin, TX", dates: "Oct 2–4 & 9–11, 2026", hasData: true, noCamping: true },
  { id: "tomorrowland", name: "Tomorrowland", location: "Boom, Belgium", dates: "Jul 17–19 & 24–26, 2026", hasData: true },
  { id: "lost-lands", name: "Lost Lands", location: "Thornville, OH", dates: "Sep 18–20, 2026", hasData: true },
  { id: "ultra-miami", name: "Ultra Miami", location: "Miami, FL", dates: "Mar 27–29, 2026", hasData: true, noCamping: true },
  { id: "ultra-europe", name: "Ultra Europe", location: "Split, Croatia", dates: "Jul 10–12, 2026", hasData: true, noCamping: true },
  { id: "tomorrowland-winter", name: "Tomorrowland Winter", location: "Alpe d'Huez, France", dates: "Mar 21–28, 2026", hasData: true, noCamping: true },
  { id: "edc-orlando", name: "EDC Orlando", location: "Orlando, FL", dates: "Nov 6–8, 2026", hasData: true, noCamping: true },
  { id: "edc-mexico", name: "EDC Mexico", location: "Mexico City, Mexico", dates: "Feb 20–22, 2026", hasData: true, noCamping: true },
  { id: "lollapalooza-argentina", name: "Lollapalooza Argentina", location: "Buenos Aires, Argentina", dates: "Mar 13–15, 2026", hasData: true, noCamping: true },
  { id: "lollapalooza-berlin", name: "Lollapalooza Berlin", location: "Berlin, Germany", dates: "Jul 18–19, 2026", hasData: true, noCamping: true },
];

const FESTIVAL_DAYS = {
  bonnaroo: [
    { id: "thu", label: "Thu", date: "Jun 11", startMin: 17 * 60 + 30 },
    { id: "fri", label: "Fri", date: "Jun 12", startMin: 13 * 60 },
    { id: "sat", label: "Sat", date: "Jun 13", startMin: 12 * 60 + 45 },
    { id: "sun", label: "Sun", date: "Jun 14", startMin: 14 * 60 + 45 },
  ],
  coachella: [
    { id: "fri", label: "Fri", date: "Apr 10", startMin: 16 * 60 },
    { id: "sat", label: "Sat", date: "Apr 11", startMin: 15 * 60 },
    { id: "sun", label: "Sun", date: "Apr 12", startMin: 16 * 60 },
    { id: "fri2", label: "Fri", date: "Apr 17", startMin: 16 * 60 },
    { id: "sat2", label: "Sat", date: "Apr 18", startMin: 15 * 60 },
    { id: "sun2", label: "Sun", date: "Apr 19", startMin: 16 * 60 },
  ],
  "electric-forest": [
    { id: "thu", label: "Thu", date: "Jun 25", startMin: 18 * 60 + 30 },
  ],
  "governors-ball": [
    { id: "sat", label: "Sat", date: "Jun 6", startMin: 12 * 60 },
  ],
  lollapalooza: [
    { id: "sat", label: "Sat", date: "Aug 1", startMin: 12 * 60 },
  ],
  "outside-lands": [
    { id: "sat", label: "Sat", date: "Aug 8", startMin: 15 * 60 },
  ],
  acl: [
    { id: "fri", label: "Fri", date: "Oct 2", startMin: 18 * 60 },
  ],
  "edc-vegas": [
    { id: "fri", label: "Fri", date: "May 15", startMin: 21 * 60 },
  ],
  tomorrowland: [
    { id: "fri", label: "Fri", date: "Jul 17", startMin: 14 * 60 },
  ],
  "lost-lands": [
    { id: "fri", label: "Fri", date: "Sep 18", startMin: 18 * 60 },
  ],
  // Grid starts at 4pm, matching the confirmed 4:00pm start of Frank Walker's
  // Main Stage set (Miami New Times' published 2026 set times).
  "ultra-miami": [
    { id: "fri", label: "Fri", date: "Mar 27", startMin: 16 * 60 },
  ],
  // Grid starts at 8pm, matching the confirmed doors/first-set time on
  // ultraeurope.com's published 2026 set times.
  "ultra-europe": [
    { id: "fri", label: "Fri", date: "Jul 10", startMin: 20 * 60 },
  ],
  // DJ Mag's Tomorrowland Winter 2026 coverage confirms specific artists on
  // specific days (see SETS below) but not a published daily set-time grid,
  // so these are generic evening-start markers.
  "tomorrowland-winter": [
    { id: "sat", label: "Sat", date: "Mar 21", startMin: 18 * 60 },
    { id: "sun", label: "Sun", date: "Mar 22", startMin: 18 * 60 },
  ],
  // EDC Orlando 2026's day-by-day headliner assignment is confirmed
  // (gottagoorlando.com) but exact set times aren't published yet — the
  // event is still ~2.5 months out as of this writing — so these are
  // generic evening-start markers.
  "edc-orlando": [
    { id: "fri", label: "Fri", date: "Nov 6", startMin: 19 * 60 },
    { id: "sat", label: "Sat", date: "Nov 7", startMin: 19 * 60 },
    { id: "sun", label: "Sun", date: "Nov 8", startMin: 19 * 60 },
  ],
  // Grid starts at 4pm, matching EDC Mexico's published Friday gate/stage
  // hours (edmidentity.com). Chris Lake's and Charlotte de Witte's
  // circuitGROUNDS sets ran back-to-back overnight Fri–Sat, so both are
  // grouped under "fri" here rather than splitting an overnight set across
  // two day buckets.
  "edc-mexico": [
    { id: "fri", label: "Fri", date: "Feb 20", startMin: 16 * 60 },
    { id: "sun", label: "Sun", date: "Feb 22", startMin: 16 * 60 },
  ],
  // Grid starts at 7pm, matching Katseye's confirmed Friday opening slot
  // (perfil.com / lanacion.com.ar's published 2026 day-by-day schedules).
  "lollapalooza-argentina": [
    { id: "fri", label: "Fri", date: "Mar 13", startMin: 19 * 60 },
    { id: "sun", label: "Sun", date: "Mar 15", startMin: 18 * 60 + 45 },
  ],
  // Grid starts at noon, matching Baran Kok's confirmed Essence Stage
  // opening set time (timeout.com/festivawl.com's published 2026 set times).
  "lollapalooza-berlin": [
    { id: "sat", label: "Sat", date: "Jul 18", startMin: 12 * 60 },
  ],
};

// Flattened for fmtTime's lookup — day ids are only unique within a
// festival, so fmtTime needs both to resolve the right start time.
const ALL_DAYS = Object.entries(FESTIVAL_DAYS).flatMap(([festivalId, days]) => days.map((d) => ({ ...d, festivalId })));

const SETS = [
  // --- Friday, June 12 ---
  { id: 1, festival: "bonnaroo", day: "fri", artist: "Dora Jar", stage: "that", start: 0, end: 45, match: 58, genre: "Indie Pop", sounds_like: null, sources: [] },
  { id: 2, festival: "bonnaroo", day: "fri", artist: "Villanelle", stage: "what", start: 45, end: 90, match: 44, genre: "Pop", sounds_like: null, sources: [] },
  { id: 3, festival: "bonnaroo", day: "fri", artist: "Lambrini Girls", stage: "which", start: 75, end: 120, match: 71, genre: "Punk", sounds_like: "Raw, high-energy — close to your louder guitar picks", sources: ["soundcloud"] },
  { id: 4, festival: "bonnaroo", day: "fri", artist: "PawPaw Rod", stage: "that", start: 120, end: 165, match: 39, genre: "Hip-Hop", sounds_like: null, sources: [] },
  { id: 5, festival: "bonnaroo", day: "fri", artist: "Claire Rosinkranz", stage: "which", start: 135, end: 180, match: 52, genre: "Pop", sounds_like: null, sources: [] },
  { id: 6, festival: "bonnaroo", day: "fri", artist: "Amble", stage: "what", start: 135, end: 180, match: 83, genre: "Indie Folk", sounds_like: "Close to your Bon Iver / Fleet Foxes listening", sources: ["spotify"] },
  { id: 7, festival: "bonnaroo", day: "fri", artist: "Blues Traveler", stage: "what", start: 225, end: 285, match: 47, genre: "Rock", sounds_like: null, sources: [] },
  { id: 8, festival: "bonnaroo", day: "fri", artist: "Zack Fox", stage: "other", start: 240, end: 285, match: 65, genre: "Hip-Hop", sounds_like: "You've streamed a couple of his guest verses", sources: ["spotify"] },
  { id: 9, festival: "bonnaroo", day: "fri", artist: "Rachel Chinouriri", stage: "this", start: 255, end: 300, match: 79, genre: "Indie Pop", sounds_like: "Like Holly Humberstone, more upbeat", sources: ["spotify", "soundcloud"] },
  { id: 10, festival: "bonnaroo", day: "fri", artist: "Wet Leg", stage: "which", start: 300, end: 360, match: 94, genre: "Indie Rock", sounds_like: "Your #3 most-played artist this year", sources: ["spotify", "soundcloud"] },
  { id: 11, festival: "bonnaroo", day: "fri", artist: "Mother Mother", stage: "this", start: 300, end: 360, match: 88, genre: "Indie Rock", sounds_like: "Heavy rotation for you the past few months", sources: ["spotify"] },
  { id: 12, festival: "bonnaroo", day: "fri", artist: "Łaszewo", stage: "other", start: 300, end: 360, match: 69, genre: "Electronic", sounds_like: "New territory, close to your SoundCloud follows", sources: ["soundcloud"] },
  { id: 13, festival: "bonnaroo", day: "fri", artist: "Yungblud", stage: "what", start: 345, end: 405, match: 73, genre: "Alt Rock", sounds_like: "Overlaps with your rock-leaning playlists", sources: ["spotify"] },
  { id: 14, festival: "bonnaroo", day: "fri", artist: "Jessie Murph", stage: "which", start: 420, end: 480, match: 61, genre: "Pop / Country", sounds_like: null, sources: [] },
  { id: 15, festival: "bonnaroo", day: "fri", artist: "GRiZ", stage: "what", start: 465, end: 540, match: 97, genre: "Funk / Electronic", sounds_like: "Your #1 most-played artist this year", sources: ["spotify", "soundcloud"] },
  { id: 16, festival: "bonnaroo", day: "fri", artist: "The Strokes", stage: "what", start: 600, end: 675, match: 91, genre: "Rock", sounds_like: "Your #2 most-played artist this year", sources: ["spotify"] },

  // --- Thursday, June 11 — Bonnaroo's lightest day, one stage of data ---
  { id: 17, festival: "bonnaroo", day: "thu", artist: "Spiritual Cramp", stage: "what", start: 0, end: 60, match: 42, genre: "Punk", sounds_like: null, sources: [] },
  { id: 18, festival: "bonnaroo", day: "thu", artist: "Vince Staples", stage: "what", start: 90, end: 150, match: 68, genre: "Hip-Hop", sounds_like: "You've streamed a few of his early albums", sources: ["spotify"] },
  { id: 19, festival: "bonnaroo", day: "thu", artist: "Four Tet", stage: "what", start: 180, end: 270, match: 95, genre: "Electronic", sounds_like: "Heavy rotation for you lately", sources: ["spotify", "soundcloud"] },
  { id: 20, festival: "bonnaroo", day: "thu", artist: "Skrillex", stage: "what", start: 300, end: 390, match: 89, genre: "Dubstep / Electronic", sounds_like: "Big part of your electronic listening history", sources: ["spotify"] },

  // --- Saturday, June 13 ---
  { id: 21, festival: "bonnaroo", day: "sat", artist: "Sunami", stage: "this", start: 0, end: 45, match: 35, genre: "Hardcore", sounds_like: null, sources: [] },
  { id: 22, festival: "bonnaroo", day: "sat", artist: "Midnight Generation", stage: "what", start: 60, end: 105, match: 55, genre: "Indie Rock", sounds_like: null, sources: [] },
  { id: 23, festival: "bonnaroo", day: "sat", artist: "Arcy Drive", stage: "what", start: 150, end: 195, match: 61, genre: "Alt Rock", sounds_like: null, sources: [] },
  { id: 24, festival: "bonnaroo", day: "sat", artist: "Tash Sultana", stage: "what", start: 240, end: 300, match: 86, genre: "Psychedelic Soul", sounds_like: "Overlaps with your looping / psych-leaning playlists", sources: ["spotify"] },
  { id: 25, festival: "bonnaroo", day: "sat", artist: "Trixie Mattel", stage: "that", start: 195, end: 255, match: 30, genre: "Comedy / Variety", sounds_like: null, sources: [] },
  { id: 26, festival: "bonnaroo", day: "sat", artist: "Holly Humberstone", stage: "which", start: 195, end: 255, match: 77, genre: "Indie Pop", sounds_like: "Similar to Rachel Chinouriri, who you caught Friday", sources: ["spotify"] },
  { id: 27, festival: "bonnaroo", day: "sat", artist: "Passion Pit", stage: "this", start: 360, end: 420, match: 72, genre: "Indie Electropop", sounds_like: "Nostalgic indie-electropop you still revisit", sources: ["spotify"] },
  { id: 28, festival: "bonnaroo", day: "sat", artist: "Alabama Shakes", stage: "what", start: 360, end: 420, match: 91, genre: "Rock / Soul", sounds_like: "Your SoundCloud follows lean into this soul-rock sound", sources: ["soundcloud"] },
  { id: 29, festival: "bonnaroo", day: "sat", artist: "The Neighbourhood", stage: "what", start: 480, end: 555, match: 66, genre: "Alt Rock", sounds_like: null, sources: [] },
  { id: 30, festival: "bonnaroo", day: "sat", artist: "Kesha Presents: Superjam", stage: "this", start: 480, end: 585, match: 58, genre: "Pop (special set)", sounds_like: null, sources: [] },
  { id: 31, festival: "bonnaroo", day: "sat", artist: "Teddy Swims", stage: "which", start: 540, end: 615, match: 74, genre: "Soul / Pop", sounds_like: "Close to your soul/pop crossover picks", sources: ["spotify"] },
  { id: 32, festival: "bonnaroo", day: "sat", artist: "Sara Landry", stage: "other", start: 555, end: 645, match: 82, genre: "Techno", sounds_like: "New territory, close to your SoundCloud follows", sources: ["soundcloud"] },
  { id: 33, festival: "bonnaroo", day: "sat", artist: "RÜFÜS DU SOL", stage: "what", start: 625, end: 715, match: 98, genre: "Electronic", sounds_like: "Your #1 most-played artist this weekend", sources: ["spotify", "soundcloud"] },

  // --- Sunday, June 14 — closing day ---
  { id: 34, festival: "bonnaroo", day: "sun", artist: "Spacey Jane", stage: "which", start: 0, end: 60, match: 70, genre: "Indie Rock", sounds_like: null, sources: [] },
  { id: 35, festival: "bonnaroo", day: "sun", artist: "Blondshell", stage: "that", start: 15, end: 60, match: 80, genre: "Indie Rock", sounds_like: "Close to Wet Leg, who you caught Friday", sources: ["spotify"] },
  { id: 36, festival: "bonnaroo", day: "sun", artist: "Trombone Shorty", stage: "what", start: 60, end: 120, match: 48, genre: "Funk / Jazz", sounds_like: null, sources: [] },
  { id: 37, festival: "bonnaroo", day: "sun", artist: "Japanese Breakfast", stage: "which", start: 105, end: 165, match: 92, genre: "Indie Pop", sounds_like: "Heavy rotation for you the past few months", sources: ["spotify", "soundcloud"] },
  { id: 38, festival: "bonnaroo", day: "sun", artist: "Tedeschi Trucks Band", stage: "what", start: 165, end: 225, match: 53, genre: "Blues Rock", sounds_like: null, sources: [] },
  { id: 39, festival: "bonnaroo", day: "sun", artist: "Turnover", stage: "this", start: 225, end: 285, match: 64, genre: "Dream Pop", sounds_like: null, sources: [] },
  { id: 40, festival: "bonnaroo", day: "sun", artist: "Del Water Gap", stage: "that", start: 225, end: 285, match: 76, genre: "Indie Pop", sounds_like: "Close to your Amble listening from Friday", sources: ["spotify"] },
  { id: 41, festival: "bonnaroo", day: "sun", artist: "Clipse", stage: "which", start: 225, end: 285, match: 71, genre: "Hip-Hop", sounds_like: "A few of their tracks are in your playlists", sources: ["spotify"] },
  { id: 42, festival: "bonnaroo", day: "sun", artist: "Role Model", stage: "what", start: 285, end: 345, match: 59, genre: "Pop", sounds_like: null, sources: [] },
  { id: 43, festival: "bonnaroo", day: "sun", artist: "Modest Mouse", stage: "this", start: 330, end: 405, match: 84, genre: "Indie Rock", sounds_like: "Your indie rock taste lines up well here", sources: ["spotify"] },
  { id: 44, festival: "bonnaroo", day: "sun", artist: "Kesha", stage: "which", start: 345, end: 405, match: 67, genre: "Pop", sounds_like: null, sources: [] },
  { id: 45, festival: "bonnaroo", day: "sun", artist: "Mariah the Scientist", stage: "that", start: 345, end: 420, match: 73, genre: "R&B", sounds_like: "Close to your R&B listening on SoundCloud", sources: ["soundcloud"] },
  { id: 46, festival: "bonnaroo", day: "sun", artist: "Noah Kahan", stage: "what", start: 405, end: 480, match: 96, genre: "Folk Pop", sounds_like: "Your #2 most-played artist this weekend", sources: ["spotify"] },

  // --- Coachella, Friday April 10, 2026 — Weekend 1, Day 1 ---
  { id: 47, festival: "coachella", day: "fri", artist: "Dabeull", stage: "outdoor", start: 0, end: 50, match: 44, genre: "French House / Funk", sounds_like: null, sources: [] },
  { id: 48, festival: "coachella", day: "fri", artist: "Youna", stage: "sahara", start: 0, end: 50, match: 38, genre: "Pop", sounds_like: null, sources: [] },
  { id: 49, festival: "coachella", day: "fri", artist: "Bob Baker Marionettes", stage: "gobi", start: 0, end: 40, match: 25, genre: "Variety / Puppetry", sounds_like: null, sources: [] },
  { id: 50, festival: "coachella", day: "fri", artist: "Wednesday", stage: "sonora", start: 0, end: 40, match: 78, genre: "Indie Rock", sounds_like: "Close to Wet Leg and other fuzzy indie rock you like", sources: ["spotify"] },
  { id: 51, festival: "coachella", day: "fri", artist: "BINI", stage: "mojave", start: 15, end: 60, match: 41, genre: "P-Pop", sounds_like: null, sources: [] },
  { id: 52, festival: "coachella", day: "fri", artist: "NewDad", stage: "gobi", start: 45, end: 85, match: 69, genre: "Shoegaze / Indie", sounds_like: "Overlaps with your dreamier indie rock listening", sources: ["soundcloud"] },
  { id: 53, festival: "coachella", day: "fri", artist: "HUGEL", stage: "sahara", start: 50, end: 110, match: 55, genre: "House", sounds_like: null, sources: [] },
  { id: 54, festival: "coachella", day: "fri", artist: "Fleshwater", stage: "sonora", start: 50, end: 90, match: 47, genre: "Shoegaze / Metal", sounds_like: null, sources: [] },
  { id: 55, festival: "coachella", day: "fri", artist: "Tiga", stage: "quasar", start: 60, end: 180, match: 62, genre: "Electro / House", sounds_like: null, sources: [] },
  { id: 56, festival: "coachella", day: "fri", artist: "Lykke Li", stage: "outdoor", start: 80, end: 130, match: 74, genre: "Indie Pop", sounds_like: "Close to Rachel Chinouriri, who you caught at Bonnaroo", sources: ["spotify"] },
  { id: 57, festival: "coachella", day: "fri", artist: "Teddy Swims", stage: "coachella-stage", start: 90, end: 140, match: 71, genre: "Soul / Pop", sounds_like: "Close to your soul/pop crossover picks", sources: ["spotify"] },
  { id: 58, festival: "coachella", day: "fri", artist: "Central Cee", stage: "mojave", start: 90, end: 135, match: 66, genre: "UK Hip-Hop", sounds_like: null, sources: [] },
  { id: 59, festival: "coachella", day: "fri", artist: "Joyce Manor", stage: "gobi", start: 90, end: 130, match: 58, genre: "Emo / Indie Rock", sounds_like: null, sources: [] },
  { id: 60, festival: "coachella", day: "fri", artist: "The Two Lips", stage: "sonora", start: 120, end: 160, match: 33, genre: "Pop", sounds_like: null, sources: [] },
  { id: 61, festival: "coachella", day: "fri", artist: "The xx", stage: "coachella-stage", start: 180, end: 240, match: 90, genre: "Indie Electronic", sounds_like: "Your #1 most-played artist a few years running", sources: ["spotify", "soundcloud"] },
  { id: 62, festival: "coachella", day: "fri", artist: "Sabrina Carpenter", stage: "coachella-stage", start: 305, end: 395, match: 88, genre: "Pop", sounds_like: "One of your most-streamed pop artists this year", sources: ["spotify"] },
  { id: 63, festival: "coachella", day: "fri", artist: "Anyma", stage: "coachella-stage", start: 480, end: 570, match: 93, genre: "Melodic Techno / Audiovisual", sounds_like: "Your SoundCloud follows lean heavily into this sound", sources: ["soundcloud"] },

  // --- Coachella, Saturday April 11, 2026 — Weekend 1, Day 2 ---
  { id: 64, festival: "coachella", day: "sat", artist: "Jack White", stage: "mojave", start: 0, end: 45, match: 82, genre: "Rock / Blues", sounds_like: "Overlaps with your rock and blues-leaning listening", sources: ["spotify"] },
  { id: 65, festival: "coachella", day: "sat", artist: "Los Hermanos Flores", stage: "outdoor", start: 60, end: 105, match: 40, genre: "Latin / Cumbia", sounds_like: null, sources: [] },
  { id: 66, festival: "coachella", day: "sat", artist: "Alex G", stage: "outdoor", start: 130, end: 175, match: 77, genre: "Indie Rock", sounds_like: "Consistent with your lo-fi indie rock taste", sources: ["spotify"] },
  { id: 67, festival: "coachella", day: "sat", artist: "Addison Rae", stage: "coachella-stage", start: 150, end: 195, match: 54, genre: "Pop", sounds_like: null, sources: [] },
  { id: 68, festival: "coachella", day: "sat", artist: "Geese", stage: "gobi", start: 195, end: 240, match: 72, genre: "Indie Rock", sounds_like: "Fits your fuzzy indie rock taste", sources: ["spotify"] },
  { id: 69, festival: "coachella", day: "sat", artist: "Blondshell", stage: "outdoor", start: 190, end: 235, match: 85, genre: "Indie Rock", sounds_like: "You caught her Sunday at Bonnaroo — recurring favorite", sources: ["spotify"] },
  { id: 70, festival: "coachella", day: "sat", artist: "Giveon", stage: "coachella-stage", start: 240, end: 285, match: 68, genre: "R&B", sounds_like: "Close to your R&B listening on SoundCloud", sources: ["soundcloud"] },
  { id: 71, festival: "coachella", day: "sat", artist: "Sombr", stage: "outdoor", start: 245, end: 290, match: 63, genre: "Indie Pop", sounds_like: null, sources: [] },
  { id: 72, festival: "coachella", day: "sat", artist: "Nine Inch Noize", stage: "sahara", start: 300, end: 360, match: 89, genre: "Industrial / Electronic", sounds_like: "New territory but close to your industrial/electronic edges", sources: ["soundcloud"] },
  { id: 73, festival: "coachella", day: "sat", artist: "The Strokes", stage: "coachella-stage", start: 360, end: 410, match: 95, genre: "Rock", sounds_like: "You caught them Friday at Bonnaroo — clearly a top artist for you", sources: ["spotify"] },
  { id: 74, festival: "coachella", day: "sat", artist: "David Guetta", stage: "quasar", start: 360, end: 450, match: 45, genre: "House / EDM", sounds_like: null, sources: [] },
  { id: 75, festival: "coachella", day: "sat", artist: "PinkPantheress", stage: "gobi", start: 355, end: 400, match: 59, genre: "Pop / UK Garage", sounds_like: null, sources: [] },
  { id: 76, festival: "coachella", day: "sat", artist: "Labrinth", stage: "outdoor", start: 330, end: 375, match: 66, genre: "Alt R&B / Pop", sounds_like: null, sources: [] },
  { id: 77, festival: "coachella", day: "sat", artist: "Interpol", stage: "mojave", start: 435, end: 480, match: 60, genre: "Post-Punk", sounds_like: null, sources: [] },
  { id: 78, festival: "coachella", day: "sat", artist: "David Byrne", stage: "outdoor", start: 440, end: 490, match: 58, genre: "Art Rock", sounds_like: null, sources: [] },
  { id: 79, festival: "coachella", day: "sat", artist: "Justin Bieber", stage: "coachella-stage", start: 505, end: 580, match: 71, genre: "Pop", sounds_like: null, sources: [] },

  // --- Coachella, Sunday April 12, 2026 — Weekend 1, Day 3 ---
  { id: 80, festival: "coachella", day: "sun", artist: "Tijuana Panthers", stage: "coachella-stage", start: 0, end: 45, match: 36, genre: "Surf Rock", sounds_like: null, sources: [] },
  { id: 81, festival: "coachella", day: "sun", artist: "Gigi Perez", stage: "outdoor", start: 0, end: 45, match: 75, genre: "Indie Pop", sounds_like: "Close to your softer indie pop picks", sources: ["spotify"] },
  { id: 82, festival: "coachella", day: "sun", artist: "Wet Leg", stage: "coachella-stage", start: 45, end: 90, match: 97, genre: "Indie Rock", sounds_like: "You caught them Friday at Bonnaroo — your #3 most-played artist this year", sources: ["spotify", "soundcloud"] },
  { id: 83, festival: "coachella", day: "sun", artist: "Clipse", stage: "outdoor", start: 75, end: 120, match: 74, genre: "Hip-Hop", sounds_like: "You caught them Sunday at Bonnaroo too", sources: ["spotify"] },
  { id: 84, festival: "coachella", day: "sun", artist: "Major Lazer", stage: "coachella-stage", start: 130, end: 175, match: 64, genre: "Dancehall / Electronic", sounds_like: null, sources: [] },
  { id: 85, festival: "coachella", day: "sun", artist: "Foster the People", stage: "outdoor", start: 165, end: 210, match: 69, genre: "Indie Pop / Rock", sounds_like: null, sources: [] },
  { id: 86, festival: "coachella", day: "sun", artist: "Drain", stage: "gobi", start: 240, end: 285, match: 52, genre: "Hardcore Punk", sounds_like: null, sources: [] },
  { id: 87, festival: "coachella", day: "sun", artist: "Young Thug", stage: "coachella-stage", start: 230, end: 275, match: 57, genre: "Hip-Hop", sounds_like: null, sources: [] },
  { id: 88, festival: "coachella", day: "sun", artist: "Laufey", stage: "outdoor", start: 280, end: 325, match: 86, genre: "Jazz Pop", sounds_like: "Overlaps with your jazzier, softer listening moods", sources: ["spotify"] },
  { id: 89, festival: "coachella", day: "sun", artist: "Glitterer", stage: "gobi", start: 375, end: 420, match: 65, genre: "Indie Rock / Punk", sounds_like: null, sources: [] },
  { id: 90, festival: "coachella", day: "sun", artist: "Karol G", stage: "coachella-stage", start: 355, end: 430, match: 80, genre: "Reggaeton / Latin Pop", sounds_like: "Outside your usual genres but heavily hyped in your circles", sources: ["spotify"] },
  { id: 91, festival: "coachella", day: "sun", artist: "BIGBANG", stage: "outdoor", start: 390, end: 450, match: 48, genre: "K-Pop", sounds_like: null, sources: [] },

  // --- Coachella Weekend 2 (April 17-19) — same lineup as Weekend 1 ---
  { id: 92, festival: "coachella", day: "fri2", artist: "Dabeull", stage: "outdoor", start: 0, end: 50, match: 44, genre: "French House / Funk", sounds_like: null, sources: [] },
  { id: 93, festival: "coachella", day: "fri2", artist: "Youna", stage: "sahara", start: 0, end: 50, match: 38, genre: "Pop", sounds_like: null, sources: [] },
  { id: 94, festival: "coachella", day: "fri2", artist: "Bob Baker Marionettes", stage: "gobi", start: 0, end: 40, match: 25, genre: "Variety / Puppetry", sounds_like: null, sources: [] },
  { id: 95, festival: "coachella", day: "fri2", artist: "Wednesday", stage: "sonora", start: 0, end: 40, match: 78, genre: "Indie Rock", sounds_like: "Close to Wet Leg and other fuzzy indie rock you like", sources: ["spotify"] },
  { id: 96, festival: "coachella", day: "fri2", artist: "BINI", stage: "mojave", start: 15, end: 60, match: 41, genre: "P-Pop", sounds_like: null, sources: [] },
  { id: 97, festival: "coachella", day: "fri2", artist: "NewDad", stage: "gobi", start: 45, end: 85, match: 69, genre: "Shoegaze / Indie", sounds_like: "Overlaps with your dreamier indie rock listening", sources: ["soundcloud"] },
  { id: 98, festival: "coachella", day: "fri2", artist: "HUGEL", stage: "sahara", start: 50, end: 110, match: 55, genre: "House", sounds_like: null, sources: [] },
  { id: 99, festival: "coachella", day: "fri2", artist: "Fleshwater", stage: "sonora", start: 50, end: 90, match: 47, genre: "Shoegaze / Metal", sounds_like: null, sources: [] },
  { id: 100, festival: "coachella", day: "fri2", artist: "Tiga", stage: "quasar", start: 60, end: 180, match: 62, genre: "Electro / House", sounds_like: null, sources: [] },
  { id: 101, festival: "coachella", day: "fri2", artist: "Lykke Li", stage: "outdoor", start: 80, end: 130, match: 74, genre: "Indie Pop", sounds_like: "Close to Rachel Chinouriri, who you caught at Bonnaroo", sources: ["spotify"] },
  { id: 102, festival: "coachella", day: "fri2", artist: "Teddy Swims", stage: "coachella-stage", start: 90, end: 140, match: 71, genre: "Soul / Pop", sounds_like: "Close to your soul/pop crossover picks", sources: ["spotify"] },
  { id: 103, festival: "coachella", day: "fri2", artist: "Central Cee", stage: "mojave", start: 90, end: 135, match: 66, genre: "UK Hip-Hop", sounds_like: null, sources: [] },
  { id: 104, festival: "coachella", day: "fri2", artist: "Joyce Manor", stage: "gobi", start: 90, end: 130, match: 58, genre: "Emo / Indie Rock", sounds_like: null, sources: [] },
  { id: 105, festival: "coachella", day: "fri2", artist: "The Two Lips", stage: "sonora", start: 120, end: 160, match: 33, genre: "Pop", sounds_like: null, sources: [] },
  { id: 106, festival: "coachella", day: "fri2", artist: "The xx", stage: "coachella-stage", start: 180, end: 240, match: 90, genre: "Indie Electronic", sounds_like: "Your #1 most-played artist a few years running", sources: ["spotify", "soundcloud"] },
  { id: 107, festival: "coachella", day: "fri2", artist: "Sabrina Carpenter", stage: "coachella-stage", start: 305, end: 395, match: 88, genre: "Pop", sounds_like: "One of your most-streamed pop artists this year", sources: ["spotify"] },
  { id: 108, festival: "coachella", day: "fri2", artist: "Anyma", stage: "coachella-stage", start: 480, end: 570, match: 93, genre: "Melodic Techno / Audiovisual", sounds_like: "Your SoundCloud follows lean heavily into this sound", sources: ["soundcloud"] },
  { id: 109, festival: "coachella", day: "sat2", artist: "Jack White", stage: "mojave", start: 0, end: 45, match: 82, genre: "Rock / Blues", sounds_like: "Overlaps with your rock and blues-leaning listening", sources: ["spotify"] },
  { id: 110, festival: "coachella", day: "sat2", artist: "Los Hermanos Flores", stage: "outdoor", start: 60, end: 105, match: 40, genre: "Latin / Cumbia", sounds_like: null, sources: [] },
  { id: 111, festival: "coachella", day: "sat2", artist: "Alex G", stage: "outdoor", start: 130, end: 175, match: 77, genre: "Indie Rock", sounds_like: "Consistent with your lo-fi indie rock taste", sources: ["spotify"] },
  { id: 112, festival: "coachella", day: "sat2", artist: "Addison Rae", stage: "coachella-stage", start: 150, end: 195, match: 54, genre: "Pop", sounds_like: null, sources: [] },
  { id: 113, festival: "coachella", day: "sat2", artist: "Geese", stage: "gobi", start: 195, end: 240, match: 72, genre: "Indie Rock", sounds_like: "Fits your fuzzy indie rock taste", sources: ["spotify"] },
  { id: 114, festival: "coachella", day: "sat2", artist: "Blondshell", stage: "outdoor", start: 190, end: 235, match: 85, genre: "Indie Rock", sounds_like: "You caught her Sunday at Bonnaroo — recurring favorite", sources: ["spotify"] },
  { id: 115, festival: "coachella", day: "sat2", artist: "Giveon", stage: "coachella-stage", start: 240, end: 285, match: 68, genre: "R&B", sounds_like: "Close to your R&B listening on SoundCloud", sources: ["soundcloud"] },
  { id: 116, festival: "coachella", day: "sat2", artist: "Sombr", stage: "outdoor", start: 245, end: 290, match: 63, genre: "Indie Pop", sounds_like: null, sources: [] },
  { id: 117, festival: "coachella", day: "sat2", artist: "Nine Inch Noize", stage: "sahara", start: 300, end: 360, match: 89, genre: "Industrial / Electronic", sounds_like: "New territory but close to your industrial/electronic edges", sources: ["soundcloud"] },
  { id: 118, festival: "coachella", day: "sat2", artist: "The Strokes", stage: "coachella-stage", start: 360, end: 410, match: 95, genre: "Rock", sounds_like: "You caught them Friday at Bonnaroo — clearly a top artist for you", sources: ["spotify"] },
  { id: 119, festival: "coachella", day: "sat2", artist: "David Guetta", stage: "quasar", start: 360, end: 450, match: 45, genre: "House / EDM", sounds_like: null, sources: [] },
  { id: 120, festival: "coachella", day: "sat2", artist: "PinkPantheress", stage: "gobi", start: 355, end: 400, match: 59, genre: "Pop / UK Garage", sounds_like: null, sources: [] },
  { id: 121, festival: "coachella", day: "sat2", artist: "Labrinth", stage: "outdoor", start: 330, end: 375, match: 66, genre: "Alt R&B / Pop", sounds_like: null, sources: [] },
  { id: 122, festival: "coachella", day: "sat2", artist: "Interpol", stage: "mojave", start: 435, end: 480, match: 60, genre: "Post-Punk", sounds_like: null, sources: [] },
  { id: 123, festival: "coachella", day: "sat2", artist: "David Byrne", stage: "outdoor", start: 440, end: 490, match: 58, genre: "Art Rock", sounds_like: null, sources: [] },
  { id: 124, festival: "coachella", day: "sat2", artist: "Justin Bieber", stage: "coachella-stage", start: 505, end: 580, match: 71, genre: "Pop", sounds_like: null, sources: [] },
  { id: 125, festival: "coachella", day: "sun2", artist: "Tijuana Panthers", stage: "coachella-stage", start: 0, end: 45, match: 36, genre: "Surf Rock", sounds_like: null, sources: [] },
  { id: 126, festival: "coachella", day: "sun2", artist: "Gigi Perez", stage: "outdoor", start: 0, end: 45, match: 75, genre: "Indie Pop", sounds_like: "Close to your softer indie pop picks", sources: ["spotify"] },
  { id: 127, festival: "coachella", day: "sun2", artist: "Wet Leg", stage: "coachella-stage", start: 45, end: 90, match: 97, genre: "Indie Rock", sounds_like: "You caught them Friday at Bonnaroo — your #3 most-played artist this year", sources: ["spotify", "soundcloud"] },
  { id: 128, festival: "coachella", day: "sun2", artist: "Clipse", stage: "outdoor", start: 75, end: 120, match: 74, genre: "Hip-Hop", sounds_like: "You caught them Sunday at Bonnaroo too", sources: ["spotify"] },
  { id: 129, festival: "coachella", day: "sun2", artist: "Major Lazer", stage: "coachella-stage", start: 130, end: 175, match: 64, genre: "Dancehall / Electronic", sounds_like: null, sources: [] },
  { id: 130, festival: "coachella", day: "sun2", artist: "Foster the People", stage: "outdoor", start: 165, end: 210, match: 69, genre: "Indie Pop / Rock", sounds_like: null, sources: [] },
  { id: 131, festival: "coachella", day: "sun2", artist: "Drain", stage: "gobi", start: 240, end: 285, match: 52, genre: "Hardcore Punk", sounds_like: null, sources: [] },
  { id: 132, festival: "coachella", day: "sun2", artist: "Young Thug", stage: "coachella-stage", start: 230, end: 275, match: 57, genre: "Hip-Hop", sounds_like: null, sources: [] },
  { id: 133, festival: "coachella", day: "sun2", artist: "Laufey", stage: "outdoor", start: 280, end: 325, match: 86, genre: "Jazz Pop", sounds_like: "Overlaps with your jazzier, softer listening moods", sources: ["spotify"] },
  { id: 134, festival: "coachella", day: "sun2", artist: "Glitterer", stage: "gobi", start: 375, end: 420, match: 65, genre: "Indie Rock / Punk", sounds_like: null, sources: [] },
  { id: 135, festival: "coachella", day: "sun2", artist: "Karol G", stage: "coachella-stage", start: 355, end: 430, match: 80, genre: "Reggaeton / Latin Pop", sounds_like: "Outside your usual genres but heavily hyped in your circles", sources: ["spotify"] },
  { id: 136, festival: "coachella", day: "sun2", artist: "BIGBANG", stage: "outdoor", start: 390, end: 450, match: 48, genre: "K-Pop", sounds_like: null, sources: [] },

  // --- Electric Forest, Thursday June 25, 2026 — Day 1 ---
  { id: 137, festival: "electric-forest", day: "thu", artist: "EFFIN", stage: "ranch", start: 0, end: 75, match: 58, genre: "Bass / Dubstep", sounds_like: null, sources: [] },
  { id: 138, festival: "electric-forest", day: "thu", artist: "Midnight Generation", stage: "ranch", start: 105, end: 165, match: 71, genre: "Indie Rock", sounds_like: "You caught them at Bonnaroo too — recurring pick for you", sources: ["spotify"] },
  { id: 139, festival: "electric-forest", day: "thu", artist: "Disco Lines", stage: "ranch", start: 195, end: 270, match: 84, genre: "Tech House / Bass", sounds_like: "Overlaps with your tech house listening", sources: ["soundcloud"] },
  { id: 140, festival: "electric-forest", day: "thu", artist: "Excision", stage: "ranch", start: 360, end: 450, match: 93, genre: "Dubstep", sounds_like: "Lost Lands' headliner and a heavy part of your bass rotation", sources: ["spotify", "soundcloud"] },
  { id: 141, festival: "electric-forest", day: "thu", artist: "Eggy", stage: "sherwood", start: 30, end: 105, match: 45, genre: "Jam Band", sounds_like: null, sources: [] },
  { id: 142, festival: "electric-forest", day: "thu", artist: "Night Tapes", stage: "sherwood", start: 150, end: 210, match: 76, genre: "Dream Pop / Electronic", sounds_like: "Close to your dreamier indie/electronic crossover picks", sources: ["spotify"] },
  { id: 143, festival: "electric-forest", day: "thu", artist: "Alleycvt", stage: "sherwood", start: 270, end: 345, match: 62, genre: "Bass", sounds_like: null, sources: [] },
  { id: 144, festival: "electric-forest", day: "thu", artist: "Ganja White Night", stage: "sherwood", start: 435, end: 510, match: 81, genre: "Dubstep", sounds_like: "New territory, close to your SoundCloud dubstep follows", sources: ["soundcloud"] },
  { id: 145, festival: "electric-forest", day: "thu", artist: "H&RRY", stage: "tripolee", start: 0, end: 75, match: 55, genre: "Electronic / House", sounds_like: null, sources: [] },
  { id: 146, festival: "electric-forest", day: "thu", artist: "Close Friends Only", stage: "tripolee", start: 75, end: 135, match: 69, genre: "Indie Electronic", sounds_like: null, sources: [] },
  { id: 147, festival: "electric-forest", day: "thu", artist: "Jackie Hollander", stage: "tripolee", start: 135, end: 195, match: 73, genre: "House", sounds_like: "Fits your house listening on weekends", sources: ["spotify"] },
  { id: 148, festival: "electric-forest", day: "thu", artist: "Daniel Allan", stage: "tripolee", start: 195, end: 255, match: 88, genre: "Melodic Bass", sounds_like: "Heavy rotation for you lately", sources: ["spotify", "soundcloud"] },
  { id: 149, festival: "electric-forest", day: "thu", artist: "DEVAULT", stage: "tripolee", start: 255, end: 315, match: 48, genre: "Bass / Dubstep", sounds_like: null, sources: [] },
  { id: 150, festival: "electric-forest", day: "thu", artist: "WESTEND", stage: "tripolee", start: 315, end: 375, match: 60, genre: "House", sounds_like: null, sources: [] },
  { id: 151, festival: "electric-forest", day: "thu", artist: "D.O.D", stage: "tripolee", start: 375, end: 435, match: 77, genre: "Techno / Bass", sounds_like: "Close to your techno/bass crossover taste", sources: ["soundcloud"] },
  { id: 152, festival: "electric-forest", day: "thu", artist: "ODD MOB", stage: "tripolee", start: 435, end: 495, match: 54, genre: "Bass House", sounds_like: null, sources: [] },
  { id: 153, festival: "electric-forest", day: "thu", artist: "Eli Brown", stage: "tripolee", start: 495, end: 570, match: 90, genre: "Tech House", sounds_like: "Your SoundCloud follows lean heavily into UK house/tech", sources: ["soundcloud"] },

  // --- Governors Ball, Saturday June 6, 2026 ---
  { id: 154, festival: "governors-ball", day: "sat", artist: "Jimmyboy", stage: "verizon", start: 0, end: 45, match: 40, genre: "Pop", sounds_like: null, sources: [] },
  { id: 155, festival: "governors-ball", day: "sat", artist: "Jade LeMac", stage: "grove", start: 15, end: 60, match: 52, genre: "Pop", sounds_like: null, sources: [] },
  { id: 156, festival: "governors-ball", day: "sat", artist: "Chanpan", stage: "snapchat", start: 30, end: 75, match: 47, genre: "Electronic", sounds_like: null, sources: [] },
  { id: 157, festival: "governors-ball", day: "sat", artist: "Spacey Jane", stage: "grove", start: 120, end: 165, match: 70, genre: "Indie Rock", sounds_like: null, sources: [] },
  { id: 158, festival: "governors-ball", day: "sat", artist: "2hollis", stage: "snapchat", start: 150, end: 195, match: 61, genre: "Alt Pop / Electronic", sounds_like: null, sources: [] },
  { id: 159, festival: "governors-ball", day: "sat", artist: "Jane Remover", stage: "verizon", start: 180, end: 225, match: 65, genre: "Shoegaze / Digicore", sounds_like: null, sources: [] },
  { id: 160, festival: "governors-ball", day: "sat", artist: "Ravyn Lenae", stage: "verizon", start: 240, end: 285, match: 79, genre: "R&B", sounds_like: "Close to your R&B listening on SoundCloud", sources: ["soundcloud"] },
  { id: 161, festival: "governors-ball", day: "sat", artist: "Wet Leg", stage: "grove", start: 240, end: 285, match: 97, genre: "Indie Rock", sounds_like: "You caught them at Bonnaroo and Coachella — clearly a favorite", sources: ["spotify", "soundcloud"] },
  { id: 162, festival: "governors-ball", day: "sat", artist: "Snow Strippers", stage: "snapchat", start: 240, end: 285, match: 58, genre: "Electroclash", sounds_like: null, sources: [] },
  { id: 163, festival: "governors-ball", day: "sat", artist: "Stray Kids", stage: "verizon", start: 510, end: 585, match: 55, genre: "K-Pop", sounds_like: null, sources: [] },

  // --- Lollapalooza, Saturday August 1, 2026 ---
  { id: 164, festival: "lollapalooza", day: "sat", artist: "Peace Control", stage: "perrys", start: 0, end: 30, match: 42, genre: "Bass", sounds_like: null, sources: [] },
  { id: 165, festival: "lollapalooza", day: "sat", artist: "MC4D", stage: "perrys", start: 45, end: 90, match: 50, genre: "Trap / Bass", sounds_like: null, sources: [] },
  { id: 166, festival: "lollapalooza", day: "sat", artist: "OMNOM", stage: "perrys", start: 105, end: 165, match: 63, genre: "Dubstep", sounds_like: null, sources: [] },
  { id: 167, festival: "lollapalooza", day: "sat", artist: "AYYBO", stage: "perrys", start: 180, end: 240, match: 68, genre: "Hyperpop / Bass", sounds_like: null, sources: [] },
  { id: 168, festival: "lollapalooza", day: "sat", artist: "Whethan", stage: "perrys", start: 255, end: 315, match: 71, genre: "Electropop", sounds_like: "Fits your electropop crossover listening", sources: ["spotify"] },
  { id: 169, festival: "lollapalooza", day: "sat", artist: "Max Styler", stage: "perrys", start: 345, end: 405, match: 74, genre: "Tech House", sounds_like: null, sources: [] },
  { id: 170, festival: "lollapalooza", day: "sat", artist: "Alison Wonderland", stage: "perrys", start: 420, end: 480, match: 85, genre: "Bass / Pop", sounds_like: "Your SoundCloud follows lean into this bass/pop crossover", sources: ["soundcloud"] },
  { id: 171, festival: "lollapalooza", day: "sat", artist: "Disco Lines", stage: "perrys", start: 510, end: 585, match: 84, genre: "Tech House", sounds_like: "You caught them at Electric Forest too", sources: ["soundcloud"] },
  { id: 172, festival: "lollapalooza", day: "sat", artist: "Olivia Dean", stage: "tmobile", start: 510, end: 585, match: 76, genre: "Soul / Pop", sounds_like: null, sources: [] },
  { id: 173, festival: "lollapalooza", day: "sat", artist: "JENNIE", stage: "budlight", start: 535, end: 600, match: 60, genre: "K-Pop", sounds_like: null, sources: [] },

  // --- Outside Lands, Saturday August 8, 2026 ---
  { id: 174, festival: "outside-lands", day: "sat", artist: "Malcolm Todd", stage: "twinpeaks", start: 0, end: 45, match: 64, genre: "Indie Pop", sounds_like: null, sources: [] },
  { id: 175, festival: "outside-lands", day: "sat", artist: "Djo", stage: "landsend", start: 60, end: 105, match: 78, genre: "Indie Rock / Synth Pop", sounds_like: "Fits your synth-pop leaning indie listening", sources: ["spotify"] },
  { id: 176, festival: "outside-lands", day: "sat", artist: "Lucy Dacus", stage: "twinpeaks", start: 120, end: 165, match: 72, genre: "Indie Rock", sounds_like: null, sources: [] },
  { id: 177, festival: "outside-lands", day: "sat", artist: "Ethel Cain", stage: "sutro", start: 180, end: 240, match: 81, genre: "Alt / Gothic Americana", sounds_like: "New territory, close to your slower indie moods", sources: ["soundcloud"] },
  { id: 178, festival: "outside-lands", day: "sat", artist: "Dijon", stage: "sutro", start: 255, end: 300, match: 69, genre: "Alt R&B", sounds_like: null, sources: [] },
  { id: 179, festival: "outside-lands", day: "sat", artist: "The xx", stage: "twinpeaks", start: 310, end: 370, match: 90, genre: "Indie Electronic", sounds_like: "Your #1 most-played artist a few years running", sources: ["spotify", "soundcloud"] },
  { id: 180, festival: "outside-lands", day: "sat", artist: "The Strokes", stage: "landsend", start: 335, end: 395, match: 95, genre: "Rock", sounds_like: "You caught them at Bonnaroo and Coachella — clearly a top artist for you", sources: ["spotify"] },
  { id: 181, festival: "outside-lands", day: "sat", artist: "PinkPantheress", stage: "sutro", start: 345, end: 405, match: 59, genre: "Pop / UK Garage", sounds_like: null, sources: [] },

  // --- Austin City Limits, Friday October 2, 2026 — headliners only; exact
  // set times for 2026 weren't published in public listings at research
  // time, so these three are estimated evening slots on their confirmed
  // real stages, not exact clock times like the other festivals here. ---
  { id: 182, festival: "acl", day: "fri", artist: "Skrillex", stage: "millerlite", start: 120, end: 195, match: 89, genre: "Electronic / Dubstep", sounds_like: "Big part of your electronic listening history", sources: ["spotify"] },
  { id: 183, festival: "acl", day: "fri", artist: "Kings of Leon", stage: "tmobile-acl", start: 120, end: 210, match: 62, genre: "Rock", sounds_like: null, sources: [] },
  { id: 184, festival: "acl", day: "fri", artist: "Charli XCX", stage: "honda", start: 150, end: 225, match: 77, genre: "Pop", sounds_like: null, sources: [] },

  // --- EDC Las Vegas, Friday May 15, 2026 — kineticFIELD's Fisher/Porter
  // Robinson/de Witte order is confirmed real; other stages' set times
  // weren't published with exact clock times at research time, so those
  // are estimated placements on their confirmed real stages. ---
  { id: 185, festival: "edc-vegas", day: "fri", artist: "Fisher", stage: "kineticfield", start: 0, end: 60, match: 88, genre: "Tech House", sounds_like: "One of your most-played dance artists", sources: ["spotify"] },
  { id: 186, festival: "edc-vegas", day: "fri", artist: "Underworld", stage: "cosmicmeadow", start: 60, end: 120, match: 66, genre: "Electronic / Techno Legends", sounds_like: null, sources: [] },
  { id: 187, festival: "edc-vegas", day: "fri", artist: "Porter Robinson", stage: "kineticfield", start: 75, end: 135, match: 91, genre: "Melodic Electronic", sounds_like: "Heavy rotation for you lately", sources: ["spotify", "soundcloud"] },
  { id: 188, festival: "edc-vegas", day: "fri", artist: "Subtronics", stage: "circuitgrounds", start: 90, end: 150, match: 73, genre: "Dubstep", sounds_like: "You caught similar acts at Lost Lands too", sources: ["soundcloud"] },
  { id: 189, festival: "edc-vegas", day: "fri", artist: "Sara Landry", stage: "neongarden", start: 120, end: 180, match: 82, genre: "Techno", sounds_like: "You caught her at Bonnaroo too", sources: ["soundcloud"] },
  { id: 190, festival: "edc-vegas", day: "fri", artist: "Meduza", stage: "cosmicmeadow", start: 150, end: 210, match: 61, genre: "Dance / Pop", sounds_like: null, sources: [] },
  { id: 191, festival: "edc-vegas", day: "fri", artist: "Vintage Culture", stage: "circuitgrounds", start: 180, end: 240, match: 75, genre: "House", sounds_like: "You caught them at Tomorrowland too", sources: ["spotify"] },
  { id: 192, festival: "edc-vegas", day: "fri", artist: "Charlotte de Witte", stage: "kineticfield", start: 150, end: 240, match: 94, genre: "Techno", sounds_like: "Closing kineticFIELD Night 1 — a real highlight for your taste", sources: ["spotify", "soundcloud"] },

  // --- Tomorrowland, Friday July 17, 2026 — Weekend 1, Day 1 ---
  { id: 193, festival: "tomorrowland", day: "fri", artist: "Vintage Culture", stage: "mainstage", start: 0, end: 90, match: 75, genre: "House", sounds_like: "You caught them at EDC too", sources: ["spotify"] },
  { id: 194, festival: "tomorrowland", day: "fri", artist: "Disco Lines", stage: "mainstage", start: 90, end: 150, match: 84, genre: "Tech House", sounds_like: "You caught them at Electric Forest and Lollapalooza too", sources: ["soundcloud"] },
  { id: 195, festival: "tomorrowland", day: "fri", artist: "Bassjackers", stage: "mainstage", start: 150, end: 205, match: 55, genre: "Big Room", sounds_like: null, sources: [] },
  { id: 196, festival: "tomorrowland", day: "fri", artist: "Frank Verstraeten", stage: "freedom", start: 150, end: 240, match: 48, genre: "Techno", sounds_like: null, sources: [] },
  { id: 197, festival: "tomorrowland", day: "fri", artist: "Henri PFR", stage: "mainstage", start: 210, end: 270, match: 63, genre: "Melodic Techno", sounds_like: null, sources: [] },
  { id: 198, festival: "tomorrowland", day: "fri", artist: "Max Styler", stage: "freedom", start: 240, end: 330, match: 74, genre: "Tech House", sounds_like: "You caught them at Lollapalooza too", sources: ["spotify"] },
  { id: 199, festival: "tomorrowland", day: "fri", artist: "NERVO", stage: "mainstage", start: 270, end: 335, match: 58, genre: "Electro House", sounds_like: null, sources: [] },
  { id: 200, festival: "tomorrowland", day: "fri", artist: "Miss Monique", stage: "freedom", start: 330, end: 420, match: 79, genre: "Melodic Techno", sounds_like: "New territory, close to your melodic electronic taste", sources: ["soundcloud"] },
  { id: 201, festival: "tomorrowland", day: "fri", artist: "Marlon Hoffstadt", stage: "mainstage", start: 335, end: 395, match: 52, genre: "Tech House", sounds_like: null, sources: [] },
  { id: 202, festival: "tomorrowland", day: "fri", artist: "Mind Against", stage: "freedom", start: 420, end: 510, match: 86, genre: "Melodic Techno", sounds_like: "Heavy rotation for you lately", sources: ["spotify", "soundcloud"] },
  { id: 203, festival: "tomorrowland", day: "fri", artist: "NOVAH", stage: "mainstage", start: 395, end: 460, match: 60, genre: "Progressive House", sounds_like: null, sources: [] },
  { id: 204, festival: "tomorrowland", day: "fri", artist: "The Chainsmokers", stage: "mainstage", start: 460, end: 525, match: 68, genre: "EDM Pop", sounds_like: null, sources: [] },
  { id: 205, festival: "tomorrowland", day: "fri", artist: "4444 of a Kind", stage: "freedom", start: 510, end: 570, match: 57, genre: "Techno", sounds_like: null, sources: [] },
  { id: 206, festival: "tomorrowland", day: "fri", artist: "Sebastian Ingrosso", stage: "mainstage", start: 525, end: 585, match: 65, genre: "Progressive House", sounds_like: null, sources: [] },
  { id: 207, festival: "tomorrowland", day: "fri", artist: "Holy Priest", stage: "freedom", start: 570, end: 660, match: 71, genre: "Techno", sounds_like: null, sources: [] },
  { id: 208, festival: "tomorrowland", day: "fri", artist: "Martin Garrix", stage: "mainstage", start: 585, end: 660, match: 80, genre: "Progressive House / EDM", sounds_like: "Closing Mainstage — a genuine highlight for your taste", sources: ["spotify"] },

  // --- Lost Lands, Friday September 18, 2026 — real 2026 lineup; exact
  // stage assignments and set times weren't published at research time
  // beyond Excision's confirmed 2-hour solo set, so placements here are
  // estimated on real, confirmed stage names (Crater is real; Mainstage
  // is the festival's standard main stage naming). ---
  { id: 209, festival: "lost-lands", day: "fri", artist: "Excision", stage: "ll-mainstage", start: 0, end: 120, match: 93, genre: "Dubstep", sounds_like: "A heavy part of your bass rotation", sources: ["spotify", "soundcloud"] },
  { id: 210, festival: "lost-lands", day: "fri", artist: "Subtronics", stage: "crater", start: 60, end: 120, match: 73, genre: "Dubstep", sounds_like: "You caught them at EDC too", sources: ["soundcloud"] },
  { id: 211, festival: "lost-lands", day: "fri", artist: "Wooli", stage: "ll-mainstage", start: 150, end: 210, match: 68, genre: "Dubstep / Riddim", sounds_like: null, sources: [] },
  { id: 212, festival: "lost-lands", day: "fri", artist: "Ganja White Night", stage: "crater", start: 150, end: 210, match: 81, genre: "Dubstep", sounds_like: "You caught them at Electric Forest too", sources: ["soundcloud"] },
  { id: 213, festival: "lost-lands", day: "fri", artist: "Seven Lions", stage: "ll-mainstage", start: 240, end: 300, match: 86, genre: "Melodic Dubstep", sounds_like: "Fits your melodic bass listening well", sources: ["spotify"] },
  { id: 214, festival: "lost-lands", day: "fri", artist: "ALLEYCVT", stage: "crater", start: 240, end: 300, match: 62, genre: "Bass", sounds_like: "You caught them at Electric Forest too", sources: ["soundcloud"] },
  { id: 215, festival: "lost-lands", day: "fri", artist: "Flux Pavilion", stage: "crater", start: 330, end: 390, match: 71, genre: "Dubstep", sounds_like: null, sources: [] },

  // --- Ultra Miami, Friday March 27, 2026 — start times are Ultra's own
  // published 2026 set times (Miami New Times); end times are derived from
  // the next confirmed set on the same stage, since Ultra's release only
  // listed start times. ---
  { id: 216, festival: "ultra-miami", day: "fri", artist: "Illenium", stage: "main", start: 180, end: 245, match: null, genre: "Melodic Dubstep", sounds_like: null, sources: [] },
  { id: 217, festival: "ultra-miami", day: "fri", artist: "Bzrp", stage: "main", start: 245, end: 320, match: null, genre: "Latin Electronic", sounds_like: null, sources: [] },
  { id: 218, festival: "ultra-miami", day: "fri", artist: "Vini Vici", stage: "worldwide", start: 180, end: 240, match: null, genre: "Psytrance", sounds_like: null, sources: [] },
  { id: 219, festival: "ultra-miami", day: "fri", artist: "Armin van Buuren B2B Marlon Hoffstadt", stage: "worldwide", start: 300, end: 390, match: null, genre: "Trance", sounds_like: null, sources: [] },

  // --- Ultra Europe, Friday July 10, 2026 — real, fully-confirmed start AND
  // end times from Ultra Europe's own published 2026 set times
  // (ultraeurope.com, via CULTR's coverage). ---
  { id: 220, festival: "ultra-europe", day: "fri", artist: "Subtronics", stage: "main", start: 130, end: 195, match: null, genre: "Dubstep", sounds_like: null, sources: [] },
  { id: 221, festival: "ultra-europe", day: "fri", artist: "Oliver Heldens", stage: "main", start: 195, end: 275, match: null, genre: "Future House", sounds_like: null, sources: [] },
  { id: 222, festival: "ultra-europe", day: "fri", artist: "Miss Monique", stage: "resistance", start: 180, end: 300, match: null, genre: "Melodic Techno", sounds_like: null, sources: [] },
  { id: 223, festival: "ultra-europe", day: "fri", artist: "Adam Beyer", stage: "resistance", start: 300, end: 420, match: null, genre: "Techno", sounds_like: null, sources: [] },

  // --- Tomorrowland Winter 2026 — each pairing's day + stage is real and
  // confirmed (DJ Mag's lineup coverage), but exact set-time clocks weren't
  // published in the sources found, so these are estimated slots on the
  // confirmed real Orbyz stage, not exact confirmed times. ---
  { id: 243, festival: "tomorrowland-winter", day: "sat", artist: "Oliver Heldens' HI-LO b2b Maddix", stage: "orbyz", start: 180, end: 240, match: null, genre: "House", sounds_like: null, sources: [] },
  { id: 244, festival: "tomorrowland-winter", day: "sun", artist: "Nervo b2b MATTN", stage: "orbyz", start: 180, end: 240, match: null, genre: "Electro House", sounds_like: null, sources: [] },
  { id: 245, festival: "tomorrowland-winter", day: "sun", artist: "Dimitri Vegas b2b Steve Aoki", stage: "orbyz", start: 240, end: 300, match: null, genre: "Big Room / EDM", sounds_like: null, sources: [] },

  // --- EDC Orlando 2026 — each artist's headlining day is real and
  // confirmed (gottagoorlando.com's lineup-by-day coverage), but exact
  // set-time clocks aren't published yet (event is Nov 2026), so these are
  // estimated closing-set slots on the confirmed real kineticFIELD stage,
  // not exact confirmed times. ---
  { id: 246, festival: "edc-orlando", day: "fri", artist: "David Guetta", stage: "kineticfield", start: 240, end: 330, match: null, genre: "House / EDM", sounds_like: null, sources: [] },
  { id: 247, festival: "edc-orlando", day: "sat", artist: "Kaskade", stage: "kineticfield", start: 240, end: 330, match: null, genre: "Progressive House", sounds_like: null, sources: [] },
  { id: 248, festival: "edc-orlando", day: "sun", artist: "Martin Garrix", stage: "kineticfield", start: 150, end: 240, match: null, genre: "Progressive House / EDM", sounds_like: null, sources: [] },
  { id: 249, festival: "edc-orlando", day: "sun", artist: "Hardwell", stage: "kineticfield", start: 240, end: 330, match: null, genre: "Big Room / EDM", sounds_like: null, sources: [] },

  // --- EDC Mexico 2026 — Chris Lake and Charlotte de Witte's circuitGROUNDS
  // times are real and fully confirmed (pulseoftechno.com / 1001tracklists
  // coverage); Anyma's kineticFIELD closing set on Sunday is a confirmed
  // real day+stage pairing but an estimated time, since an exact clock time
  // wasn't published in the sources found. ---
  { id: 250, festival: "edc-mexico", day: "fri", artist: "Chris Lake", stage: "circuitgrounds", start: 390, end: 480, match: null, genre: "Tech House", sounds_like: null, sources: [] },
  { id: 251, festival: "edc-mexico", day: "fri", artist: "Charlotte de Witte", stage: "circuitgrounds", start: 510, end: 600, match: null, genre: "Techno", sounds_like: null, sources: [] },
  { id: 252, festival: "edc-mexico", day: "sun", artist: "Anyma", stage: "kineticfield", start: 390, end: 450, match: null, genre: "Melodic Techno / Audiovisual", sounds_like: null, sources: [] },

  // --- Lollapalooza Argentina 2026 — start times are real and confirmed
  // (perfil.com / lanacion.com.ar's published day-by-day schedules); end
  // times are estimated typical set lengths since exact end times weren't
  // published in the sources found. ---
  { id: 253, festival: "lollapalooza-argentina", day: "fri", artist: "Lorde", stage: "samsung", start: 120, end: 165, match: null, genre: "Art Pop", sounds_like: null, sources: [] },
  { id: 254, festival: "lollapalooza-argentina", day: "fri", artist: "Tyler, The Creator", stage: "flow", start: 195, end: 270, match: null, genre: "Hip-Hop", sounds_like: null, sources: [] },
  { id: 255, festival: "lollapalooza-argentina", day: "sun", artist: "Interpol", stage: "alternative", start: 0, end: 60, match: null, genre: "Post-Punk", sounds_like: null, sources: [] },
  { id: 256, festival: "lollapalooza-argentina", day: "sun", artist: "Sabrina Carpenter", stage: "flow", start: 195, end: 270, match: null, genre: "Pop", sounds_like: null, sources: [] },

  // --- Lollapalooza Berlin, Saturday July 18 2026 — real, fully-confirmed
  // start AND end times (timeout.com / festivawl.com's published 2026 set
  // times, all on the Essence Stage). ---
  { id: 257, festival: "lollapalooza-berlin", day: "sat", artist: "Balu Brigada", stage: "essence", start: 90, end: 130, match: null, genre: "Electropop", sounds_like: null, sources: [] },
  { id: 258, festival: "lollapalooza-berlin", day: "sat", artist: "Young Miko", stage: "essence", start: 180, end: 225, match: null, genre: "Reggaeton / Latin Trap", sounds_like: null, sources: [] },
  { id: 259, festival: "lollapalooza-berlin", day: "sat", artist: "Tom Odell", stage: "essence", start: 280, end: 335, match: null, genre: "Piano Pop", sounds_like: null, sources: [] },
  { id: 260, festival: "lollapalooza-berlin", day: "sat", artist: "Zara Larsson", stage: "essence", start: 405, end: 465, match: null, genre: "Pop", sounds_like: null, sources: [] },
  { id: 261, festival: "lollapalooza-berlin", day: "sat", artist: "Pitbull", stage: "essence", start: 565, end: 655, match: null, genre: "Pop / Latin Hip-Hop", sounds_like: null, sources: [] },
];

const FRIENDS = [
  { id: "mia", name: "Mia", initial: "M", color: "#FF3DA6", sharingOn: true },
  { id: "jax", name: "Jax", initial: "J", color: "#FFB23D", sharingOn: true },
  { id: "theo", name: "Theo", initial: "T", color: "#9D6BFF", sharingOn: false },
];

// Seed DM history per friend — 'you' | 'them' plus a timestamp label. New
// messages sent in-session get appended on top of this in component state.
const DM_THREADS = {
  mia: [
    { id: "m1", from: "them", text: "yo are we still meeting at the camp pin before OBSIDIAN closes", time: "1h ago" },
    { id: "m2", from: "you", text: "yeah I'll be there, running a bit behind rn", time: "52m ago" },
    { id: "m3", from: "them", text: "no worries, we're grabbing food near Plaza 2 first anyway", time: "48m ago" },
  ],
  jax: [
    { id: "j1", from: "them", text: "bro Wet Leg was insane, wish you caught it", time: "3h ago" },
    { id: "j2", from: "you", text: "I KNOW I saw the clips, so mad I missed it", time: "3h ago" },
  ],
  theo: [
    { id: "t1", from: "you", text: "you still coming through tonight or nah", time: "5h ago" },
  ],
};

// Pool the "Simulate a notification" button picks from — stands in for
// server-side events (a DM, an artist post, a set reminder) until those
// are real.
const NOTIFICATION_POOL = [
  { type: "set", title: "OBSIDIAN starts in 15 minutes", body: "What Stage · your #1 match tonight" },
  { type: "artist", title: "RÜFÜS DU SOL posted an update", body: "Closing set is a full production reset — new visuals, new edits" },
  { type: "dm", title: "New message from Jax", body: "where you at, we're by the water refill" },
  { type: "community", title: "Your crew is talking", body: "3 new replies in a thread you posted" },
];

const FRIEND_MATCHES = {
  3: { theo: 76 },
  6: { mia: 71 },
  9: { jax: 82, mia: 68 },
  10: { mia: 95, jax: 89, theo: 90 },
  11: { mia: 84, theo: 79 },
  13: { jax: 77 },
  15: { mia: 99, jax: 96, theo: 93 },
  16: { mia: 90, jax: 85, theo: 88 },
  24: { theo: 80 },
  28: { mia: 88 },
  33: { mia: 96, jax: 91, theo: 94 },
  37: { mia: 85, jax: 79 },
  43: { jax: 80 },
  46: { mia: 92, jax: 87, theo: 90 },
};

const ME = {
  name: "Will",
  handle: "@willrides",
  connections: {
    spotify: { connected: true, label: "Top genre: Indie Rock" },
    soundcloud: { connected: true, label: "38 tracks liked this year" },
  },
  discoveredCount: 0, // updated live from addedFromDiscover.length
};

// Generic festival-day essentials — applies regardless of which festival is
// active, so it lives on Home rather than duplicated per festival.
const MUST_HAVES = [
  { id: "water", label: "Reusable water bottle" },
  { id: "sunscreen", label: "Sunscreen" },
  { id: "earplugs", label: "Earplugs" },
  { id: "charger", label: "Portable phone charger" },
  { id: "id", label: "ID + wristband/ticket" },
  { id: "cash", label: "Small bills for cash-only vendors" },
  { id: "shoes", label: "Broken-in shoes" },
  { id: "bandana", label: "Bandana or face covering (dust)" },
  { id: "rain", label: "Poncho or rain layer" },
  { id: "firstaid", label: "Pain reliever + blister pads" },
  { id: "ziploc", label: "Ziploc bag for phone/valuables" },
];

// Real, general safety resources plus mocked on-site locations tied to the
// map data we already have (Centeroo/Outeroo). Always reachable from the
// header, not buried in a tab — emergencies don't wait for navigation.
const SAFETY_INFO = {
  medical: [
    { name: "Centeroo Medical", note: "Near What Stage, marked with a red cross flag" },
    { name: "Outeroo Medical — Plaza 6", note: "24/7, closest to camping" },
  ],
  lostProtocol: [
    "Go to the nearest info booth or medical tent — staff can page over the PA.",
    "Share your camp pin location with your crew from the Map tab.",
    "Set a backup meetup spot with your crew before you split up each day.",
  ],
  resources: [
    { label: "911", note: "Life-threatening emergency", tel: "911" },
    { label: "988 Suicide & Crisis Lifeline", note: "Call or text, 24/7", tel: "988" },
    { label: "Crisis Text Line", note: "Text HOME to 741741", tel: null },
  ],
};

const PENDING_INVITES = [
  { id: "i1", label: "sent to @ravecat", status: "pending" },
  { id: "i2", label: "link shared in group chat", status: "1 joined" },
];

// Bonnaroo's real campground naming: the stages sit in "Centeroo," the
// surrounding campgrounds are "Outeroo," organized into numbered "Plazas"
// (community hubs with restrooms/showers/medical) plus Moon Colony for car
// camping. Coachella's grounds don't use those terms — it's the Empire Polo
// Club, with camping split into General/Preferred car camping, Tent
// Camping, the 18+ Lake Eldorado area, and the Safari Campground. Exact
// plot layouts aren't public for either, so these are simplified schematics
// using each festival's real zone names rather than actual-scale maps.
const FESTIVAL_CAMP_ZONES = {
  bonnaroo: [
    { id: "p2", name: "Plaza 2", x: 30, y: 255, w: 110, h: 90 },
    { id: "p3", name: "Plaza 3", x: 155, y: 255, w: 110, h: 90 },
    { id: "p9", name: "Plaza 9", x: 280, y: 255, w: 110, h: 90 },
    { id: "moon", name: "Moon Colony (car camping)", x: 30, y: 360, w: 360, h: 55 },
    { id: "p6", name: "Plaza 6", x: 30, y: 430, w: 360, h: 22 },
  ],
  coachella: [
    { id: "general", name: "General Car Camping", x: 30, y: 255, w: 170, h: 70 },
    { id: "preferred", name: "Preferred Camping", x: 220, y: 255, w: 170, h: 70 },
    { id: "tent", name: "Tent Camping", x: 30, y: 335, w: 110, h: 55 },
    { id: "safari", name: "Safari Campground", x: 155, y: 335, w: 115, h: 55 },
    { id: "eldorado", name: "Lake Eldorado (18+)", x: 280, y: 335, w: 110, h: 55 },
  ],
  "electric-forest": [
    { id: "mainstreet", name: "Main Street (GA)", x: 30, y: 255, w: 170, h: 70 },
    { id: "maplewoods", name: "Maplewoods", x: 220, y: 255, w: 170, h: 70 },
    { id: "camphush", name: "Camp Hush (quiet)", x: 30, y: 335, w: 115, h: 55 },
    { id: "goodlife", name: "Good Life Village (VIP)", x: 155, y: 335, w: 115, h: 55 },
    { id: "back40", name: "Back 40 (RV)", x: 280, y: 335, w: 110, h: 55 },
  ],
  tomorrowland: [
    { id: "maggreens", name: "Magnificent Greens (GA)", x: 30, y: 255, w: 170, h: 70 },
    { id: "easytent", name: "Easy Tent (pre-pitched)", x: 220, y: 255, w: 170, h: 70 },
    { id: "friendship", name: "Friendship Garden (groups of 10)", x: 30, y: 335, w: 170, h: 55 },
    { id: "dreamlodges", name: "Dreamlodges (luxury)", x: 220, y: 335, w: 170, h: 55 },
  ],
  "lost-lands": [
    { id: "ga-tent", name: "GA Tent Camping", x: 30, y: 255, w: 170, h: 70 },
    { id: "rv", name: "RV Camping", x: 220, y: 255, w: 170, h: 70 },
    { id: "forest", name: "Forest Camping", x: 30, y: 335, w: 170, h: 55 },
    { id: "glamping", name: "Jurrasic Glamping", x: 220, y: 335, w: 170, h: 55 },
  ],
};

const FESTIVAL_MAP_LABELS = {
  bonnaroo: { stages: "CENTEROO", camp: "OUTEROO — CAMPGROUNDS" },
  coachella: { stages: "FESTIVAL GROUNDS", camp: "CAMPING — EMPIRE POLO CLUB" },
  "electric-forest": { stages: "STAGES", camp: "CAMPGROUNDS — DOUBLE JJ RESORT" },
  tomorrowland: { stages: "FESTIVAL GROUNDS", camp: "DREAMVILLE — CAMPGROUNDS" },
  "lost-lands": { stages: "STAGES", camp: "CAMPGROUNDS — LEGEND VALLEY" },
  "ultra-miami": { stages: "BAYFRONT PARK" },
  "ultra-europe": { stages: "PARK MLADEŽI" },
  "tomorrowland-winter": { stages: "ALPE D'HUEZ" },
  "edc-orlando": { stages: "TINKER FIELD" },
  "edc-mexico": { stages: "AUTÓDROMO HERMANOS RODRÍGUEZ" },
  "lollapalooza-argentina": { stages: "HIPÓDROMO DE SAN ISIDRO" },
  "lollapalooza-berlin": { stages: "OLYMPIAPARK" },
};

// Each festival's own official published grounds map, saved locally
// under public/festival-maps. Two are the best currently-available
// official asset rather than the ideal one — flagged with `note` so the
// UI can be upfront about it instead of silently passing off a stand-in
// as current:
// - ACL: 2026 hasn't published a map yet (festival is Oct 2026); this is
//   last year's official map, per ACL's own support site.
// - Lost Lands: the full stages/grounds map is only released via the
//   festival app about a week out; this is the camping-only map, the one
//   real official graphic public this far ahead of the Sept 2026 event.
const FESTIVAL_MAP_IMAGES = {
  bonnaroo: { src: "/festival-maps/bonnaroo.jpg", year: 2026 },
  coachella: { src: "/festival-maps/coachella.jpg", year: 2026 },
  "edc-vegas": { src: "/festival-maps/edc-vegas.jpg", year: 2026 },
  "electric-forest": { src: "/festival-maps/electric-forest.jpg", year: 2026 },
  "governors-ball": { src: "/festival-maps/governors-ball.jpg", year: 2026 },
  lollapalooza: { src: "/festival-maps/lollapalooza.jpg", year: 2026 },
  "outside-lands": { src: "/festival-maps/outside-lands.jpg", year: 2026 },
  acl: { src: "/festival-maps/acl.jpg", year: 2025, note: "2026's map isn't published yet — this is last year's official map." },
  tomorrowland: { src: "/festival-maps/tomorrowland.jpg", year: 2026 },
  "lost-lands": { src: "/festival-maps/lost-lands.jpg", year: 2026, note: "Camping map only — the full grounds map drops via the festival app about a week before the event." },
  "ultra-miami": { src: "/festival-maps/ultra-miami.jpg", year: 2026 },
  "ultra-europe": { src: "/festival-maps/ultra-europe.jpg", year: 2026 },
  "edc-orlando": { src: "/festival-maps/edc-orlando.jpg", year: 2025, note: "2026's map isn't published yet (event is Nov 2026) — this is last year's official map." },
  "edc-mexico": { src: "/festival-maps/edc-mexico.jpg", year: 2026 },
  "lollapalooza-argentina": { src: "/festival-maps/lollapalooza-argentina.jpg", year: 2026 },
  "lollapalooza-berlin": { src: "/festival-maps/lollapalooza-berlin.jpg", year: 2026 },
};

// Verified artist posts — visually distinct from crowd posts, always pinned
// to the top of Community regardless of sort. `artistOf` links back to a
// SETS id so the schedule can show a small "artist posted" indicator.
// Verification status per artist, keyed by their SETS id. Only 'verified'
// artists can post to Community or unlock exclusive content — this is what
// stops anyone from posting as "GRiZ" without proof it's actually them.
const ARTIST_VERIFICATION = {
  15: "verified", // GRiZ — Bonnaroo
  10: "verified", // Wet Leg — Bonnaroo Fri
  16: "pending",  // The Strokes — Bonnaroo, claim submitted, still under review
  13: "unclaimed", // Yungblud — Bonnaroo
  6: "unclaimed",  // Amble — Bonnaroo
  33: "verified", // RÜFÜS DU SOL — Bonnaroo
  46: "pending",  // Noah Kahan — Bonnaroo
  28: "unclaimed", // Alabama Shakes — Bonnaroo
  61: "verified", // The xx — Coachella Fri
  82: "verified", // Wet Leg — Coachella Sun
  140: "verified", // Excision — Electric Forest
  161: "verified", // Wet Leg — Governors Ball
  171: "verified", // Disco Lines — Lollapalooza
  180: "verified", // The Strokes — Outside Lands
  182: "verified", // Skrillex — ACL
  192: "verified", // Charlotte de Witte — EDC Las Vegas
  208: "verified", // Martin Garrix — Tomorrowland
  209: "verified", // Excision — Lost Lands
};

const ARTIST_POSTS = [
  {
    id: "a1",
    festival: "bonnaroo",
    artist: "GRiZ",
    artistOf: 15,
    title: "What Stage tonight is going to be a bass-heavy one, bring your energy",
    time: "3h ago",
    votes: 512,
  },
  {
    id: "a2",
    festival: "bonnaroo",
    artist: "Wet Leg",
    artistOf: 10,
    title: "Playing a couple new ones off the next record for the first time live",
    time: "6h ago",
    votes: 388,
  },
  {
    id: "a3",
    festival: "bonnaroo",
    artist: "RÜFÜS DU SOL",
    artistOf: 33,
    title: "Closing set Saturday is a full production reset — new visuals, new edits",
    time: "1d ago",
    votes: 640,
  },
  {
    id: "a4",
    festival: "coachella",
    artist: "The xx",
    artistOf: 61,
    title: "Tonight's set has a couple surprises we've been saving for the desert",
    time: "5h ago",
    votes: 470,
  },
  {
    id: "a5",
    festival: "coachella",
    artist: "Wet Leg",
    artistOf: 82,
    title: "Closing weekend one with a couple songs we've never played live before",
    time: "2h ago",
    votes: 355,
  },
  {
    id: "a6",
    festival: "electric-forest",
    artist: "Excision",
    artistOf: 140,
    title: "Ranch Arena closer tonight is the full audiovisual show, come early for a spot",
    time: "4h ago",
    votes: 590,
  },
  {
    id: "a7",
    festival: "governors-ball",
    artist: "Wet Leg",
    artistOf: 161,
    title: "First NYC show of the tour, we're bringing out all the stops",
    time: "3h ago",
    votes: 310,
  },
  {
    id: "a8",
    festival: "lollapalooza",
    artist: "Disco Lines",
    artistOf: 171,
    title: "Perry's closing set tonight is a back-to-back-heavy one, bring energy",
    time: "6h ago",
    votes: 275,
  },
  {
    id: "a9",
    festival: "outside-lands",
    artist: "The Strokes",
    artistOf: 180,
    title: "Golden Gate Park closer — expect a couple deep cuts we haven't played in years",
    time: "5h ago",
    votes: 420,
  },
  {
    id: "a10",
    festival: "acl",
    artist: "Skrillex",
    artistOf: 182,
    title: "Miller Lite set tonight is a brand new production, first time anywhere",
    time: "2h ago",
    votes: 380,
  },
  {
    id: "a11",
    festival: "edc-vegas",
    artist: "Charlotte de Witte",
    artistOf: 192,
    title: "Closing kineticFIELD Night 1 with a set built specifically for this stage",
    time: "1h ago",
    votes: 615,
  },
  {
    id: "a12",
    festival: "tomorrowland",
    artist: "Martin Garrix",
    artistOf: 208,
    title: "Closing Mainstage Day 1 — bringing back a few classics for this one",
    time: "3h ago",
    votes: 705,
  },
  {
    id: "a13",
    festival: "lost-lands",
    artist: "Excision",
    artistOf: 209,
    title: "Two-hour solo set tonight, full dinosaur production, don't be late",
    time: "4h ago",
    votes: 560,
  },
];

// Exclusive content unlocked for fans with a high enough match score —
// shown in the set detail sheet, not the community board.
const ARTIST_EXCLUSIVES = {
  15: { unlockAt: 90, text: "Set is leaning heavier into the funk material tonight — expect a longer live band segment mid-set." },
  16: { unlockAt: 85, text: "Closing on a deep cut they haven't played live in a few tours." },
  10: { unlockAt: 85, text: "Two unreleased songs going in early in the set, right after the opener." },
  33: { unlockAt: 90, text: "Opening on a brand new intro built specifically for this closing slot." },
  61: { unlockAt: 85, text: "Setlist has been reworked specifically for this desert run — a few surprises planned." },
  82: { unlockAt: 90, text: "Closing the set with a song that's never been played live before." },
  140: { unlockAt: 90, text: "Full visual production tonight, different from the standard touring show." },
  161: { unlockAt: 85, text: "Adding a cover into the set for the first time this tour." },
  171: { unlockAt: 80, text: "Set is built around unreleased edits made specifically for Perry's." },
  180: { unlockAt: 90, text: "Closing with a deep cut they haven't played live in years." },
  182: { unlockAt: 85, text: "Brand new production debuting tonight, first time anywhere." },
  192: { unlockAt: 90, text: "Set built specifically for kineticFIELD's scale — different from the club version." },
  208: { unlockAt: 75, text: "Bringing back a few older tracks not usually in the current setlist." },
  209: { unlockAt: 90, text: "Full two-hour production with new visuals debuting tonight." },
};

const FLAIRS = {
  meetup: { label: "Meetup", color: "#3DF2E0" },
  tips: { label: "Tips", color: "#FFB23D" },
  lost: { label: "Lost & Found", color: "#FF3DA6" },
  vibes: { label: "Vibes", color: "#9D6BFF" },
  sets: { label: "Set Times", color: "#5FD97A" },
};

const FESTIVAL_POSTS = {
  bonnaroo: [
    { id: "bp1", flair: "meetup", title: "Anyone doing a watch party for GRiZ's What Stage closer tonight?", author: "nightowl_kai", votes: 142, time: "2h ago",
      comments: [
        { id: "bc1", author: "sunset_mira", text: "We're grabbing a spot near the sound tower about 40 min early, come through", votes: 18 },
        { id: "bc2", author: "basshead22", text: "Following this, last year's crowd for that set was insane", votes: 9 },
      ] },
    { id: "bp2", flair: "tips", title: "PSA: the water refill near Plaza 2 has way shorter lines than Centeroo", author: "hydro_homie", votes: 289, time: "4h ago",
      comments: [{ id: "bc3", author: "ravecat", text: "Can confirm, saved me 20 min yesterday", votes: 22 }] },
    { id: "bp3", flair: "lost", title: "Found a rose gold ring near Which Stage entrance Friday night", author: "goodsamaritan_dj", votes: 61, time: "18h ago",
      comments: [{ id: "bc4", author: "lostit_help", text: "Try posting in lost & found booth too, they log everything", votes: 5 }] },
    { id: "bp4", flair: "sets", title: "Noah Kahan just got moved up 30 min on the app, heads up", author: "scheduleupdates", votes: 94, time: "1h ago", comments: [] },
    { id: "bp5", flair: "vibes", title: "RÜFÜS DU SOL's closing set on What Stage... no words", author: "melodic_wanderer", votes: 210, time: "9h ago",
      comments: [
        { id: "bc5", author: "dreamstate_", text: "One of those core memory moments honestly", votes: 14 },
        { id: "bc6", author: "nightowl_kai", text: "I teared up not gonna lie", votes: 11 },
      ] },
  ],
  coachella: [
    { id: "cp1", flair: "meetup", title: "Squad meeting by the Ferris wheel before Anyma's ÆDEN debut", author: "desertdaze", votes: 118, time: "3h ago", comments: [] },
    { id: "cp2", flair: "tips", title: "Shade structures near Gobi are a lifesaver during the 2-4pm heat", author: "polocamper", votes: 176, time: "5h ago",
      comments: [{ id: "cc1", author: "sunscreen_ss", text: "Bring electrolytes too, dehydration hits fast out there", votes: 12 }] },
    { id: "cp3", flair: "lost", title: "Lost a blue bandana near Sahara Saturday, has sentimental value", author: "ravekid22", votes: 34, time: "20h ago", comments: [] },
    { id: "cp4", flair: "vibes", title: "Wet Leg absolutely went off on the Coachella Stage", author: "indiehead", votes: 265, time: "8h ago",
      comments: [{ id: "cc2", author: "shoegaze4life", text: "Best surprise of the whole weekend for me", votes: 19 }] },
  ],
  "electric-forest": [
    { id: "efp1", flair: "meetup", title: "Meeting my crew at the mushroom sculpture before Excision", author: "forestfam", votes: 95, time: "2h ago", comments: [] },
    { id: "efp2", flair: "vibes", title: "The Sherwood Forest art hits completely different after 11pm, don't skip it", author: "glowstick_gwen", votes: 187, time: "6h ago",
      comments: [{ id: "efc1", author: "treehugger99", text: "Genuinely one of the best parts of the whole weekend", votes: 15 }] },
    { id: "efp3", flair: "lost", title: "Found car keys with a dinosaur keychain near Tripolee", author: "goodsamaritan2", votes: 28, time: "16h ago", comments: [] },
  ],
  "governors-ball": [
    { id: "gp1", flair: "tips", title: "Flushing Meadows gets packed fast near Verizon stage, get there early for Stray Kids", author: "queens_local", votes: 134, time: "3h ago", comments: [] },
    { id: "gp2", flair: "vibes", title: "Wet Leg on The Grove was the highlight of my whole weekend", author: "nyc_festgoer", votes: 156, time: "5h ago", comments: [] },
    { id: "gp3", flair: "lost", title: "Found a NYC MetroCard wallet near the Snapchat stage", author: "subway_samaritan", votes: 22, time: "12h ago", comments: [] },
  ],
  lollapalooza: [
    { id: "lp1", flair: "meetup", title: "Anyone doing all of Perry's today? Let's link up near the entrance", author: "chicago_raver", votes: 88, time: "1h ago", comments: [] },
    { id: "lp2", flair: "tips", title: "Grant Park shade is scarce, bring an umbrella for the T-Mobile side", author: "loop_local", votes: 121, time: "4h ago", comments: [] },
    { id: "lp3", flair: "vibes", title: "Olivia Dean's Lolla debut had the whole crowd in tears", author: "artofloving_fan", votes: 199, time: "7h ago", comments: [] },
  ],
  "outside-lands": [
    { id: "olp1", flair: "tips", title: "Golden Gate Park fog rolls in around sunset, bring a layer for Lands End", author: "fogcity_fest", votes: 143, time: "5h ago", comments: [] },
    { id: "olp2", flair: "vibes", title: "The Strokes closing Lands End was worth the whole ticket", author: "sf_native", votes: 231, time: "8h ago", comments: [] },
    { id: "olp3", flair: "lost", title: "Found a tie-dye jacket near Sutro stage", author: "goldengate_finder", votes: 19, time: "14h ago", comments: [] },
  ],
  acl: [
    { id: "aclp1", flair: "tips", title: "Zilker Park heat is real, hydration stations near Honda stage are clutch", author: "atx_local", votes: 112, time: "3h ago", comments: [] },
    { id: "aclp2", flair: "vibes", title: "Skrillex on Miller Lite was chaos in the best way", author: "sixthstreet", votes: 168, time: "6h ago", comments: [] },
  ],
  "edc-vegas": [
    { id: "edcp1", flair: "meetup", title: "Meeting under the giant owl before Charlotte de Witte closes kineticFIELD", author: "speedway_raver", votes: 156, time: "2h ago", comments: [] },
    { id: "edcp2", flair: "tips", title: "Speedway asphalt gets brutal on your feet, wear real shoes not sandals", author: "vegasveteran", votes: 189, time: "5h ago", comments: [] },
    { id: "edcp3", flair: "vibes", title: "Porter Robinson's set genuinely brought me to tears", author: "kineticfam", votes: 244, time: "7h ago", comments: [] },
  ],
  tomorrowland: [
    { id: "tp1", flair: "meetup", title: "DreamVille crew meeting at the fountain before Garrix closes Mainstage", author: "boom_local", votes: 176, time: "3h ago", comments: [] },
    { id: "tp2", flair: "vibes", title: "Mind Against on Freedom was a religious experience", author: "peoplefamily", votes: 220, time: "6h ago", comments: [] },
    { id: "tp3", flair: "tips", title: "Boom gets packed fast, arrive early for a good Mainstage spot", author: "globaljourney", votes: 141, time: "9h ago", comments: [] },
  ],
  "lost-lands": [
    { id: "llp1", flair: "meetup", title: "Dino squad meeting near the Crater before Excision's set", author: "bassheadohio", votes: 103, time: "2h ago", comments: [] },
    { id: "llp2", flair: "vibes", title: "Seven Lions' return after all these years hit different", author: "legendvalley_vet", votes: 187, time: "6h ago", comments: [] },
    { id: "llp3", flair: "tips", title: "Legend Valley dust is no joke, bring goggles or a bandana", author: "thornvillelocal", votes: 129, time: "8h ago", comments: [] },
  ],
};

const PX_PER_MIN = 4;

// Community tiers — earned from cumulative karma (upvotes received across
// festivals), separate from artist verification. Ordered low to high;
// getTier() picks the highest threshold the user's karma clears.
const TIERS = [
  { id: "newcomer", label: "First Timer", min: 0, color: "#6C6786" },
  { id: "regular", label: "Roo Regular", min: 150, color: "#3DF2E0" },
  { id: "veteran", label: "Farm Veteran", min: 800, color: "#FFB23D" },
  { id: "legend", label: "Roo Legend", min: 3000, color: "#FF3DA6" },
];

function getTier(karma) {
  return [...TIERS].reverse().find((t) => karma >= t.min) || TIERS[0];
}

// Mock cumulative karma per community member — stands in for a real
// lifetime-upvotes count tracked server-side.
const USER_KARMA = {
  you: 340,
  nightowl_kai: 4200,
  sunset_mira: 610,
  basshead22: 95,
  hydro_homie: 1450,
  ravecat: 210,
  goodsamaritan_dj: 40,
  lostit_help: 320,
  scheduleupdates: 2100,
  melodic_wanderer: 880,
  dreamstate_: 60,
  desertdaze: 175,
  polocamper: 920,
  sunscreen_ss: 55,
  ravekid22: 30,
  indiehead: 1340,
  shoegaze4life: 210,
  forestfam: 140,
  glowstick_gwen: 760,
  treehugger99: 90,
  goodsamaritan2: 35,
  queens_local: 480,
  nyc_festgoer: 1050,
  subway_samaritan: 25,
  chicago_raver: 310,
  loop_local: 690,
  artofloving_fan: 155,
  fogcity_fest: 505,
  sf_native: 3100,
  goldengate_finder: 45,
  atx_local: 260,
  sixthstreet: 830,
  speedway_raver: 195,
  vegasveteran: 2600,
  kineticfam: 415,
  boom_local: 570,
  peoplefamily: 1180,
  globaljourney: 300,
  bassheadohio: 230,
  legendvalley_vet: 1900,
  thornvillelocal: 640,
};

function fmtTime(offsetMin, dayId = "fri", festivalId = "bonnaroo") {
  const day = ALL_DAYS.find((d) => d.festivalId === festivalId && d.id === dayId) || ALL_DAYS[1];
  const total = day.startMin + offsetMin;
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const hh = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

function matchColor(match) {
  if (match >= 85) return "#3DF2E0";
  if (match >= 60) return "#FFB23D";
  return "#5B5470";
}

const MEMBER_COLORS = ["#3DF2E0", "#FF3DA6", "#9D6BFF", "#FFB23D", "#5FD97A"];
function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}

// Adapts real crew members `{id, name, handle}` into the shape the
// (mock-data-era) CrewCompare/CampMap components expect. Real members won't
// have FRIEND_MATCHES or camp-pin data yet, so those views degrade to "no
// data" for them rather than crashing — that's honest, not a bug.
function toDisplayFriends(members) {
  return (members || []).map((m) => ({ id: m.id, name: m.name, initial: m.name[0].toUpperCase(), color: colorForId(m.id) }));
}

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const voteBtnStyle = { background: "none", border: "none", color: "#5B5470", fontSize: 13, cursor: "pointer", padding: 4, lineHeight: 1 };

// ---------------------------------------------------------------------------
// Icons (simple inline SVG, no external deps)
// ---------------------------------------------------------------------------

// The app's logomark — a prism refracting a single beam into the same
// teal/purple/pink gradient used throughout the app, so the icon and the
// UI feel like one visual language rather than two.
function PrismLogo({ size = 56 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="prismBeamOut" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3DF2E0" />
          <stop offset="55%" stopColor="#9D6BFF" />
          <stop offset="100%" stopColor="#FF3DA6" />
        </linearGradient>
      </defs>
      {/* incoming beam */}
      <line x1="6" y1="50" x2="38" y2="50" stroke="#F5F0FF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      {/* the prism */}
      <polygon points="50,22 74,64 26,64" fill="#171229" stroke="url(#prismBeamOut)" strokeWidth="3" strokeLinejoin="round" />
      {/* refracted rays */}
      <line x1="58" y1="50" x2="94" y2="30" stroke="#3DF2E0" strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="52" x2="94" y2="52" stroke="#9D6BFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="54" x2="94" y2="76" stroke="#FF3DA6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Icon({ name, active }) {
  const c = active ? "#3DF2E0" : "#6C6786";
  const s = { width: 22, height: 22, stroke: c, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "schedule") return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
  if (name === "lineup") return <svg viewBox="0 0 24 24" style={s}><path d="M4 19V9M12 19V4M20 19v12"/></svg>;
  if (name === "crew") return <svg viewBox="0 0 24 24" style={s}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.5.2 4.5 2.4 4.5 5.5"/></svg>;
  if (name === "community") return <svg viewBox="0 0 24 24" style={s}><path d="M4 5h16v10H8l-4 4V5z"/></svg>;
  if (name === "map") return <svg viewBox="0 0 24 24" style={s}><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>;
  if (name === "home") return <svg viewBox="0 0 24 24" style={s}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
  if (name === "messages") return <svg viewBox="0 0 24 24" style={s}><path d="M4 5h16v11H8l-4 4V5z"/></svg>;
  if (name === "bell") return <svg viewBox="0 0 24 24" style={s}><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M9.5 20a2.5 2.5 0 005 0"/></svg>;
  if (name === "verified") return <svg viewBox="0 0 24 24" width="13" height="13" fill="#3DF2E0" style={{ flexShrink: 0 }}><path d="M12 2l2.4 1.4 2.7-.4 1.2 2.5 2.5 1.2-.4 2.7L22 12l-1.6 2.4.4 2.7-2.5 1.2-1.2 2.5-2.7-.4L12 22l-2.4-1.6-2.7.4-1.2-2.5-2.5-1.2.4-2.7L2 12l1.6-2.4-.4-2.7 2.5-1.2 1.2-2.5 2.7.4L12 2z"/><path d="M8.5 12.2l2.3 2.3 4.2-4.7" stroke="#0F0B1A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === "safety") return <svg viewBox="0 0 24 24" style={s}><path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z"/><path d="M12 8v5M12 16.2v.1"/></svg>;
  return null;
}

// ---------------------------------------------------------------------------
// Auth gate — shown instead of the app when there's no signed-in session.
// Passwordless (magic link) so there's no password to manage.
// ---------------------------------------------------------------------------

function SignInScreen({ onSubmit, onVerifyCode, sent, error }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(email.trim());
    setSubmitting(false);
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!code.trim() || verifying) return;
    setVerifying(true);
    await onVerifyCode(email.trim(), code.trim());
    setVerifying(false);
  }

  return (
    <div style={{ minHeight: "100svh", background: "#0F0B1A", color: "#F5F0FF", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", textAlign: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');`}</style>
      <PrismLogo size={56} />
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: "3px", marginTop: 12, background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        PRISM
      </div>

      {sent ? (
        <div style={{ marginTop: 28, width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Check your email</div>
          <p style={{ fontSize: 13, color: "#8B85A3", marginTop: 8, lineHeight: 1.5 }}>
            We sent a code and a link to <span style={{ color: "#F5F0FF" }}>{email}</span>. If this app is on your home screen, type the 6-digit code below instead of tapping the link — the link opens in your regular browser, which won't sign in the home-screen app.
          </p>
          <form onSubmit={handleVerify} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{ width: "100%", background: "#171229", border: "1px solid #2A2440", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontSize: 18, textAlign: "center", letterSpacing: "4px", fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button
              type="submit"
              disabled={verifying}
              style={{ width: "100%", background: "#3DF2E0", border: "none", borderRadius: 10, padding: "12px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14, cursor: verifying ? "default" : "pointer", opacity: verifying ? 0.7 : 1 }}
            >
              {verifying ? "Verifying…" : "Verify code"}
            </button>
            {error && <div style={{ fontSize: 12.5, color: "#FF3DA6" }}>{error}</div>}
          </form>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 28, width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#8B85A3", marginBottom: 4, lineHeight: 1.5 }}>
            Enter your email — we'll send a link to sign in or create your account, no password needed.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: "100%", background: "#171229", border: "1px solid #2A2440", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", background: "#3DF2E0", border: "none", borderRadius: 10, padding: "12px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Sending…" : "Send magic link"}
          </button>
          {error && <div style={{ fontSize: 12.5, color: "#FF3DA6" }}>{error}</div>}
        </form>
      )}
    </div>
  );
}

// First-time setup after a brand new account's first sign-in — magic-link
// auth collects nothing but an email, so this is where a real name and
// handle actually get set. Skipped entirely on every sign-in after this
// one, once profile.onboarded is true.
function OnboardingScreen({ email, onSubmit }) {
  const suggestedHandle = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState(suggestedHandle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !handle.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    const result = await onSubmit(name.trim(), handle.trim().toLowerCase());
    setSubmitting(false);
    if (result?.error) {
      setError(result.error.code === "23505" ? "That handle's taken — try another." : result.error.message);
    }
  }

  return (
    <div style={{ minHeight: "100svh", background: "#0F0B1A", color: "#F5F0FF", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", textAlign: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');`}</style>
      <PrismLogo size={56} />
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "1px", marginTop: 14 }}>
        Welcome to Prism
      </div>
      <p style={{ fontSize: 13, color: "#8B85A3", marginTop: 6, maxWidth: 300, lineHeight: 1.5 }}>
        One last thing before you're in — how should your crew see you?
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 24, width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3" }}>
          Display name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ width: "100%", marginTop: 6, background: "#171229", border: "1px solid #2A2440", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontSize: 14, fontFamily: "'Inter', sans-serif" }}
          />
        </label>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3" }}>
          Handle
          <div style={{ display: "flex", alignItems: "center", marginTop: 6, background: "#171229", border: "1px solid #2A2440", borderRadius: 10, padding: "0 14px" }}>
            <span style={{ color: "#5B5470", fontSize: 14 }}>@</span>
            <input
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="willrides"
              style={{ flex: 1, background: "none", border: "none", padding: "12px 6px", color: "#F5F0FF", fontSize: 14, fontFamily: "'Inter', sans-serif" }}
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{ width: "100%", marginTop: 6, background: "#3DF2E0", border: "none", borderRadius: 10, padding: "12px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
        {error && <div style={{ fontSize: 12.5, color: "#FF3DA6" }}>{error}</div>}
      </form>
    </div>
  );
}

// Bottom sheet for redeeming a crew's invite code — separate from the
// invite sheet above, which only ever shows a code to share, never one to
// enter.
function JoinCrewSheet({ onClose, onSubmit }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    const result = await onSubmit(code.trim());
    setSubmitting(false);
    if (result?.error) setError(result.error.message);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>Join a crew</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "6px 0 16px" }}>
          Enter the code someone shared with you.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC-123"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            style={{ width: "100%", background: "#1A1428", border: "1px solid #2A2440", borderRadius: 12, padding: "12px 14px", color: "#3DF2E0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, letterSpacing: "1.5px" }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", background: "#3DF2E0", border: "none", borderRadius: 10, padding: "12px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Joining…" : "Join"}
          </button>
          {error && <div style={{ fontSize: 12.5, color: "#FF3DA6" }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

// Bottom sheet for starting a DM with someone you don't already have a
// thread with — anyone you share a crew with, across all your crews.
function NewDmPickerSheet({ members, onClose, onPick }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 26, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.5px" }}>New message</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "6px 0 16px" }}>Anyone you share a crew with.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px", background: "transparent", cursor: "pointer" }}
            >
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: colorForId(m.id), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.name[0].toUpperCase()}
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>@{m.handle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function FestivalOptimizer() {
  const { session, profile, authLoading, magicLinkSent, authError, signInWithEmail, verifyCode, signOut, updateProfile } = useAuth();
  const [threshold, setThreshold] = useState(60);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("home"); // home | mine | crew | map | community
  const { packedItems, toggleItem: togglePackedItem } = usePackingState(profile?.id);
  const [mustHavesOpen, setMustHavesOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [newDmPickerOpen, setNewDmPickerOpen] = useState(false);
  const [activeThread, setActiveThread] = useState(null); // friend id, or null for inbox list
  const [sentMessages, setSentMessages] = useState({}); // friendId -> [message, ...]
  const [messageDraft, setMessageDraft] = useState("");
  const [unreadDMs, setUnreadDMs] = useState(["mia"]); // Mia's last message hasn't been seen yet
  const { threads: realThreads, openThreadWith, sendMessage: sendRealMessage } = useDMs(profile?.id);
  const [activeRealThreadId, setActiveRealThreadId] = useState(null);
  const [realMessageDraft, setRealMessageDraft] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null); // File, staged before Send
  const [attachmentError, setAttachmentError] = useState("");
  const [sendingDM, setSendingDM] = useState(false);
  const dmFileInputRef = useRef(null);
  const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
  function handleDmFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError("That file's over 10MB — try a smaller one.");
      return;
    }
    setAttachmentError("");
    setPendingAttachment(file);
  }
  const { notifications, pushNotification: persistNotification, markRead: markNotificationRead } = useNotifications(profile?.id);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const { subscribed: pushSubscribed, subscribe: subscribeToPush, unsubscribe: unsubscribeFromPush } = usePushSubscription(profile?.id);
  const [pushError, setPushError] = useState("");
  // Syncs the toggle to whether a real OS push subscription actually
  // exists, rather than defaulting to "on" and lying about it until the
  // user first touches the toggle.
  useEffect(() => setPushEnabled(pushSubscribed), [pushSubscribed]);
  async function togglePushEnabled() {
    setPushError("");
    if (pushEnabled) {
      await unsubscribeFromPush();
      setPushEnabled(false);
      return;
    }
    const result = await subscribeToPush();
    if (result?.error) {
      setPushError(result.error.message);
      return;
    }
    setPushEnabled(true);
  }
  const [toast, setToast] = useState(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [festivalSearch, setFestivalSearch] = useState("");
  const [activeFriends, setActiveFriends] = useState([]);
  const [sharing, setSharing] = useState(() => Object.fromEntries(FRIENDS.map((f) => [f.id, f.sharingOn])));
  const [revealed, setRevealed] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinCrewOpen, setJoinCrewOpen] = useState(false);
  const [crewActionError, setCrewActionError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [profileEditError, setProfileEditError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  function startEditingProfile() {
    setEditName(profile.name);
    setEditHandle(profile.handle);
    setProfileEditError("");
    setEditingProfile(true);
  }

  async function saveProfileEdits() {
    if (!editName.trim() || !editHandle.trim() || savingProfile) return;
    setSavingProfile(true);
    const result = await updateProfile({ name: editName.trim(), handle: editHandle.trim().toLowerCase() });
    setSavingProfile(false);
    if (result?.error) {
      setProfileEditError(result.error.code === "23505" ? "That handle's taken — try another." : result.error.message);
      return;
    }
    setEditingProfile(false);
  }
  const [claimTarget, setClaimTarget] = useState(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [notifiedCrew, setNotifiedCrew] = useState(false);
  const { crews, createCrew: createCrewRemote, joinCrew, setCrewPersistent: setCrewPersistentRemote } = useCrews(profile?.id);
  const [activeCrewId, setActiveCrewId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedActions, setQueuedActions] = useState(0);
  const [lineupSubview, setLineupSubview] = useState("matches"); // matches | full | discover
  const [addedFromDiscover, setAddedFromDiscover] = useState([]);
  const [currentDay, setCurrentDay] = useState("fri");
  const [currentFestival, setCurrentFestival] = useState(() => localStorage.getItem("prism:lastFestival") || "bonnaroo");
  const [festivalPickerOpen, setFestivalPickerOpen] = useState(false);
  const [officialMapOpen, setOfficialMapOpen] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState({}); // festival id -> true once its image 404s/fails
  const [requestedFestivals, setRequestedFestivals] = useState([]);
  const { byFestival: campPinsByFestival, refresh: refreshCampPins, setMyPin: setMyCampPin, clearMyPin: clearMyCampPin } = useCampPins(profile?.id);
  const [pinPlacing, setPinPlacing] = useState(false);
  const [openMapPin, setOpenMapPin] = useState(null);
  const [pinActionError, setPinActionError] = useState("");

  useEffect(() => {
    localStorage.setItem("prism:lastFestival", currentFestival);
  }, [currentFestival]);

  useEffect(() => {
    if (profile?.id && currentFestival) refreshCampPins(currentFestival);
  }, [profile?.id, currentFestival]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fadeStart = setTimeout(() => setSplashFading(true), 1100);
    const remove = setTimeout(() => setSplashVisible(false), 1450);
    const t = setTimeout(() => setRevealed(true), 1500);
    return () => { clearTimeout(fadeStart); clearTimeout(remove); clearTimeout(t); };
  }, []);

  const activeStages = FESTIVAL_STAGES[currentFestival] || [];
  const activeDays = FESTIVAL_DAYS[currentFestival] || [];
  const festivalCrews = crews.filter((c) => c.festival === currentFestival);
  const activeCrew = crews.find((c) => c.id === activeCrewId) || null;
  // Everyone you share any crew with, deduped — the pool a new DM can
  // start with, regardless of which crew's roster you found them in.
  const allCrewMembers = useMemo(() => {
    const byId = new Map();
    for (const c of crews) for (const m of c.members) byId.set(m.id, m);
    return [...byId.values()];
  }, [crews]);

  // Switching festivals lands you on that festival's first crew (or no
  // crew, if none exist yet there) rather than keeping a crew that belongs
  // to a different festival entirely.
  useEffect(() => {
    if (!activeCrew || activeCrew.festival !== currentFestival) {
      setActiveCrewId(festivalCrews[0]?.id || null);
    }
  }, [currentFestival]); // eslint-disable-line react-hooks/exhaustive-deps

  const crewPersistent = activeCrew ? activeCrew.persistent : true;
  function setCrewPersistent(fn) {
    if (!activeCrew) return;
    const next = typeof fn === "function" ? fn(activeCrew.persistent) : fn;
    setCrewPersistentRemote(activeCrew.id, next);
  }

  // Switching festivals lands you on that festival's first day rather than
  // keeping a day id that may not exist for it.
  useEffect(() => {
    if (activeDays.length && !activeDays.some((d) => d.id === currentDay)) {
      setCurrentDay(activeDays[0].id);
    }
  }, [currentFestival]); // eslint-disable-line react-hooks/exhaustive-deps

  const daySets = useMemo(
    () => SETS.filter((s) => s.festival === currentFestival && s.day === currentDay),
    [currentFestival, currentDay]
  );
  const timelineEnd = useMemo(() => (daySets.length ? Math.max(...daySets.map((s) => s.end)) : 0), [daySets]);

  const conflicts = useMemo(() => {
    const flagged = new Set();
    const strong = daySets.filter((s) => s.match >= threshold).sort((a, b) => a.start - b.start);
    for (let i = 0; i < strong.length; i++) {
      for (let j = i + 1; j < strong.length; j++) {
        const a = strong[i], b = strong[j];
        if (a.stage === b.stage) continue;
        if (a.start < b.end && b.start < a.end) { flagged.add(a.id); flagged.add(b.id); }
      }
    }
    return flagged;
  }, [threshold, daySets]);

  function toggleFriend(id) {
    setActiveFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }
  function toggleSharing(id) {
    setSharing((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function sendMessage(friendId) {
    if (!messageDraft.trim()) return;
    const newMsg = { id: `sent-${Date.now()}`, from: "you", text: messageDraft.trim(), time: isOnline ? "just now" : "queued" };
    setSentMessages((prev) => ({ ...prev, [friendId]: [...(prev[friendId] || []), newMsg] }));
    setMessageDraft("");
    if (!isOnline) setQueuedActions((n) => n + 1);
  }
  async function openRealThread(otherProfileId) {
    const result = await openThreadWith(otherProfileId);
    if (result?.data) {
      setActiveThread(null);
      setActiveRealThreadId(result.data);
      setMessagesOpen(true);
    }
  }
  async function sendDM() {
    if (!activeRealThreadId || (!realMessageDraft.trim() && !pendingAttachment)) return;
    const text = realMessageDraft.trim();
    const file = pendingAttachment;
    setRealMessageDraft("");
    setPendingAttachment(null);
    setSendingDM(true);
    const result = await sendRealMessage(activeRealThreadId, text, file);
    setSendingDM(false);
    if (result?.error) setAttachmentError(result.error.message || "Couldn't send that — try again.");
  }
  async function createCrew() {
    setCrewActionError("");
    const festivalName = FESTIVALS.find((f) => f.id === currentFestival)?.name || "New";
    const result = await createCrewRemote(`${festivalName} Crew`, currentFestival);
    if (result?.data) {
      setActiveCrewId(result.data.id);
      setInviteOpen(true);
    } else {
      setCrewActionError(result?.error?.message || "Couldn't create the crew — try again.");
    }
  }

  async function submitJoinCrew(code) {
    const result = await joinCrew(code);
    if (result?.data) {
      setActiveCrewId(result.data.id);
      setJoinCrewOpen(false);
    }
    return result;
  }

  async function pushNotification(base) {
    const notif = await persistNotification(base);
    if (pushEnabled && notif) {
      setToastLeaving(false);
      setToast(notif);
      setTimeout(() => setToastLeaving(true), 3600);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function simulateNotification() {
    const pick = NOTIFICATION_POOL[Math.floor(Math.random() * NOTIFICATION_POOL.length)];
    pushNotification(pick);
  }

  function openNotification(n) {
    markNotificationRead(n.id);
    setNotificationsOpen(false);
    if (n.type === "dm" && n.meta?.friendId) {
      setMessagesOpen(true);
      setActiveThread(n.meta.friendId);
    } else if (n.type === "artist" && n.meta?.festival) {
      setCurrentFestival(n.meta.festival);
      setView("community");
    } else if (n.type === "set" && n.meta?.festival) {
      setCurrentFestival(n.meta.festival);
      setView("mine");
    } else if (n.type === "community") {
      setView("community");
    }
  }

  const passesFriendFilter = (s) => {
    if (activeFriends.length === 0) return true;
    const fm = FRIEND_MATCHES[s.id] || {};
    return activeFriends.some((f) => (fm[f] || 0) >= 50);
  };
  const visibleSets = daySets.filter((s) => (lineupSubview === "matches" ? s.match >= threshold || addedFromDiscover.includes(s.id) : true)).filter(passesFriendFilter);

  const TABS = [
    { id: "home", label: "Home", icon: "home" },
    { id: "mine", label: "Lineup", icon: "schedule" },
    { id: "crew", label: "Crew", icon: "crew" },
    { id: "map", label: "Map", icon: "map" },
    { id: "community", label: "Community", icon: "community" },
  ];
  // "mine" is now the single Lineup destination; lineupSubview picks the lens.

  if (authLoading) {
    return <div style={{ minHeight: "100svh", background: "#0F0B1A" }} />;
  }
  if (!session || !profile) {
    return <SignInScreen onSubmit={signInWithEmail} onVerifyCode={verifyCode} sent={magicLinkSent} error={authError} />;
  }
  if (!profile.onboarded) {
    return (
      <OnboardingScreen
        email={session.user.email}
        onSubmit={(name, handle) => updateProfile({ name, handle, onboarded: true })}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0F0B1A", color: "#F5F0FF", minHeight: "100%", display: "flex", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        .frame { width: 100%; max-width: 430px; }
        .reveal { opacity: 0; transform: translateY(10px); transition: opacity .55s ease, transform .55s ease; }
        .reveal.on { opacity: 1; transform: translateY(0); }
        .set-card { transition: transform .15s ease, box-shadow .15s ease; cursor: pointer; }
        .set-card:active { transform: scale(0.97); }
        .tab-btn { transition: transform .12s ease; }
        .tab-btn:active { transform: scale(0.9); }
        input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #2A2440; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%;
          background: #F5F0FF; cursor: pointer; border: 4px solid #0F0B1A; box-shadow: 0 0 0 2px #3DF2E0;
        }
        ::-webkit-scrollbar { display: none; }
        @keyframes splashPulse { 0% { transform: scale(0.85); opacity: 0; } 55% { transform: scale(1.04); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes splashBeam { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
        .splash-mark { animation: splashPulse .6s cubic-bezier(.2,.9,.3,1.2) both; }
        .splash-fade { transition: opacity .35s ease; }
        @media (prefers-reduced-motion: reduce) { .reveal, .set-card, .tab-btn, .splash-mark { transition: none; animation: none; } }
      `}</style>

      {splashVisible && (
        <div
          className="splash-fade"
          style={{
            position: "fixed", inset: 0, zIndex: 50, background: "#0F0B1A",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            opacity: splashFading ? 0 : 1,
          }}
        >
          <div className="splash-mark">
            <PrismLogo size={72} />
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "4px", marginTop: 14,
              background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            PRISM
          </div>
        </div>
      )}

      {toast && (
        <div
          onClick={() => openNotification(toast)}
          className="splash-fade"
          style={{
            position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 14px)", left: "50%", transform: toastLeaving ? "translate(-50%, -12px)" : "translate(-50%, 0)",
            opacity: toastLeaving ? 0 : 1, transition: "transform .3s ease, opacity .3s ease",
            zIndex: 60, width: "calc(100% - 28px)", maxWidth: 402,
            background: "#1A1428", border: "1px solid #3DF2E0", borderRadius: 14,
            padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)", cursor: "pointer",
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(61,242,224,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <Icon name="bell" active={true} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#3DF2E0", letterSpacing: "0.5px" }}>PRISM</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5B5470" }}>now</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{toast.title}</div>
            <div style={{ fontSize: 12, color: "#8B85A3", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{toast.body}</div>
          </div>
        </div>
      )}

      <div className="frame" style={{ paddingBottom: 84 }}>
        {/* Header */}
        <div className={`reveal ${revealed ? "on" : ""}`} style={{ padding: "calc(env(safe-area-inset-top, 0px) + 24px) 18px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            {view === "home" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <PrismLogo size={30} />
                <div>
                  <h1 style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "2px", margin: 0, lineHeight: 1,
                    background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    PRISM
                  </h1>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B85A3", marginTop: 3 }}>
                    Hey {profile.name}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setFestivalPickerOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                <h1 style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: "1px", margin: 0, lineHeight: 1,
                  background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {FESTIVALS.find((f) => f.id === currentFestival)?.name.toUpperCase()}
                </h1>
                <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginBottom: 4 }} stroke="#8B85A3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {view !== "home" && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B85A3" }}>
                  {activeDays.find((d) => d.id === currentDay)?.label.toUpperCase()} · {activeDays.find((d) => d.id === currentDay)?.date.toUpperCase()}
                </span>
              )}
              <button
                onClick={() => setNotificationsOpen(true)}
                aria-label="Notifications"
                className="tab-btn"
                style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0, position: "relative",
                  background: "rgba(255,178,61,0.12)", border: "1px solid #FFB23D",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="#FFB23D" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M9.5 20a2.5 2.5 0 005 0"/></svg>
                {notifications.some((n) => !n.read) && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "#FF3DA6", border: "2px solid #0F0B1A" }} />
                )}
              </button>
              <button
                onClick={() => { setMessagesOpen(true); setUnreadDMs([]); }}
                aria-label="Messages"
                className="tab-btn"
                style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0, position: "relative",
                  background: "rgba(157,107,255,0.12)", border: "1px solid #9D6BFF",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="#9D6BFF" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4V5z"/></svg>
                {unreadDMs.length > 0 && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "#FF3DA6", border: "2px solid #0F0B1A" }} />
                )}
              </button>
              <button
                onClick={() => setSafetyOpen(true)}
                aria-label="Safety and emergency info"
                className="tab-btn"
                style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,61,166,0.12)", border: "1px solid #FF3DA6",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="#FF3DA6" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z"/><path d="M12 8v5M12 16.2v.1"/></svg>
              </button>
              <button
                onClick={() => setProfileOpen(true)}
                aria-label="Your profile"
                style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #3DF2E0, #9D6BFF)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 12, color: "#0F0B1A",
                }}
              >
                {profile.name[0]}
              </button>
            </div>
          </div>

          {view === "home" && (
            <p style={{ color: "#8B85A3", margin: "6px 0 0", fontSize: 13.5 }}>
              Your festivals — pick one to see the schedule, crew, and map.
            </p>
          )}

          {view !== "home" && (
            <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <p style={{ color: "#8B85A3", margin: 0, fontSize: 13.5, flex: 1 }}>
              {view === "mine" && lineupSubview === "matches" && `${daySets.filter((s) => s.match >= threshold).length} sets match your taste at ${threshold}%+`}
              {view === "mine" && lineupSubview === "full" && "Every set, every stage"}
              {view === "mine" && lineupSubview === "discover" && "Browse artists outside your usual matches"}
              {view === "crew" && "See who's into what, together"}
              {view === "map" && "Find your crew's camp spot"}
              {view === "community" && "What the crowd's saying right now"}
            </p>
            <button
              onClick={() => setIsOnline((v) => !v)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, whiteSpace: "nowrap",
                padding: "3px 8px", borderRadius: 20, border: `1px solid ${isOnline ? "#2A2440" : "#FFB23D"}`,
                background: isOnline ? "transparent" : "rgba(255,178,61,0.1)", color: isOnline ? "#5B5470" : "#FFB23D", cursor: "pointer",
              }}
            >
              {isOnline ? "Simulate offline" : "Go online"}
            </button>
          </div>

          {!isOnline && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,178,61,0.08)", border: "1px solid rgba(255,178,61,0.3)", borderRadius: 10, padding: "9px 12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFB23D", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#FFD9A0", lineHeight: 1.4 }}>
                Offline — showing your saved schedule, crew, and map.{queuedActions > 0 ? ` ${queuedActions} action${queuedActions > 1 ? "s" : ""} will sync when you're back.` : ""}
              </span>
            </div>
          )}

          {(view === "mine" || view === "crew") && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto" }}>
              {activeDays.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setCurrentDay(d.id)}
                  className="tab-btn"
                  style={{
                    flex: activeDays.length > 4 ? "0 0 64px" : 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textAlign: "center",
                    padding: "8px 4px", borderRadius: 9,
                    border: `1px solid ${currentDay === d.id ? "#9D6BFF" : "#2A2440"}`,
                    background: currentDay === d.id ? "rgba(157,107,255,0.14)" : "transparent",
                    color: currentDay === d.id ? "#9D6BFF" : "#8B85A3", cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.8, marginTop: 1 }}>{d.date}</div>
                </button>
              ))}
            </div>
          )}
            </>
          )}
        </div>

        {/* Home — hub: must-haves, quick access, and your festivals */}
        {view === "home" && (
          <div style={{ padding: "0 14px" }}>
            {/* Must-haves checklist — collapsed by default, small footprint */}
            <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
              <button
                onClick={() => setMustHavesOpen((v) => !v)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", letterSpacing: "0.3px" }}>MUST-HAVES</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: packedItems.length === MUST_HAVES.length ? "#3DF2E0" : "#5B5470" }}>
                    {packedItems.length}/{MUST_HAVES.length} packed
                  </span>
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="#5B5470" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: mustHavesOpen ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </button>
              {mustHavesOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {MUST_HAVES.map((item) => {
                  const checked = packedItems.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => togglePackedItem(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
                        padding: "3px 0", cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${checked ? "#3DF2E0" : "#3A3552"}`,
                        background: checked ? "#3DF2E0" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {checked && <svg viewBox="0 0 24 24" width="12" height="12" stroke="#0F0B1A" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                      </span>
                      <span style={{ fontSize: 13.5, color: checked ? "#5B5470" : "#F5F0FF", textDecoration: checked ? "line-through" : "none" }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            {/* Quick access */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setSafetyOpen(true)}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px solid #FF3DA6", background: "rgba(255,61,166,0.08)", borderRadius: 12, padding: "12px", cursor: "pointer" }}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" stroke="#FF3DA6" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z"/><path d="M12 8v5M12 16.2v.1"/></svg>
                <span style={{ fontSize: 12.5, color: "#F5F0FF", textAlign: "left" }}>Safety info</span>
              </button>
              <button
                onClick={() => setProfileOpen(true)}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px solid #2A2440", background: "#161225", borderRadius: 12, padding: "12px", cursor: "pointer" }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #3DF2E0, #9D6BFF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10, color: "#0F0B1A",
                }}>{profile.name[0]}</span>
                <span style={{ fontSize: 12.5, color: "#F5F0FF", textAlign: "left" }}>Your profile</span>
              </button>
            </div>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", letterSpacing: "0.3px", marginBottom: 10 }}>YOUR FESTIVALS</div>

            <div style={{ position: "relative", marginBottom: 12 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="#5B5470" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input
                value={festivalSearch}
                onChange={(e) => setFestivalSearch(e.target.value)}
                placeholder="Search festivals or cities…"
                style={{
                  width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: "#F5F0FF",
                  background: "#161225", border: "1px solid #2A2440", borderRadius: 12,
                  padding: "11px 14px 11px 36px", outline: "none", boxSizing: "border-box",
                }}
              />
              {festivalSearch && (
                <button
                  onClick={() => setFestivalSearch("")}
                  aria-label="Clear search"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5B5470", fontSize: 16, cursor: "pointer", padding: 4 }}
                >
                  ×
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(() => {
                const q = festivalSearch.trim().toLowerCase();
                const filtered = FESTIVALS.filter((f) => !q || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
                if (filtered.length === 0) {
                  return (
                    <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "24px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 13.5, color: "#8B85A3" }}>No festivals match "{festivalSearch}"</div>
                    </div>
                  );
                }
                return filtered.map((f) => {
              const isActive = f.id === currentFestival;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setCurrentFestival(f.id); setView("mine"); }}
                    className="tab-btn"
                    style={{
                      textAlign: "left", cursor: "pointer",
                      border: `1px solid ${isActive ? "#3DF2E0" : "#2A2440"}`,
                      background: isActive ? "rgba(61,242,224,0.08)" : "#161225",
                      borderRadius: 14, padding: "14px 16px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        {f.name}
                        {f.hasData && <Icon name="verified" />}
                      </div>
                      <div style={{ fontSize: 12, color: "#5B5470", marginTop: 2 }}>{f.location} · {f.dates}</div>
                    </div>
                    {isActive ? (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3DF2E0", whiteSpace: "nowrap" }}>Last viewed</span>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="#5B5470" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6"/></svg>
                    )}
                  </button>
                );
                });
              })()}
            </div>
          </div>
        )}

        {/* Lineup — matches / full / discover */}
        {view === "mine" && (
          <div style={{ padding: "0 14px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {["matches", "full", "discover"].map((sv) => (
                <button
                  key={sv}
                  onClick={() => setLineupSubview(sv)}
                  style={{
                    flex: 1,
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textTransform: "uppercase",
                    padding: "8px 6px", borderRadius: 7, border: "1px solid " + (lineupSubview === sv ? "#3DF2E0" : "#2A2440"),
                    background: lineupSubview === sv ? "rgba(61,242,224,0.12)" : "transparent",
                    color: lineupSubview === sv ? "#3DF2E0" : "#8B85A3", cursor: "pointer",
                  }}
                >
                  {sv === "matches" ? "My Matches" : sv === "full" ? "Full Lineup" : "Discover"}
                </button>
              ))}
            </div>

            {lineupSubview !== "discover" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#1A1428", border: "1px solid #2A2440", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
                <label htmlFor="threshold" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", whiteSpace: "nowrap" }}>MATCH</label>
                <input id="threshold" type="range" min="0" max="100" step="5" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, width: 34 }}>{threshold}%</span>
                {conflicts.size > 0 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#FF3DA6", whiteSpace: "nowrap" }}>⚠ {conflicts.size}</span>
                )}
              </div>
            )}

            {lineupSubview === "discover" ? (
              <DiscoverDeck addedIds={addedFromDiscover} onAdd={(id) => setAddedFromDiscover((prev) => [...prev, id])} currentDay={currentDay} currentFestival={currentFestival} stages={activeStages} />
            ) : (
              <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {FRIENDS.map((f) => {
                const active = activeFriends.includes(f.id);
                return (
                  <button key={f.id} onClick={() => toggleFriend(f.id)} className="tab-btn" style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999,
                    border: `1px solid ${active ? f.color : "#2A2440"}`, background: active ? `${f.color}1A` : "transparent", cursor: "pointer",
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.initial}</span>
                    <span style={{ fontSize: 12, color: active ? "#F5F0FF" : "#8B85A3" }}>{f.name}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              {activeStages.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3" }}>{s.name}</span>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex" }}>
                <div style={{ width: 52, flexShrink: 0, background: "#151024", borderRight: "1px solid #2A2440" }}>
                  <div style={{ position: "relative", height: timelineEnd * PX_PER_MIN }}>
                    {Array.from({ length: Math.floor(timelineEnd / 60) + 1 }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", top: i * 60 * PX_PER_MIN, right: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470", transform: "translateY(-50%)" }}>
                        {fmtTime(i * 60, currentDay, currentFestival)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flex: 1, minWidth: 0, overflowX: "auto" }}>
                  {activeStages.map((stage) => (
                    <div key={stage.id} style={{ flex: "1 0 110px", borderRight: "1px solid #2A2440" }}>
                      <div style={{ position: "relative", height: timelineEnd * PX_PER_MIN }}>
                        {visibleSets.filter((s) => s.stage === stage.id).map((s) => {
                          const dimmed = lineupSubview === "full" && s.match < threshold;
                          const isConflict = conflicts.has(s.id);
                          const wasDiscovered = addedFromDiscover.includes(s.id);
                          return (
                            <div key={s.id} className="set-card" onClick={() => setSelected(s)} style={{
                              position: "absolute", top: s.start * PX_PER_MIN + 3, height: (s.end - s.start) * PX_PER_MIN - 6, left: 3, right: 3,
                              borderRadius: 7, padding: "6px 7px", background: dimmed ? "#161225" : "#1E1832",
                              border: `1px solid ${isConflict ? "#FF3DA6" : wasDiscovered ? "#9D6BFF" : dimmed ? "#241E38" : matchColor(s.match)}`,
                              opacity: dimmed ? 0.35 : 1, overflow: "hidden",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.artist}</div>
                                {ARTIST_POSTS.some((a) => a.artistOf === s.id) && (
                                  <span title="Artist posted an update" style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFB23D", flexShrink: 0 }} />
                                )}
                              </div>
                              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: matchColor(s.match), marginTop: 2 }}>{s.match}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {view === "crew" && (
          <div style={{ padding: "0 14px" }}>
            {festivalCrews.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {festivalCrews.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCrewId(c.id)}
                    className="tab-btn"
                    style={{
                      flex: "0 0 auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, whiteSpace: "nowrap",
                      padding: "7px 13px", borderRadius: 20,
                      border: `1px solid ${activeCrewId === c.id ? "#3DF2E0" : "#2A2440"}`,
                      background: activeCrewId === c.id ? "rgba(61,242,224,0.12)" : "transparent",
                      color: activeCrewId === c.id ? "#3DF2E0" : "#8B85A3", cursor: "pointer",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  onClick={createCrew}
                  className="tab-btn"
                  style={{
                    flex: "0 0 auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, whiteSpace: "nowrap",
                    padding: "7px 13px", borderRadius: 20, border: "1px dashed #3A3552",
                    background: "transparent", color: "#5B5470", cursor: "pointer",
                  }}
                >
                  + New crew
                </button>
                <button
                  onClick={() => setJoinCrewOpen(true)}
                  className="tab-btn"
                  style={{
                    flex: "0 0 auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, whiteSpace: "nowrap",
                    padding: "7px 13px", borderRadius: 20, border: "1px dashed #3A3552",
                    background: "transparent", color: "#5B5470", cursor: "pointer",
                  }}
                >
                  Join with a code
                </button>
              </div>
            )}

            {crewActionError && (
              <div style={{ border: "1px solid #FF3DA6", background: "rgba(255,61,166,0.08)", borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 12.5, color: "#FF3DA6" }}>
                {crewActionError}
              </div>
            )}

            {!activeCrew ? (
              <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#8B85A3", marginBottom: 12 }}>
                  No crew yet for {FESTIVALS.find((f) => f.id === currentFestival)?.name}.
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button
                    onClick={createCrew}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "10px 18px", borderRadius: 10,
                      border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.1)", color: "#3DF2E0", cursor: "pointer",
                    }}
                  >
                    + Create a crew
                  </button>
                  <button
                    onClick={() => setJoinCrewOpen(true)}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "10px 18px", borderRadius: 10,
                      border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: "pointer",
                    }}
                  >
                    Join with a code
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{activeCrew.name}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>
                      {activeCrew.members.length + 1} members · {crewPersistent ? "persists after this festival" : "this festival only"}
                    </div>
                  </div>
                  <button
                    onClick={() => setInviteOpen(true)}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, whiteSpace: "nowrap",
                      padding: "8px 13px", borderRadius: 8, border: "1px solid #3DF2E0",
                      background: "rgba(61,242,224,0.1)", color: "#3DF2E0", cursor: "pointer",
                    }}
                  >
                    + Invite
                  </button>
                </div>

                {activeCrew.members.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {activeCrew.members.map((m) => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #2A2440", borderRadius: 12, padding: "9px 12px" }}>
                        <span style={{ width: 30, height: 30, borderRadius: "50%", background: colorForId(m.id), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {m.name[0].toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>@{m.handle}</div>
                        </div>
                        <button
                          onClick={() => openRealThread(m.id)}
                          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "5px 11px", color: "#8B85A3", cursor: "pointer", flexShrink: 0 }}
                        >
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <CrewCompare
                  friends={toDisplayFriends(activeCrew.members)}
                  sharing={{ ...Object.fromEntries(activeCrew.members.map((m) => [m.id, true])), ...sharing }}
                  onToggleSharing={toggleSharing}
                  onSelect={setSelected}
                  currentDay={currentDay}
                  currentFestival={currentFestival}
                />
              </>
            )}
          </div>
        )}

        {view === "map" && (
          <div style={{ padding: "0 14px" }}>
            {(() => {
              const mapInfo = FESTIVAL_MAP_IMAGES[currentFestival];
              const failed = mapLoadFailed[currentFestival];
              const festivalName = FESTIVALS.find((f) => f.id === currentFestival)?.name;
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", letterSpacing: "0.3px" }}>OFFICIAL FESTIVAL MAP</span>
                    {mapInfo && !failed && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470" }}>{mapInfo.year}</span>}
                  </div>
                  {mapInfo && !failed ? (
                    <>
                      <button
                        onClick={() => setOfficialMapOpen(true)}
                        style={{ display: "block", width: "100%", padding: 0, border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden", background: "#151024", cursor: "pointer" }}
                      >
                        <img
                          src={mapInfo.src}
                          alt={`${festivalName} official festival map`}
                          draggable={false}
                          style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover", WebkitUserDrag: "none", userSelect: "none" }}
                          onError={() => setMapLoadFailed((prev) => ({ ...prev, [currentFestival]: true }))}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </button>
                      {mapInfo.note && (
                        <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0", lineHeight: 1.4 }}>{mapInfo.note}</p>
                      )}
                      {(campPinsByFestival[currentFestival]?.length || 0) > 0 && (
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#3DF2E0", margin: "6px 0 0" }}>
                          📍 {campPinsByFestival[currentFestival].length} crew pin{campPinsByFestival[currentFestival].length === 1 ? "" : "s"} dropped — tap to view
                        </p>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, height: 160, border: "1px dashed #2A2440", borderRadius: 14, background: "#151024" }}>
                      <Icon name="map" active={false} />
                      <span style={{ fontSize: 12.5, color: "#5B5470", textAlign: "center", maxWidth: 220 }}>
                        {festivalName}'s official map isn't available yet — check back closer to the festival.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
            <CampMap
              key={currentFestival}
              friends={activeCrew ? toDisplayFriends(activeCrew.members) : []}
              sharing={activeCrew ? { ...Object.fromEntries(activeCrew.members.map((m) => [m.id, true])), ...sharing } : sharing}
              pins={campPinsByFestival[currentFestival] || []}
              myProfileId={profile?.id}
              onSetMyPin={(x, y, note) => setMyCampPin(currentFestival, x, y, note)}
              isOnline={isOnline}
              onQueue={() => setQueuedActions((n) => n + 1)}
              currentFestival={currentFestival}
            />
          </div>
        )}

        {officialMapOpen && FESTIVAL_MAP_IMAGES[currentFestival] && (() => {
          const pins = campPinsByFestival[currentFestival] || [];
          const myPin = pins.find((p) => p.profile_id === profile?.id);
          const otherPins = pins.filter((p) => p.profile_id !== profile?.id);

          function handleLightboxClick(e) {
            if (!pinPlacing) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
            setPinPlacing(false);
            setMyCampPin(currentFestival, x, y, myPin?.note || "").then((r) => {
              if (r?.error) setPinActionError(r.error.message || "Couldn't save your pin — try again.");
            });
          }

          return (
            <div
              style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}
              onClick={() => { setOfficialMapOpen(false); setPinPlacing(false); setOpenMapPin(null); }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "calc(env(safe-area-inset-top, 0px) + 14px) 14px 6px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPinPlacing((p) => !p)}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, whiteSpace: "nowrap",
                    padding: "8px 14px", borderRadius: 20,
                    border: `1px solid ${pinPlacing ? "#3DF2E0" : "rgba(255,255,255,0.2)"}`,
                    background: pinPlacing ? "rgba(61,242,224,0.15)" : "rgba(255,255,255,0.08)",
                    color: pinPlacing ? "#3DF2E0" : "#F5F0FF", cursor: "pointer",
                  }}
                >
                  {pinPlacing ? "Tap the map to drop it…" : myPin ? "Move my pin" : "Drop my pin"}
                </button>
                <button onClick={() => setOfficialMapOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5F0FF", fontSize: 22, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", flexShrink: 0 }}>×</button>
              </div>

              {pinActionError && (
                <div onClick={(e) => e.stopPropagation()} style={{ margin: "0 14px", fontSize: 12, color: "#FF3DA6" }}>{pinActionError}</div>
              )}

              <div style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain", touchAction: pinPlacing ? "none" : "pinch-zoom" }}>
                <div style={{ position: "relative" }} onClick={(e) => { e.stopPropagation(); handleLightboxClick(e); }}>
                  <img
                    src={FESTIVAL_MAP_IMAGES[currentFestival].src}
                    alt={`${FESTIVALS.find((f) => f.id === currentFestival)?.name} official festival map, full size`}
                    draggable={false}
                    style={{ width: "100%", display: "block", WebkitUserDrag: "none", userSelect: "none", cursor: pinPlacing ? "crosshair" : "default" }}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  {otherPins.map((p) => (
                    <div
                      key={p.profile_id}
                      onClick={(e) => { e.stopPropagation(); setOpenMapPin(p); }}
                      style={{
                        position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)",
                        width: 26, height: 26, borderRadius: "50%", background: colorForId(p.profile_id),
                        border: "2px solid #0F0B1A", display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, color: "#0F0B1A", cursor: "pointer",
                      }}
                    >
                      {(p.profiles?.name || "?")[0].toUpperCase()}
                    </div>
                  ))}
                  {myPin && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setOpenMapPin(myPin); }}
                      style={{
                        position: "absolute", left: `${myPin.x}%`, top: `${myPin.y}%`, transform: "translate(-50%, -50%)",
                        width: 28, height: 28, borderRadius: "50%", background: "#F5F0FF", border: "2.5px solid #3DF2E0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, color: "#0F0B1A", cursor: "pointer",
                      }}
                    >
                      YOU
                    </div>
                  )}
                </div>
              </div>

              {openMapPin && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute", left: 14, right: 14, bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
                    background: "#171229", border: "1px solid #2A2440", borderRadius: 14, padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: openMapPin.profile_id === profile?.id ? "#F5F0FF" : colorForId(openMapPin.profile_id),
                      border: openMapPin.profile_id === profile?.id ? "2px solid #3DF2E0" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10.5, color: "#0F0B1A",
                    }}>
                      {openMapPin.profile_id === profile?.id ? "Y" : (openMapPin.profiles?.name || "?")[0].toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                        {openMapPin.profile_id === profile?.id ? "Your pin" : openMapPin.profiles?.name || "Crew member"}
                      </div>
                      {openMapPin.note && <div style={{ fontSize: 12, color: "#8B85A3", marginTop: 1 }}>{openMapPin.note}</div>}
                    </div>
                    <button onClick={() => setOpenMapPin(null)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
                  </div>
                  {openMapPin.profile_id === profile?.id && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input
                        defaultValue={openMapPin.note || ""}
                        placeholder="Add a note (e.g. blue tent near the tree line)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setMyCampPin(currentFestival, myPin.x, myPin.y, e.currentTarget.value.trim());
                            setOpenMapPin(null);
                          }
                        }}
                        style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: "#F5F0FF", background: "#0F0B1A", border: "1px solid #2A2440", borderRadius: 8, padding: "8px 10px", outline: "none" }}
                      />
                      <button
                        onClick={() => { clearMyCampPin(currentFestival); setOpenMapPin(null); }}
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "8px 12px", borderRadius: 8, border: "1px solid #FF3DA6", background: "rgba(255,61,166,0.08)", color: "#FF3DA6", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {view === "community" && (
          <div style={{ padding: "0 14px" }}>
            <Community key={currentFestival} isOnline={isOnline} onQueue={() => setQueuedActions((n) => n + 1)} currentFestival={currentFestival} />
          </div>
        )}

        {/* Detail sheet */}
        {selected && (
          <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.5px" }}>{selected.artist}</span>
                    {ARTIST_VERIFICATION[selected.id] === "verified" && <Icon name="verified" />}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B85A3", marginTop: 2 }}>
                    {activeStages.find((st) => st.id === selected.stage)?.name} · {fmtTime(selected.start, selected.day, selected.festival)}–{fmtTime(selected.end, selected.day, selected.festival)} · {selected.genre}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: matchColor(selected.match), border: `1px solid ${matchColor(selected.match)}`, borderRadius: 6, padding: "3px 9px" }}>{selected.match}% match</span>
                {conflicts.has(selected.id) && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#FF3DA6" }}>⚠ overlaps another set</span>}
              </div>
              {selected.sounds_like ? (
                <p style={{ marginTop: 12, fontSize: 14, color: "#C9C3E0", lineHeight: 1.5 }}>{selected.sounds_like}</p>
              ) : (
                <p style={{ marginTop: 12, fontSize: 14, color: "#5B5470", lineHeight: 1.5 }}>New to your library — no direct match yet.</p>
              )}
              {ARTIST_VERIFICATION[selected.id] === "verified" && ARTIST_EXCLUSIVES[selected.id] && (
                <div style={{ marginTop: 14, border: "1px solid #FFB23D", borderRadius: 12, padding: "12px 14px", background: "rgba(255,178,61,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFB23D" }} />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#FFB23D", letterSpacing: "0.3px" }}>
                      FROM {selected.artist}
                    </span>
                  </div>
                  {selected.match >= ARTIST_EXCLUSIVES[selected.id].unlockAt ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#FFD9A0", lineHeight: 1.5 }}>{ARTIST_EXCLUSIVES[selected.id].text}</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12.5, color: "#8B85A3", lineHeight: 1.5 }}>
                      Unlocks at {ARTIST_EXCLUSIVES[selected.id].unlockAt}% match — you're at {selected.match}%.
                    </p>
                  )}
                </div>
              )}
              {ARTIST_VERIFICATION[selected.id] === "pending" && (
                <div style={{ marginTop: 14, border: "1px solid #2A2440", borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8B85A3" }}>
                    Claim under review — exclusive content unlocks once {selected.artist}'s team is verified.
                  </span>
                </div>
              )}
              {ARTIST_VERIFICATION[selected.id] === "unclaimed" && (
                <div style={{ marginTop: 14, border: "1px solid #2A2440", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "#8B85A3" }}>Is this {selected.artist} or their team?</span>
                  <button
                    onClick={() => { setClaimTarget(selected); setSelected(null); }}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, whiteSpace: "nowrap", background: "none", border: "1px solid #9D6BFF", borderRadius: 20, padding: "5px 11px", color: "#9D6BFF", cursor: "pointer" }}
                  >
                    Claim profile
                  </button>
                </div>
              )}
              {FRIEND_MATCHES[selected.id] && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>ALSO INTO THIS ARTIST</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FRIENDS.filter((f) => FRIEND_MATCHES[selected.id][f.id] != null).map((f) => (
                      <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.initial}</span>
                        <span style={{ fontSize: 13 }}>{f.name}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B85A3" }}>{FRIEND_MATCHES[selected.id][f.id]}% match</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invite sheet */}
        {inviteOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setInviteOpen(false)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>Invite to {activeCrew?.name}</div>
                <button onClick={() => setInviteOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "6px 0 16px" }}>
                Anyone with this code can join and see the crew — they choose their own taste-sharing later.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#1A1428", border: "1px solid #2A2440", borderRadius: 12, padding: "12px 14px", marginBottom: 14, opacity: isOnline ? 1 : 0.5 }}>
                <span style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, letterSpacing: "1.5px", color: "#3DF2E0" }}>{activeCrew?.code}</span>
                <button
                  disabled={!isOnline}
                  onClick={() => { navigator.clipboard?.writeText(activeCrew?.code || ""); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500); }}
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "6px 11px", borderRadius: 7, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.1)", color: "#3DF2E0", cursor: isOnline ? "pointer" : "not-allowed" }}
                >
                  {codeCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <button disabled={!isOnline} style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "11px", borderRadius: 10, border: "1px solid #2A2440", background: "transparent", color: isOnline ? "#F5F0FF" : "#5B5470", cursor: isOnline ? "pointer" : "not-allowed", marginBottom: 6 }}>
                Share invite link
              </button>
              {!isOnline && (
                <p style={{ fontSize: 11, color: "#FFB23D", margin: "0 0 16px" }}>Invites need a connection — try again once you're back online.</p>
              )}
              {isOnline && <div style={{ marginBottom: 16 }} />}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #2A2440" }}>
                <div>
                  <div style={{ fontSize: 13 }}>Keep this crew after the festival</div>
                  <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 2 }}>Off starts it fresh for next time</div>
                </div>
                <button
                  onClick={() => setCrewPersistent((v) => !v)}
                  style={{
                    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
                    background: crewPersistent ? "#3DF2E0" : "#2A2440",
                  }}
                >
                  <span style={{ position: "absolute", top: 2, left: crewPersistent ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#0F0B1A", transition: "left .15s ease" }} />
                </button>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>PENDING</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PENDING_INVITES.map((inv) => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{inv.label}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: inv.status === "pending" ? "#5B5470" : "#3DF2E0" }}>{inv.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join a crew by code */}
        {joinCrewOpen && (
          <JoinCrewSheet onClose={() => setJoinCrewOpen(false)} onSubmit={submitJoinCrew} />
        )}

        {/* Profile sheet */}
        {profileOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setProfileOpen(false)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #3DF2E0, #9D6BFF)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 18, color: "#0F0B1A", flexShrink: 0 }}>
                  {profile.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingProfile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Display name"
                        style={{ width: "100%", background: "#0F0B1A", border: "1px solid #2A2440", borderRadius: 8, padding: "6px 10px", color: "#F5F0FF", fontSize: 14 }}
                      />
                      <div style={{ display: "flex", alignItems: "center", background: "#0F0B1A", border: "1px solid #2A2440", borderRadius: 8, padding: "0 10px" }}>
                        <span style={{ color: "#5B5470", fontSize: 13 }}>@</span>
                        <input
                          value={editHandle}
                          onChange={(e) => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="handle"
                          style={{ flex: 1, background: "none", border: "none", padding: "6px 4px", color: "#F5F0FF", fontSize: 14 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.5px" }}>{profile.name}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#5B5470" }}>@{profile.handle}</div>
                      <div style={{ marginTop: 4 }}><TierBadge username="you" /></div>
                    </>
                  )}
                </div>
                {!editingProfile && (
                  <button onClick={startEditingProfile} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "4px 10px", color: "#8B85A3", cursor: "pointer", flexShrink: 0 }}>
                    Edit
                  </button>
                )}
                <button onClick={() => setProfileOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              {editingProfile && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={saveProfileEdits}
                    disabled={savingProfile}
                    style={{ flex: 1, background: "#3DF2E0", border: "none", borderRadius: 8, padding: "8px", color: "#0F0B1A", fontWeight: 700, fontSize: 12.5, cursor: savingProfile ? "default" : "pointer", opacity: savingProfile ? 0.7 : 1 }}
                  >
                    {savingProfile ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    style={{ flex: 1, background: "none", border: "1px solid #2A2440", borderRadius: 8, padding: "8px", color: "#8B85A3", fontSize: 12.5, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {editingProfile && profileEditError && (
                <div style={{ fontSize: 12, color: "#FF3DA6", marginTop: 8 }}>{profileEditError}</div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <div style={{ flex: 1, border: "1px solid #2A2440", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{SETS.filter((s) => s.festival === currentFestival && s.match >= threshold).length}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470" }}>MATCHED SETS</div>
                </div>
                <div style={{ flex: 1, border: "1px solid #2A2440", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{addedFromDiscover.length}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470" }}>DISCOVERED</div>
                </div>
                <div style={{ flex: 1, border: "1px solid #2A2440", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{crews.length}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470" }}>CREWS</div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>CONNECTED ACCOUNTS</div>
                {Object.entries(ME.connections).map(([key, c]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #201A33" }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, textTransform: "capitalize" }}>{key}</div>
                      <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1 }}>{c.label}</div>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: c.connected ? "#3DF2E0" : "#5B5470", border: `1px solid ${c.connected ? "#3DF2E0" : "#2A2440"}`, borderRadius: 20, padding: "3px 9px" }}>
                      {c.connected ? "Connected" : "Connect"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>YOUR CREWS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {crews.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #201A33" }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1 }}>
                          {FESTIVALS.find((f) => f.id === c.festival)?.name} · {c.persistent ? "Persists after this festival" : "This festival only"}
                        </div>
                      </div>
                      <button
                        onClick={() => { setProfileOpen(false); setCurrentFestival(c.festival); setActiveCrewId(c.id); setView("crew"); }}
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "4px 10px", color: "#8B85A3", cursor: "pointer" }}
                      >
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>SETTINGS</div>
                <button
                  onClick={togglePushEnabled}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 13, color: "#F5F0FF" }}>Push notifications</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: pushEnabled ? "#3DF2E0" : "#5B5470" }}>{pushEnabled ? "On" : "Off"}</span>
                </button>
                {pushError && <div style={{ fontSize: 11.5, color: "#FF3DA6", padding: "0 0 8px" }}>{pushError}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ fontSize: 13 }}>Camp pin visible to crew</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#3DF2E0" }}>On</span>
                </div>
              </div>

              <button onClick={signOut} style={{ width: "100%", marginTop: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "11px", borderRadius: 10, border: "1px solid #FF3DA6", background: "rgba(255,61,166,0.08)", color: "#FF3DA6", cursor: "pointer" }}>
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Artist claim sheet */}
        {claimTarget && (
          <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setClaimTarget(null)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.5px" }}>Claim {claimTarget.artist}</div>
                <button onClick={() => setClaimTarget(null)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "6px 0 16px", lineHeight: 1.5 }}>
                Verification protects fans from impersonation and unlocks posting and exclusive content for the real artist or their management.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Work email or booking agency", hint: "matched against the festival's official artist roster" },
                  { label: "Linked official socials", hint: "cross-checked against verified accounts elsewhere" },
                  { label: "Government or business ID", hint: "for the person submitting the claim" },
                ].map((f) => (
                  <div key={f.label} style={{ border: "1px solid #2A2440", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 13 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "#5B5470", marginTop: 2 }}>{f.hint}</div>
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "12px", borderRadius: 10, border: "1px solid #9D6BFF", background: "rgba(157,107,255,0.12)", color: "#9D6BFF", cursor: "pointer" }}>
                Submit for review
              </button>
              <p style={{ fontSize: 11, color: "#5B5470", margin: "10px 0 0", textAlign: "center" }}>Most claims are reviewed within a few days.</p>
            </div>
          </div>
        )}

        {/* Festival picker */}
        {festivalPickerOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setFestivalPickerOpen(false)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>Your festivals</div>
                <button onClick={() => setFestivalPickerOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "6px 0 16px", lineHeight: 1.5 }}>
                Starting with the major recurring festivals — full schedules, crews, and maps are only loaded for the ones we've built real data for so far.
              </p>

              <div style={{ position: "relative", marginBottom: 14 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="#5B5470" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                <input
                  value={festivalSearch}
                  onChange={(e) => setFestivalSearch(e.target.value)}
                  placeholder="Search festivals or cities…"
                  style={{
                    width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: "#F5F0FF",
                    background: "#1A1428", border: "1px solid #2A2440", borderRadius: 12,
                    padding: "11px 14px 11px 36px", outline: "none", boxSizing: "border-box",
                  }}
                />
                {festivalSearch && (
                  <button
                    onClick={() => setFestivalSearch("")}
                    aria-label="Clear search"
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5B5470", fontSize: 16, cursor: "pointer", padding: 4 }}
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(() => {
                  const q = festivalSearch.trim().toLowerCase();
                  const filtered = FESTIVALS.filter((f) => !q || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
                  if (filtered.length === 0) {
                    return (
                      <div style={{ border: "1px solid #2A2440", borderRadius: 12, padding: "20px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: "#8B85A3" }}>No festivals match "{festivalSearch}"</div>
                      </div>
                    );
                  }
                  return filtered.map((f) => {
                  const requested = requestedFestivals.includes(f.id);
                  return (
                    <div key={f.id} style={{ border: `1px solid ${f.hasData ? "#3DF2E0" : "#2A2440"}`, borderRadius: 12, padding: "12px 14px", background: f.hasData ? "rgba(61,242,224,0.08)" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            {f.name}
                            {f.hasData && <Icon name="verified" />}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 2 }}>{f.location} · {f.dates}</div>
                        </div>
                        {f.hasData ? (
                          f.id === currentFestival ? (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3DF2E0", whiteSpace: "nowrap" }}>Viewing</span>
                          ) : (
                            <button
                              onClick={() => { setCurrentFestival(f.id); setFestivalPickerOpen(false); }}
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, whiteSpace: "nowrap", padding: "5px 10px", borderRadius: 20,
                                border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer",
                              }}
                            >
                              Switch
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => setRequestedFestivals((prev) => (prev.includes(f.id) ? prev : [...prev, f.id]))}
                            disabled={requested}
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, whiteSpace: "nowrap", padding: "5px 10px", borderRadius: 20,
                              border: `1px solid ${requested ? "#2A2440" : "#9D6BFF"}`,
                              background: requested ? "transparent" : "rgba(157,107,255,0.12)",
                              color: requested ? "#5B5470" : "#9D6BFF", cursor: requested ? "default" : "pointer",
                            }}
                          >
                            {requested ? "Requested" : "Request data"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                  });
                })()}
              </div>
              <p style={{ fontSize: 11, color: "#5B5470", margin: "14px 0 0", lineHeight: 1.5 }}>
                Requesting a festival tells us where to prioritize building real schedule data next — it doesn't switch your view yet.
              </p>
            </div>
          </div>
        )}

        {/* Notifications inbox */}
        {notificationsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setNotificationsOpen(false)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>Notifications</div>
                <button onClick={() => setNotificationsOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13 }}>Push notifications</div>
                  <div style={{ fontSize: 11, color: "#5B5470", marginTop: 1 }}>{pushEnabled ? "On — you'll see banners when things happen" : "Off — still logged here, just no banners"}</div>
                </div>
                <button
                  onClick={togglePushEnabled}
                  style={{
                    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
                    background: pushEnabled ? "#3DF2E0" : "#2A2440",
                  }}
                >
                  <span style={{ position: "absolute", top: 2, left: pushEnabled ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#0F0B1A", transition: "left .15s ease" }} />
                </button>
              </div>
              {pushError && <div style={{ fontSize: 11.5, color: "#FF3DA6", marginTop: 4 }}>{pushError}</div>}

              <button
                onClick={simulateNotification}
                style={{
                  width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "10px", borderRadius: 10, marginTop: 8, marginBottom: 16,
                  border: "1px dashed #3A3552", background: "transparent", color: "#5B5470", cursor: "pointer",
                }}
              >
                Simulate a notification
              </button>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.length === 0 && <p style={{ fontSize: 13, color: "#5B5470", textAlign: "center" }}>Nothing yet.</p>}
                {notifications.map((n) => {
                  const iconName = n.type === "dm" ? "messages" : n.type === "set" ? "schedule" : n.type === "community" ? "community" : "verified";
                  const color = n.type === "dm" ? "#9D6BFF" : n.type === "set" ? "#3DF2E0" : n.type === "community" ? "#5FD97A" : "#FFB23D";
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                        border: `1px solid ${n.read ? "#2A2440" : color}`, borderRadius: 12, padding: "11px 12px",
                        background: n.read ? "transparent" : `${color}14`, cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={iconName} active={true} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</span>
                          {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 12, color: "#8B85A3", marginTop: 2 }}>{n.body}</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470", marginTop: 4 }}>{relativeTime(n.created_at)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages — inbox list, or an open thread */}
        {messagesOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => { setMessagesOpen(false); setActiveThread(null); setActiveRealThreadId(null); }}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "85vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />

              {!activeThread && !activeRealThreadId ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>Messages</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {allCrewMembers.length > 0 && (
                        <button
                          onClick={() => setNewDmPickerOpen(true)}
                          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, background: "none", border: "1px solid #3DF2E0", borderRadius: 20, padding: "5px 11px", color: "#3DF2E0", cursor: "pointer" }}
                        >
                          + New
                        </button>
                      )}
                      <button onClick={() => setMessagesOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                    {realThreads.filter((t) => t.other).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveRealThreadId(t.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                          border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px",
                          background: "transparent", cursor: "pointer",
                        }}
                      >
                        <span style={{ width: 34, height: 34, borderRadius: "50%", background: colorForId(t.other.id), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {t.other.name[0].toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t.other.name}</span>
                          {t.lastMessage && (
                            <div style={{ fontSize: 12, color: "#8B85A3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                              {t.lastMessage.from === "you" ? "You: " : ""}{t.lastMessage.text}
                            </div>
                          )}
                        </div>
                        {t.lastMessage && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470", flexShrink: 0 }}>{relativeTime(t.lastMessage.created_at)}</span>}
                      </button>
                    ))}
                    {FRIENDS.map((f) => {
                      const thread = [...(DM_THREADS[f.id] || []), ...(sentMessages[f.id] || [])];
                      const last = thread[thread.length - 1];
                      const isUnread = unreadDMs.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => setActiveThread(f.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                            border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px",
                            background: isUnread ? "rgba(157,107,255,0.08)" : "transparent", cursor: "pointer",
                          }}
                        >
                          <span style={{ width: 34, height: 34, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.initial}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{f.name}</span>
                              {isUnread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF3DA6", flexShrink: 0 }} />}
                            </div>
                            {last && (
                              <div style={{ fontSize: 12, color: "#8B85A3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                                {last.from === "you" ? "You: " : ""}{last.text}
                              </div>
                            )}
                          </div>
                          {last && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470", flexShrink: 0 }}>{last.time}</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : activeRealThreadId ? (
                (() => {
                  const t = realThreads.find((th) => th.id === activeRealThreadId);
                  if (!t || !t.other) return null;
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => setActiveRealThreadId(null)} aria-label="Back to inbox" style={{ background: "none", border: "none", color: "#8B85A3", cursor: "pointer", padding: 0, display: "flex" }}>
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#8B85A3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                        </button>
                        <span style={{ width: 28, height: 28, borderRadius: "50%", background: colorForId(t.other.id), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {t.other.name[0].toUpperCase()}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{t.other.name}</span>
                        <button onClick={() => setMessagesOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, minHeight: 160 }}>
                        {t.messages.length === 0 && <p style={{ fontSize: 13, color: "#5B5470", textAlign: "center" }}>Say hi.</p>}
                        {t.messages.map((m) => (
                          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "you" ? "flex-end" : "flex-start" }}>
                            <div style={{
                              maxWidth: "78%", borderRadius: 14, padding: "8px 12px",
                              background: m.from === "you" ? "rgba(61,242,224,0.14)" : "#1E1832",
                              border: `1px solid ${m.from === "you" ? "#3DF2E0" : "#2A2440"}`,
                            }}>
                              {m.attachment_path && (
                                m.attachment_type?.startsWith("image/") ? (
                                  <a href={m.attachmentUrl || undefined} target="_blank" rel="noreferrer">
                                    <img
                                      src={m.attachmentUrl}
                                      alt={m.attachment_name || "attachment"}
                                      style={{ display: "block", maxWidth: "100%", maxHeight: 220, borderRadius: 10, marginBottom: m.text ? 6 : 0 }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={m.attachmentUrl || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
                                      background: "rgba(0,0,0,0.18)", border: "1px solid #2A2440", borderRadius: 10,
                                      padding: "8px 10px", marginBottom: m.text ? 6 : 0,
                                    }}
                                  >
                                    <span style={{ fontSize: 16 }}>📄</span>
                                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F5F0FF" }}>
                                      {m.attachment_name || "File"}
                                    </span>
                                    {m.attachment_size != null && (
                                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470", flexShrink: 0 }}>
                                        {formatFileSize(m.attachment_size)}
                                      </span>
                                    )}
                                  </a>
                                )
                              )}
                              {m.text && <div style={{ fontSize: 13.5, color: "#F5F0FF", lineHeight: 1.4 }}>{m.text}</div>}
                              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470", marginTop: 3, textAlign: m.from === "you" ? "right" : "left" }}>{relativeTime(m.created_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {attachmentError && (
                        <div style={{ fontSize: 12, color: "#FF3DA6", marginTop: 10 }}>{attachmentError}</div>
                      )}

                      {pendingAttachment && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, background: "#1A1428", border: "1px solid #2A2440", borderRadius: 10, padding: "8px 10px" }}>
                          <span style={{ fontSize: 16 }}>{pendingAttachment.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F5F0FF" }}>
                            {pendingAttachment.name}
                          </span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470" }}>{formatFileSize(pendingAttachment.size)}</span>
                          <button
                            onClick={() => setPendingAttachment(null)}
                            aria-label="Remove attachment"
                            style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <input
                          ref={dmFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/heic,application/pdf"
                          onChange={handleDmFileSelected}
                          style={{ display: "none" }}
                        />
                        <button
                          onClick={() => dmFileInputRef.current?.click()}
                          aria-label="Attach a file"
                          style={{
                            flexShrink: 0, width: 38, height: 38, borderRadius: "50%", fontSize: 16,
                            border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: "pointer",
                          }}
                        >
                          📎
                        </button>
                        <input
                          value={realMessageDraft}
                          onChange={(e) => setRealMessageDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") sendDM(); }}
                          placeholder={`Message ${t.other.name}…`}
                          style={{
                            flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F5F0FF",
                            background: "#1A1428", border: "1px solid #2A2440", borderRadius: 20,
                            padding: "10px 14px", outline: "none",
                          }}
                        />
                        <button
                          onClick={sendDM}
                          disabled={sendingDM}
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "10px 16px", borderRadius: 20,
                            border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0",
                            cursor: sendingDM ? "default" : "pointer", opacity: sendingDM ? 0.6 : 1, whiteSpace: "nowrap",
                          }}
                        >
                          {sendingDM ? "Sending…" : "Send"}
                        </button>
                      </div>
                    </>
                  );
                })()
              ) : (
                (() => {
                  const f = FRIENDS.find((fr) => fr.id === activeThread);
                  const thread = [...(DM_THREADS[activeThread] || []), ...(sentMessages[activeThread] || [])];
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => setActiveThread(null)} aria-label="Back to inbox" style={{ background: "none", border: "none", color: "#8B85A3", cursor: "pointer", padding: 0, display: "flex" }}>
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#8B85A3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                        </button>
                        <span style={{ width: 28, height: 28, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.initial}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{f.name}</span>
                        <button onClick={() => setMessagesOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, minHeight: 160 }}>
                        {thread.map((m) => (
                          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "you" ? "flex-end" : "flex-start" }}>
                            <div style={{
                              maxWidth: "78%", borderRadius: 14, padding: "8px 12px",
                              background: m.from === "you" ? "rgba(61,242,224,0.14)" : "#1E1832",
                              border: `1px solid ${m.from === "you" ? "#3DF2E0" : "#2A2440"}`,
                            }}>
                              <div style={{ fontSize: 13.5, color: "#F5F0FF", lineHeight: 1.4 }}>{m.text}</div>
                              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470", marginTop: 3, textAlign: m.from === "you" ? "right" : "left" }}>{m.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <input
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(activeThread); }}
                          placeholder={`Message ${f.name}…`}
                          style={{
                            flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F5F0FF",
                            background: "#1A1428", border: "1px solid #2A2440", borderRadius: 20,
                            padding: "10px 14px", outline: "none",
                          }}
                        />
                        <button
                          onClick={() => sendMessage(activeThread)}
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "10px 16px", borderRadius: 20,
                            border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          Send
                        </button>
                      </div>
                      {!isOnline && (
                        <p style={{ fontSize: 11, color: "#FFB23D", margin: "8px 0 0" }}>Offline — messages will send once you're back online.</p>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {newDmPickerOpen && (
          <NewDmPickerSheet
            members={allCrewMembers}
            onClose={() => setNewDmPickerOpen(false)}
            onPick={(id) => { setNewDmPickerOpen(false); openRealThread(id); }}
          />
        )}

        {/* Safety sheet — reachable from any tab via the header */}
        {safetyOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setSafetyOpen(false)}>
            <div className="frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #FF3DA6", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="safety" active={true} />
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px", color: "#FF3DA6" }}>Safety</div>
                </div>
                <button onClick={() => setSafetyOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>

              <a href="tel:911" style={{ display: "block", textDecoration: "none", marginTop: 16, textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, padding: "13px", borderRadius: 12, background: "#FF3DA6", color: "#0F0B1A" }}>
                Call 911 — life-threatening emergency
              </a>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>ON-SITE MEDICAL</div>
                {SAFETY_INFO.medical.map((m) => (
                  <div key={m.name} style={{ padding: "8px 0", borderBottom: "1px solid #201A33" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1 }}>{m.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>LOST OR SEPARATED FROM YOUR CREW</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SAFETY_INFO.lostProtocol.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#C9C3E0", lineHeight: 1.5 }}>
                      <span style={{ color: "#5B5470" }}>{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setNotifiedCrew(true)}
                  disabled={notifiedCrew}
                  style={{
                    width: "100%", marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "11px", borderRadius: 10,
                    border: `1px solid ${notifiedCrew ? "#2A2440" : "#3DF2E0"}`,
                    background: notifiedCrew ? "transparent" : "rgba(61,242,224,0.12)",
                    color: notifiedCrew ? "#5B5470" : "#3DF2E0", cursor: notifiedCrew ? "default" : "pointer",
                  }}
                >
                  {notifiedCrew ? "Crew notified you need help" : "Alert my crew — I need help"}
                </button>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>CRISIS SUPPORT</div>
                {SAFETY_INFO.resources.slice(1).map((r) => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <div>
                      <div style={{ fontSize: 13 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: "#5B5470", marginTop: 1 }}>{r.note}</div>
                    </div>
                    {r.tel && (
                      <a href={`tel:${r.tel}`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textDecoration: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "4px 10px", color: "#8B85A3" }}>Call</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom tab bar */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
          <div className="frame" style={{ display: "flex", background: "#151024", borderTop: "1px solid #2A2440", padding: "10px 6px calc(10px + env(safe-area-inset-bottom))" }}>
            {TABS.map((t) => {
              const active = view === t.id;
              return (
                <button key={t.id} onClick={() => setView(t.id)} className="tab-btn" style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 0" }}>
                  <Icon name={t.icon} active={active} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: active ? "#3DF2E0" : "#6C6786" }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crew compare
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Camp map
// ---------------------------------------------------------------------------

function CampMap({ friends, sharing, pins, myProfileId, onSetMyPin, isOnline, onQueue, currentFestival }) {
  const zones = FESTIVAL_CAMP_ZONES[currentFestival];
  const stages = FESTIVAL_STAGES[currentFestival] || [];
  const festival = FESTIVALS.find((f) => f.id === currentFestival);
  const hasCamping = !!zones;
  const stagesLabel = FESTIVAL_MAP_LABELS[currentFestival]?.stages || "STAGES";
  const campLabel = FESTIVAL_MAP_LABELS[currentFestival]?.camp;

  const [placing, setPlacing] = useState(false);
  const [openPin, setOpenPin] = useState(null);

  const myPin = (pins || []).find((p) => p.profile_id === myProfileId) || null;
  const viewH = hasCamping ? 470 : 240;

  function handleMapClick(e) {
    if (!placing || !hasCamping) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setPlacing(false);
    onSetMyPin(xPct, yPct, myPin?.note || "");
    if (!isOnline) onQueue && onQueue();
  }

  const crewPins = hasCamping
    ? friends
        .filter((f) => sharing[f.id])
        .map((f) => ({ ...f, pin: (pins || []).find((p) => p.profile_id === f.id) }))
        .filter((f) => f.pin)
    : [];
  const hiddenFriends = hasCamping ? friends.filter((f) => !sharing[f.id]) : [];
  const noPinFriends = hasCamping ? friends.filter((f) => sharing[f.id] && !(pins || []).some((p) => p.profile_id === f.id)) : [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: "#8B85A3", maxWidth: 260 }}>
          {hasCamping
            ? <>{stagesLabel} (stages) and {campLabel?.split(" — ")[0]} (camping) — simplified layout using real zone names. Tap the map to drop your pin.{!isOnline && " Pin still saves offline and syncs to your crew later."}</>
            : "Real stage layout. This festival has no on-site camping, so there's no camp section here to map."}
        </p>
        {hasCamping && (
          <button
            onClick={() => setPlacing((p) => !p)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              whiteSpace: "nowrap",
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${placing ? "#3DF2E0" : "#2A2440"}`,
              background: placing ? "rgba(61,242,224,0.12)" : "transparent",
              color: placing ? "#3DF2E0" : "#8B85A3",
              cursor: "pointer",
            }}
          >
            {placing ? "Tap map…" : "Set my pin"}
          </button>
        )}
      </div>

      <div
        onClick={handleMapClick}
        style={{
          position: "relative",
          border: "1px solid #2A2440",
          borderRadius: 14,
          overflow: "hidden",
          background: "#151024",
          cursor: placing && hasCamping ? "crosshair" : "default",
        }}
      >
        <svg viewBox={`0 0 400 ${viewH}`} width="100%" style={{ display: "block" }}>
          <rect x="0" y="0" width="400" height={viewH} fill="#151024" />
          <text x="14" y="16" fontFamily="'IBM Plex Mono', monospace" fontSize="9.5" fill="#3DF2E0" letterSpacing="1">{stagesLabel}</text>
          {hasCamping && (
            <>
              <rect x="0" y="240" width="400" height="12" fill="#1E1832" />
              <text x="14" y="230" fontFamily="'IBM Plex Mono', monospace" fontSize="9.5" fill="#5B5470" letterSpacing="1">{campLabel}</text>
            </>
          )}
          {/* Stages */}
          {stages.map((s, i) => {
            const cols = 3;
            const w = 115, h = 70;
            const x = 14 + (i % cols) * 125;
            const y = 24 + Math.floor(i / cols) * 84;
            return (
              <g key={s.id}>
                <rect x={x} y={y} width={w} height={h} rx={9} fill="#1A1428" stroke={s.color} strokeWidth="1" strokeOpacity="0.5" />
                <text x={x + 8} y={y + 20} fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill={s.color}>{s.name}</text>
              </g>
            );
          })}
          {/* Camp zones */}
          {hasCamping && zones.map((z) => (
            <g key={z.id}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={8} fill="#1A1428" stroke="#3A3552" strokeWidth="1" />
              <text x={z.x + 10} y={z.y + 18} fontFamily="'IBM Plex Mono', monospace" fontSize="9.5" fill="#5B5470">{z.name}</text>
            </g>
          ))}
          {/* Crew pins */}
          {crewPins.map((f) => {
            const px = (f.pin.x / 100) * 400;
            const py = (f.pin.y / 100) * viewH;
            return (
              <g key={f.id} onClick={(e) => { e.stopPropagation(); setOpenPin(f); }} style={{ cursor: "pointer" }}>
                <circle cx={px} cy={py} r="10" fill={f.color} stroke="#0F0B1A" strokeWidth="2" />
                <text x={px} y={py + 3.5} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fontWeight="700" fill="#0F0B1A">{f.initial}</text>
              </g>
            );
          })}
          {/* My pin */}
          {hasCamping && myPin && (() => {
            const px = (myPin.x / 100) * 400;
            const py = (myPin.y / 100) * viewH;
            return (
              <g>
                <circle cx={px} cy={py} r="11" fill="#F5F0FF" stroke="#3DF2E0" strokeWidth="2.5" />
                <text x={px} y={py + 4} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fontWeight="700" fill="#0F0B1A">YOU</text>
              </g>
            );
          })()}
        </svg>
      </div>

      {!hasCamping && (
        <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470" }}>
          {festival?.noCamping
            ? `No on-site camping at ${festival.name} — it's a day festival.`
            : "Camping grounds for this festival haven't been mapped yet."}
        </div>
      )}

      {openPin && (
        <div style={{ marginTop: 12, border: `1px solid ${openPin.color}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: openPin.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{openPin.initial}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{openPin.name}</div>
            <div style={{ fontSize: 12, color: "#8B85A3" }}>{openPin.pin.note}</div>
          </div>
          <button onClick={() => setOpenPin(null)} style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 16, cursor: "pointer" }}>×</button>
        </div>
      )}

      {hasCamping && (hiddenFriends.length > 0 || noPinFriends.length > 0) && (
        <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", lineHeight: 1.6 }}>
          {hiddenFriends.map((f) => f.name).join(", ")}
          {hiddenFriends.length > 0 ? " sharing off — pin hidden. " : ""}
          {noPinFriends.map((f) => f.name).join(", ")}
          {noPinFriends.length > 0 ? " hasn't dropped a pin yet." : ""}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discover — swipe through mid-match artists you don't know yet
// ---------------------------------------------------------------------------

function DiscoverDeck({ addedIds, onAdd, currentDay, currentFestival, stages }) {
  // The discover range is deliberately mid-tier: high enough to be a
  // plausible fit, low enough that it's not already on your schedule.
  const deck = SETS.filter((s) => s.festival === currentFestival && s.day === currentDay && s.match >= 40 && s.match < 80 && !addedIds.includes(s.id)).sort((a, b) => b.match - a.match);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState([]);

  const remaining = deck.filter((s) => !skipped.includes(s.id));
  const current = remaining[0];

  if (!current) {
    return (
      <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#8B85A3" }}>That's everyone in your discover range.</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", marginTop: 6 }}>
          {addedIds.length} added to your schedule this session
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", marginBottom: 10 }}>
        {remaining.length} left to discover
      </div>
      <div
        style={{
          border: `1px solid ${matchColor(current.match)}`, borderRadius: 16, padding: "22px 20px",
          background: "#1A1428",
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8B85A3" }}>
          {stages.find((st) => st.id === current.stage)?.name} · {fmtTime(current.start, current.day, current.festival)} · {current.genre}
        </span>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "0.5px", margin: "8px 0 6px" }}>
          {current.artist}
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: matchColor(current.match), border: `1px solid ${matchColor(current.match)}`, borderRadius: 6, padding: "3px 9px" }}>
          {current.match}% match
        </span>
        <p style={{ marginTop: 14, fontSize: 13.5, color: "#C9C3E0", lineHeight: 1.5, minHeight: 40 }}>
          {current.sounds_like || "New territory — not close to anything in your library yet."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={() => setSkipped((prev) => [...prev, current.id])}
          style={{
            flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "13px", borderRadius: 12,
            border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: "pointer",
          }}
        >
          Skip
        </button>
        <button
          onClick={() => onAdd(current.id)}
          style={{
            flex: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "13px", borderRadius: 12,
            border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer",
          }}
        >
          + Add to schedule
        </button>
      </div>
    </div>
  );
}

function CrewCompare({ friends, sharing, onToggleSharing, onSelect, currentDay, currentFestival }) {
  const rows = SETS.filter((s) => s.festival === currentFestival && s.day === currentDay && (s.match >= 50 || Object.values(FRIEND_MATCHES[s.id] || {}).some((v) => v >= 50))).sort((a, b) => a.start - b.start);
  return (
    <div style={{ border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead>
            <tr style={{ background: "#151024" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8B85A3", borderBottom: "1px solid #2A2440" }}>SET</th>
              <th style={{ textAlign: "center", padding: "10px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, borderBottom: "1px solid #2A2440" }}>You</th>
              {friends.map((f) => (
                <th key={f.id} style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #2A2440" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.initial}</span>
                    <button onClick={() => onToggleSharing(f.id)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, background: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "2px 6px", color: sharing[f.id] ? "#3DF2E0" : "#5B5470", cursor: "pointer" }}>
                      {sharing[f.id] ? "On" : "Off"}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
                <td style={{ padding: "9px 12px", borderBottom: "1px solid #201A33" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{s.artist}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470", marginTop: 2 }}>{fmtTime(s.start, s.day, s.festival)}</div>
                </td>
                <td style={{ textAlign: "center", padding: "9px", borderBottom: "1px solid #201A33" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: matchColor(s.match) }}>{s.match}%</span>
                </td>
                {friends.map((f) => {
                  const val = (FRIEND_MATCHES[s.id] || {})[f.id];
                  return (
                    <td key={f.id} style={{ textAlign: "center", padding: "9px", borderBottom: "1px solid #201A33" }}>
                      {!sharing[f.id] ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3A3552" }}>hidden</span>
                        : val != null ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: matchColor(val) }}>{val}%</span>
                        : <span style={{ color: "#3A3552", fontSize: 12 }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470", borderTop: "1px solid #2A2440" }}>
        "Hidden" = sharing off for this crew. Still a member, matches just aren't visible.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

function TierBadge({ username }) {
  const tier = getTier(USER_KARMA[username] ?? 0);
  return (
    <span
      title={`${tier.label} · ${(USER_KARMA[username] ?? 0).toLocaleString()} karma`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, whiteSpace: "nowrap",
        color: tier.color, border: `1px solid ${tier.color}`, borderRadius: 20, padding: "1px 6px 1px 5px",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: tier.color, flexShrink: 0 }} />
      {tier.label}
    </span>
  );
}

function Community({ isOnline, onQueue, currentFestival }) {
  const posts = FESTIVAL_POSTS[currentFestival] || [];
  const artistPosts = ARTIST_POSTS.filter((a) => a.festival === currentFestival);
  const [sort, setSort] = useState("hot");
  const [flairFilter, setFlairFilter] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [votes, setVotes] = useState({});
  const [pendingVotes, setPendingVotes] = useState({});
  const [myPosts, setMyPosts] = useState([]);
  const [extraComments, setExtraComments] = useState({}); // postId -> [comment, ...]
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeFlair, setComposeFlair] = useState("vibes");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeError, setComposeError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");

  function vote(id, base, delta) {
    if (!isOnline) {
      setPendingVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + delta }));
      onQueue && onQueue();
      return;
    }
    setVotes((prev) => {
      const current = prev[id] ?? base;
      const already = prev[id] != null;
      return { ...prev, [id]: already ? current : current + delta };
    });
  }

  function submitPost() {
    if (!composeTitle.trim()) {
      setComposeError("Write something first");
      return;
    }
    const newPost = {
      id: `mine-${Date.now()}`,
      flair: composeFlair,
      title: composeTitle.trim(),
      author: "you",
      votes: 1,
      time: isOnline ? "just now" : "queued",
      comments: [],
      queued: !isOnline,
    };
    setMyPosts((prev) => [newPost, ...prev]);
    setComposeTitle("");
    setComposeError("");
    setComposeOpen(false);
    if (!isOnline) onQueue && onQueue();
  }

  function submitReply(postId) {
    if (!replyText.trim()) {
      setReplyError("Write a reply first");
      return;
    }
    const newComment = { id: `mine-c-${Date.now()}`, author: "you", text: replyText.trim(), votes: 1, queued: !isOnline };
    setExtraComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
    setReplyText("");
    setReplyError("");
    if (!isOnline) onQueue && onQueue();
  }

  const allPosts = [
    ...myPosts,
    ...posts.map((p) => (extraComments[p.id] ? { ...p, comments: [...p.comments, ...extraComments[p.id]] } : p)),
  ];

  const sorted = allPosts.filter((p) => !flairFilter || p.flair === flairFilter).sort((a, b) => {
    const av = votes[a.id] ?? a.votes, bv = votes[b.id] ?? b.votes;
    if (sort === "top") return bv - av;
    if (sort === "new") return allPosts.indexOf(a) - allPosts.indexOf(b);
    return bv + a.comments.length - (av + b.comments.length);
  });

  if (openPost) {
    const p = allPosts.find((post) => post.id === openPost) || openPost;
    const v = (votes[p.id] ?? p.votes) + (pendingVotes[p.id] || 0);
    return (
      <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "16px 16px" }}>
        <button onClick={() => setOpenPost(null)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B85A3", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}>← back</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: FLAIRS[p.flair].color, border: `1px solid ${FLAIRS[p.flair].color}`, borderRadius: 5, padding: "2px 7px" }}>{FLAIRS[p.flair].label}</span>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 700, margin: "10px 0 4px" }}>{p.title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", marginBottom: 12 }}>
          <span>u/{p.author}</span>
          <TierBadge username={p.author} />
          <span>· {p.time} · {v} upvotes{pendingVotes[p.id] ? " · queued" : ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {p.comments.length === 0 && <p style={{ fontSize: 13, color: "#5B5470" }}>No comments yet — be the first to reply.</p>}
          {p.comments.map((c) => {
            const cv = (votes[c.id] ?? c.votes) + (pendingVotes[c.id] || 0);
            return (
              <div key={c.id} style={{ borderLeft: "2px solid #2A2440", paddingLeft: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>
                  <span>u/{c.author}</span>
                  <TierBadge username={c.author} />
                </div>
                <p style={{ fontSize: 13, color: "#E4DFF5", margin: "3px 0 6px", lineHeight: 1.5 }}>{c.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => vote(c.id, c.votes, 1)} style={voteBtnStyle}>▲</button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: pendingVotes[c.id] ? "#FFB23D" : "#8B85A3" }}>{cv}</span>
                  <button onClick={() => vote(c.id, c.votes, -1)} style={voteBtnStyle}>▼</button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
          <textarea
            value={replyText}
            onChange={(e) => { setReplyText(e.target.value); if (replyError) setReplyError(""); }}
            placeholder="Add a reply…"
            rows={2}
            style={{
              width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F5F0FF",
              background: "#1A1428", border: `1px solid ${replyError ? "#FF3DA6" : "#2A2440"}`, borderRadius: 10,
              padding: "9px 11px", resize: "none", outline: "none",
            }}
          />
          {replyError && <p style={{ fontSize: 11, color: "#FF3DA6", margin: "5px 0 0" }}>{replyError}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={() => submitReply(p.id)}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 14px", borderRadius: 8, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer" }}
            >
              {isOnline ? "Reply" : "Queue reply"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["hot", "new", "top"].map((s) => (
            <button key={s} onClick={() => setSort(s)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, border: "1px solid " + (sort === s ? "#3DF2E0" : "#2A2440"), background: sort === s ? "rgba(61,242,224,0.1)" : "transparent", color: sort === s ? "#3DF2E0" : "#8B85A3", cursor: "pointer" }}>{s}</button>
          ))}
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "6px 12px", borderRadius: 7, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + New post
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(FLAIRS).map(([key, f]) => (
          <button key={key} onClick={() => setFlairFilter(flairFilter === key ? null : key)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "4px 9px", borderRadius: 20, border: `1px solid ${flairFilter === key ? f.color : "#2A2440"}`, background: flairFilter === key ? `${f.color}1A` : "transparent", color: flairFilter === key ? f.color : "#8B85A3", cursor: "pointer" }}>{f.label}</button>
        ))}
      </div>

      {composeOpen && (
        <div style={{ border: "1px solid #3DF2E0", borderRadius: 12, padding: "12px 14px", marginBottom: 14, background: "#1A1428" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.entries(FLAIRS).map(([key, f]) => (
              <button
                key={key}
                onClick={() => setComposeFlair(key)}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "3px 8px", borderRadius: 20, border: `1px solid ${composeFlair === key ? f.color : "#2A2440"}`, background: composeFlair === key ? `${f.color}1A` : "transparent", color: composeFlair === key ? f.color : "#8B85A3", cursor: "pointer" }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <textarea
            value={composeTitle}
            onChange={(e) => { setComposeTitle(e.target.value); if (composeError) setComposeError(""); }}
            placeholder="What's going on at the festival?"
            rows={2}
            style={{
              width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F5F0FF",
              background: "#151024", border: `1px solid ${composeError ? "#FF3DA6" : "#2A2440"}`, borderRadius: 10,
              padding: "9px 11px", resize: "none", outline: "none",
            }}
          />
          {composeError && <p style={{ fontSize: 11, color: "#FF3DA6", margin: "5px 0 0" }}>{composeError}</p>}
          {!isOnline && <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0" }}>Offline — this will post once you're back online.</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button onClick={() => { setComposeOpen(false); setComposeError(""); }} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 12px", borderRadius: 8, border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: "pointer" }}>Cancel</button>
            <button onClick={submitPost} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 14px", borderRadius: 8, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer" }}>
              {isOnline ? "Post" : "Queue post"}
            </button>
          </div>
        </div>
      )}

      {artistPosts.filter((a) => ARTIST_VERIFICATION[a.artistOf] === "verified").length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {artistPosts.filter((a) => ARTIST_VERIFICATION[a.artistOf] === "verified").map((a) => (
            <div key={a.id} style={{ border: "1px solid #FFB23D", borderRadius: 12, padding: "11px 12px", background: "rgba(255,178,61,0.08)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#FFB23D", letterSpacing: "0.3px" }}>
                <Icon name="verified" /> VERIFIED ARTIST · {a.artist.toUpperCase()}
              </span>
              <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 5px", lineHeight: 1.35, color: "#FFD9A0" }}>{a.title}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#C9915C" }}>{a.time} · {a.votes} upvotes</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((p) => {
          const v = (votes[p.id] ?? p.votes) + (pendingVotes[p.id] || 0);
          return (
            <div key={p.id} style={{ display: "flex", gap: 10, border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px", background: "#161225" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 26 }}>
                <button onClick={() => vote(p.id, p.votes, 1)} style={voteBtnStyle}>▲</button>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: pendingVotes[p.id] ? "#FFB23D" : "#F5F0FF" }}>{v}</span>
                <button onClick={() => vote(p.id, p.votes, -1)} style={voteBtnStyle}>▼</button>
              </div>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setOpenPost(p.id)}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: FLAIRS[p.flair].color, border: `1px solid ${FLAIRS[p.flair].color}`, borderRadius: 5, padding: "1px 6px" }}>{FLAIRS[p.flair].label}</span>
                <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 5px", lineHeight: 1.35 }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>
                  <span>u/{p.author}</span>
                  <TierBadge username={p.author} />
                  <span>· {p.time} · {p.comments.length} comments</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
