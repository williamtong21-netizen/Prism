import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useAuth } from "./lib/useAuth";
import { usePackingState } from "./lib/usePackingState";
import { useNotifications } from "./lib/useNotifications";
import { useCrews } from "./lib/useCrews";
import { useDMs } from "./lib/useDMs";
import { useCampPins } from "./lib/useCampPins";
import { usePushSubscription } from "./lib/usePushSubscription";
import { useSpotify } from "./lib/useSpotify";
import { useSpotifyMatch } from "./lib/useSpotifyMatch";
import { useBlocking } from "./lib/useBlocking";
import { useSchedulePicks } from "./lib/useSchedulePicks";
import { useFestivalRequests } from "./lib/useFestivalRequests";
import { useFestivalSets } from "./lib/useFestivalSets";

// Lazy-loaded so a first-time visitor's sign-in screen doesn't have to fetch
// this code before they're even signed in — see src/components/CommunityViews.jsx.
const DiscoverDeck = lazy(() => import("./components/CommunityViews").then((m) => ({ default: m.DiscoverDeck })));
const CrewCompare = lazy(() => import("./components/CommunityViews").then((m) => ({ default: m.CrewCompare })));
const Community = lazy(() => import("./components/CommunityViews").then((m) => ({ default: m.Community })));

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

// Real Bonnaroo 2026 stage names and Friday, June 12 set times (from public
// schedule listings). match/sounds_like/sources below are still simulated
// placeholders layered on top of the real lineup data -- but if a connected
// profile's own top-20 Spotify artists includes one of these acts, that one
// gets overridden to a real 100% (see effectiveSets in FestivalOptimizer).
// Nothing else here is derived from a real listening history: genre-based
// partial matching isn't possible under Spotify's current Development Mode
// restrictions (top artists come back with no genre tags at all).
//
// Stages and days are scoped per festival so the picker can actually switch
// between festivals rather than just relabeling Bonnaroo's data.
const FESTIVAL_STAGES = {
  // "Where Stage" is a real new-for-2026 6th stage (Centeroo, late-night
  // bass/electronic programming Fri-Sat) confirmed via The Daily
  // Frequency's coverage -- was missing entirely before.
  bonnaroo: [
    { id: "what", name: "What Stage", color: "#3DF2E0" },
    { id: "which", name: "Which Stage", color: "#FF3DA6" },
    { id: "this", name: "This Tent", color: "#FFB23D" },
    { id: "that", name: "That Tent", color: "#9D6BFF" },
    { id: "other", name: "Other Tent", color: "#5FD97A" },
    { id: "where", name: "Where Stage", color: "#4D96FF" },
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
  // Real Secret Dreams 2026 stage names (PG Stage, Woods Stage), read
  // directly off the festival's own official camping + grounds map
  // (secretdreamsfest.com/about-1-1) for its new Cardinal Center venue.
  "secret-dreams": [
    { id: "pg", name: "PG Stage", color: "#3DF2E0" },
    { id: "woods", name: "Woods Stage", color: "#9D6BFF" },
  ],
  // Real Reading & Leeds 2026 stage names, per readingfestival.com/lineup's
  // own stage filter (The Grid, The Gallery presented by Budweiser, The
  // Warehouse, The Ballroom, The Canopy).
  "reading-leeds": [
    { id: "grid", name: "The Grid", color: "#3DF2E0" },
    { id: "gallery", name: "The Gallery", color: "#FF3DA6" },
    { id: "warehouse", name: "The Warehouse", color: "#9D6BFF" },
    { id: "ballroom", name: "The Ballroom", color: "#FFB23D" },
    { id: "canopy", name: "The Canopy", color: "#5FD97A" },
  ],
  // Real Rock in Rio 2026 stage names, per rockinrio.com/rio/pt-br/line-up/'s
  // own stage headers (Palco Mundo, Palco Sunset, New Dance Order, Espaço
  // Favela, Global Village, Supernova).
  "rock-in-rio": [
    { id: "mainstage", name: "Palco Mundo", color: "#3DF2E0" },
    { id: "sunset", name: "Palco Sunset", color: "#FF3DA6" },
    { id: "newdanceorder", name: "New Dance Order", color: "#9D6BFF" },
    { id: "favela", name: "Espaço Favela", color: "#FFB23D" },
    { id: "globalvillage", name: "Global Village", color: "#5FD97A" },
    { id: "supernova", name: "Supernova", color: "#FF7A3D" },
  ],
  // Real Louder Than Life 2026 stage names, per therockfather.com's own
  // set-times coverage (Louder, Life, Decibel, Reverb, Loudmouth, Impact,
  // Big Bourbon Bar -- all 7 stages).
  "louder-than-life": [
    { id: "louder", name: "Louder Stage", color: "#3DF2E0" },
    { id: "life", name: "Life Stage", color: "#FF3DA6" },
    { id: "decibel", name: "Decibel Stage", color: "#9D6BFF" },
    { id: "reverb", name: "Reverb Stage", color: "#FFB23D" },
    { id: "loudmouth", name: "Loudmouth Stage", color: "#5FD97A" },
    { id: "impact", name: "Impact Stage", color: "#FF7A3D" },
    { id: "bigbourbon", name: "Big Bourbon Bar", color: "#7ADFFF" },
  ],
  // Real Riot Fest 2026 stage names, per riotfest.org's own official daily
  // schedule graphics (Riot, Roots, Rebel, Rise, Radical -- all 5 stages).
  "riot-fest": [
    { id: "riot", name: "Riot Stage", color: "#3DF2E0" },
    { id: "roots", name: "Roots Stage", color: "#FF3DA6" },
    { id: "rebel", name: "Rebel Stage", color: "#9D6BFF" },
    { id: "rise", name: "Rise Stage", color: "#FFB23D" },
    { id: "radical", name: "Radical Stage", color: "#5FD97A" },
  ],
  // Nocturnal Wonderland 2026's own lineup page only groups artists by day,
  // not by stage or time (confirmed via nocturnalwonderland.com/lineup and
  // its official poster) -- the venue's 4 real stages (per
  // nocturnalwonderland.com/experience/stages: Mystic Wild, Dawn Mountain,
  // Aurora Plains, Rave Cave) aren't mapped to specific artists anywhere
  // public yet. Rather than guess which of the 4 each headliner plays, the
  // handful of real, day-confirmed headliners loaded (see festival_sets)
  // all sit under a single stage placeholder pending a real breakdown.
  "nocturnal-wonderland": [
    { id: "mysticwild", name: "Mystic Wild (stage TBA)", color: "#3DF2E0" },
  ],
  // Real Bourbon & Beyond 2026 stage names + full per-day set times, per
  // bourbonandbeyond.com's own official TIMELINE schedule widget (all 5
  // stages, all 4 days extracted directly from the live widget).
  "bourbon-and-beyond": [
    { id: "oak", name: "Oak Stage", color: "#3DF2E0" },
    { id: "barrel", name: "Barrel Stage", color: "#FF3DA6" },
    { id: "100proof", name: "100 Proof Stage", color: "#9D6BFF" },
    { id: "revival", name: "Revival Stage", color: "#FFB23D" },
    { id: "bluegrass", name: "The Bluegrass Situation Stage", color: "#5FD97A" },
  ],
  // All Things Go 2026 (DC/Columbia MD edition)'s own site confirms the
  // full real per-day lineup (see allthingsgofestival.com/dmv) and that the
  // venue has two real stages (Pavilion Stage, Chrysalis Stage, per the
  // ticket tiers' own wording) -- but doesn't publish which artist plays
  // which stage or at what time anywhere public yet. Same call as
  // Nocturnal Wonderland: rather than guess a stage/time grid, only the
  // clear top-billed acts per day are loaded (see festival_sets) under one
  // honestly-labeled placeholder.
  "all-things-go": [
    { id: "stage-tba", name: "Pavilion / Chrysalis (stage TBA)", color: "#3DF2E0" },
  ],
  // Real Shaky Knees 2026 stage names + full per-day set times, per
  // shakykneesfestival.com's own official daily schedule graphics (all 4
  // stages, all 3 days).
  "shaky-knees": [
    { id: "peachtree", name: "Peachtree Stage", color: "#3DF2E0" },
    { id: "piedmont", name: "Piedmont Stage", color: "#FF3DA6" },
    { id: "poncedeleon", name: "Ponce de Leon Stage", color: "#9D6BFF" },
    { id: "criminalrecords", name: "Criminal Records Stage", color: "#FFB23D" },
  ],
  // Real Aftershock 2026 stage names + full per-day set times, per the
  // festival's own official schedule release (all 5 stages, all 4 days).
  aftershock: [
    { id: "aftershock", name: "Aftershock Stage", color: "#3DF2E0" },
    { id: "shockwave", name: "Shockwave Stage", color: "#FF3DA6" },
    { id: "thepoint", name: "The Point Stage", color: "#9D6BFF" },
    { id: "faultline", name: "Faultline Stage", color: "#FFB23D" },
    { id: "epicenter", name: "Epicenter Stage", color: "#5FD97A" },
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
  // Bonnaroo, Governors Ball, and Lollapalooza (Chicago)'s 2026 editions have
  // already passed as of today; their `dates` strings below reflect the
  // real, current status of each rather than a guessed 2027 date -- see the
  // per-entry comments for sourcing. A non-parseable `dates` string (no
  // "Mon D...,YYYY" shape) is intentional: festivalStartDate() then returns
  // null for it, which correctly keeps it out of getDefaultFestival()'s
  // "soonest upcoming" pick without needing a separate status field.
  { id: "bonnaroo", name: "Bonnaroo", location: "Manchester, TN", dates: "On hiatus for 2027 — organizers say The Farm needs to recover after storm damage", hasData: true },
  { id: "coachella", name: "Coachella", location: "Indio, CA", dates: "Apr 9–11 & 16–18, 2027", hasData: true },
  { id: "edc-vegas", name: "EDC Las Vegas", location: "Las Vegas, NV", dates: "May 14–16 & 21–23, 2027", hasData: true, noCamping: true, note: "First year expanding to two weekends." },
  { id: "electric-forest", name: "Electric Forest", location: "Rothbury, MI", dates: "Jun 24–27, 2027", hasData: true, note: "Widely reported but not yet confirmed on the festival's own site." },
  { id: "governors-ball", name: "Governors Ball", location: "New York, NY", dates: "2027 dates not yet announced", hasData: true, noCamping: true },
  { id: "lollapalooza", name: "Lollapalooza", location: "Chicago, IL", dates: "2027 dates not yet announced", hasData: true, noCamping: true },
  { id: "outside-lands", name: "Outside Lands", location: "San Francisco, CA", dates: "Aug 6–8, 2027", hasData: true, noCamping: true },
  { id: "acl", name: "Austin City Limits", location: "Austin, TX", dates: "Oct 2–4 & 9–11, 2026", hasData: true, noCamping: true },
  { id: "tomorrowland", name: "Tomorrowland", location: "Boom, Belgium", dates: "Jul 17–19 & 24–26, 2027", hasData: true },
  { id: "lost-lands", name: "Lost Lands", location: "Thornville, OH", dates: "Sep 18–20, 2026", hasData: true },
  { id: "ultra-miami", name: "Ultra Miami", location: "Miami, FL", dates: "Mar 26–28, 2027", hasData: true, noCamping: true },
  { id: "ultra-europe", name: "Ultra Europe", location: "Split, Croatia", dates: "Jul 9–11, 2027", hasData: true, noCamping: true },
  { id: "tomorrowland-winter", name: "Tomorrowland Winter", location: "Alpe d'Huez, France", dates: "Mar 20–27, 2027", hasData: true, noCamping: true },
  { id: "edc-orlando", name: "EDC Orlando", location: "Orlando, FL", dates: "Nov 6–8, 2026", hasData: true, noCamping: true },
  // Real confirmed dates (the official 2026 poster) are Feb 20-22, 2026 --
  // already passed as of today, unlike this app's other 2027-dated
  // festivals. Corrected from a wrong "Feb 19-21, 2027" placeholder.
  { id: "edc-mexico", name: "EDC Mexico", location: "Mexico City, Mexico", dates: "Feb 20–22, 2026", hasData: true, noCamping: true },
  { id: "lollapalooza-argentina", name: "Lollapalooza Argentina", location: "Buenos Aires, Argentina", dates: "Mar 12–14, 2027", hasData: true, noCamping: true },
  { id: "lollapalooza-berlin", name: "Lollapalooza Berlin", location: "Berlin, Germany", dates: "Jul 17–18, 2027", hasData: true, noCamping: true },
  { id: "secret-dreams", name: "Secret Dreams", location: "Marengo, OH", dates: "Sep 3–6, 2026", hasData: true },
  // Newly added -- real festivals with confirmed dates, but no lineup/map
  // data built out yet (see the `hasData: false` "Request data" flow in the
  // festival picker rather than faking a schedule for any of these).
  { id: "shaky-knees", name: "Shaky Knees", location: "Atlanta, GA", dates: "Sep 18–20, 2026", hasData: true },
  { id: "hangout", name: "Hangout Music Festival", location: "Gulf Shores, AL", dates: "May 20–23, 2027", noCamping: true },
  { id: "primavera-sound", name: "Primavera Sound", location: "Barcelona, Spain", dates: "Jun 3–5, 2027", noCamping: true },
  { id: "glastonbury", name: "Glastonbury", location: "Pilton, England", dates: "Jun 23–27, 2027" },
  // Added from Music Festival Wizard's Top 50 Most Popular Fests in the
  // USA -- real, confirmed-date, well-known recurring festivals not yet
  // in the app. Same `hasData: false` pattern as the batch above: no
  // fabricated schedule, just enough to track/follow. A few other MFW
  // Top 50 names (When We Were Young, Rolling Loud Cali/USA, One
  // MusicFest) were skipped here because MFW's own pages list their next
  // edition as cancelled or unconfirmed as of this writing.
  { id: "camp-flog-gnaw", name: "Camp Flog Gnaw Carnival", location: "Los Angeles, CA", dates: "Nov 14–15, 2026", noCamping: true },
  { id: "louder-than-life", name: "Louder Than Life", location: "Louisville, KY", dates: "Sep 17–20, 2026", hasData: true },
  { id: "summer-smash", name: "Summer Smash Festival", location: "Chicago, IL", dates: "2027 dates not yet announced", noCamping: true },
  { id: "sonic-temple", name: "Sonic Temple Festival", location: "Columbus, OH", dates: "May 13–16, 2027" },
  { id: "aftershock", name: "Aftershock Festival", location: "Sacramento, CA", dates: "Oct 1–4, 2026", hasData: true },
  { id: "dreamville", name: "Dreamville Festival", location: "Raleigh, NC", dates: "2027 dates not yet announced", noCamping: true },
  { id: "all-things-go", name: "All Things Go Festival", location: "Columbia, MD", dates: "Sep 25–27, 2026", hasData: true, noCamping: true },
  { id: "riot-fest", name: "Riot Fest", location: "Chicago, IL", dates: "Sep 18–20, 2026", hasData: true, noCamping: true },
  { id: "boston-calling", name: "Boston Calling", location: "Allston, MA", dates: "Jun 4–6, 2027", noCamping: true },
  { id: "nocturnal-wonderland", name: "Nocturnal Wonderland", location: "San Bernardino, CA", dates: "Sep 19–20, 2026", hasData: true },
  { id: "wakaan", name: "Wakaan Music Festival", location: "Ozark, AR", dates: "Oct 1–3, 2026" },
  { id: "new-orleans-jazz-fest", name: "New Orleans Jazz Fest", location: "New Orleans, LA", dates: "Apr 22–May 2, 2027", noCamping: true },
  { id: "bourbon-and-beyond", name: "Bourbon & Beyond", location: "Louisville, KY", dates: "Sep 24–27, 2026", hasData: true },
  // A small, deliberately short list of internationally major festivals --
  // the app stays US-focused overall, but these are too iconic/globally
  // recognized to leave out. Sourced the same way as the batch above (MFW's
  // Europe Top 50 + Rock in Rio's own real confirmed dates).
  { id: "rock-in-rio", name: "Rock in Rio", location: "Rio de Janeiro, Brazil", dates: "Sep 4–13, 2026", hasData: true, noCamping: true },
  { id: "reading-leeds", name: "Reading & Leeds Festival", location: "Reading, UK", dates: "Aug 27–30, 2026", hasData: true },
  { id: "sziget", name: "Sziget Festival", location: "Budapest, Hungary", dates: "Aug 10–14, 2027" },
  { id: "wacken", name: "Wacken Open Air", location: "Wacken, Germany", dates: "Jul 28–31, 2027" },
  { id: "rock-am-ring", name: "Rock am Ring", location: "Nürburg, Germany", dates: "Jun 4–6, 2027" },
  { id: "download-festival", name: "Download Festival", location: "Donington Park, UK", dates: "Jun 9–13, 2027" },
];

// US_STATE_CODES lets festivalRegion() tell "Austin, TX" (USA) apart from
// "Berlin, Germany" (Europe) using the same `location` string already on
// every festival, rather than adding a parallel `region` field to keep in
// sync by hand.
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC",
]);
const COUNTRY_REGION = {
  Belgium: "Europe", Croatia: "Europe", France: "Europe", Germany: "Europe", UK: "Europe",
  England: "Europe", Hungary: "Europe", Spain: "Europe",
  Mexico: "Latin America", Argentina: "Latin America", Brazil: "Latin America",
};
const FESTIVAL_REGIONS = ["USA", "Europe", "Latin America"];
function festivalRegion(f) {
  const last = f.location.split(",").pop().trim();
  if (US_STATE_CODES.has(last)) return "USA";
  return COUNTRY_REGION[last] || "Other";
}

const MONTH_ABBR = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// Every FESTIVALS.dates string starts with "Mon D" (the first day of the
// event, even for multi-weekend ones like "Oct 2–4 & 9–11, 2026") and ends
// with a bare ", YYYY" -- enough to get a real start date without needing
// a full date-range parser.
function festivalStartDate(f) {
  const day = f.dates.match(/^([A-Za-z]{3})[a-z]*\s+(\d{1,2})/);
  const year = f.dates.match(/(\d{4})\s*$/);
  if (!day || !year || !(day[1] in MONTH_ABBR)) return null;
  return new Date(Number(year[1]), MONTH_ABBR[day[1]], Number(day[2]));
}

// A single hardcoded "home" festival made every first-time visitor land on
// the same one regardless of the actual calendar -- picks whichever real
// festival is coming up soonest instead, falling back to the earliest-dated
// one if every date in FESTIVALS has already passed (e.g. testing in
// December against a data set that ends in November).
function getDefaultFestival() {
  const now = new Date();
  const dated = FESTIVALS.map((f) => ({ f, d: festivalStartDate(f) })).filter((x) => x.d);
  const upcoming = dated.filter((x) => x.d >= now).sort((a, b) => a.d - b.d);
  if (upcoming.length) return upcoming[0].f.id;
  const earliest = dated.sort((a, b) => a.d - b.d);
  return earliest[0]?.f.id || FESTIVALS[0].id;
}

const DOW_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Generates `count` consecutive calendar days starting (year, month,
// startDate) sharing one gate/first-set time -- covers the common case of
// a festival with no day-specific published start time. `label`/`date` are
// always the real calendar weekday/date; `id` normally is too, EXCEPT for
// day one when `firstId` is passed -- that pins the bucket key so it keeps
// matching whatever day_id existing festival_sets rows already use, even
// on a festival (like Tomorrowland some years) whose real first day isn't
// a Friday. `suffix` (e.g. "2") gives a second weekend its own id space
// without colliding with the first, so a two-weekend festival is just two
// calls: consecutiveDays(y, m, d1, n, t) and consecutiveDays(y, m, d2, n, t, { suffix: "2" }).
function consecutiveDays(year, month, startDate, count, startMin, { firstId, suffix = "" } = {}) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(year, month, startDate + i);
    const dow = date.getDay();
    const id = (i === 0 && firstId ? firstId : DOW_IDS[dow]) + suffix;
    days.push({ id, label: DOW_LABELS[dow], date: `${SHORT_MONTHS[month]} ${startDate + i}`, startMin });
  }
  return days;
}

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
  // Electric Forest is Thu–Sun; only Thursday has any published lineup
  // data so far (see festival_sets), but the other three days are real and
  // shown anyway -- same pattern as Bonnaroo's lightest day below.
  "electric-forest": consecutiveDays(2027, 5, 24, 4, 18 * 60 + 30),
  // "Dates not yet announced" (see FESTIVALS) -- no fixed date to expand
  // against, so this stays a single placeholder day rather than a guess.
  "governors-ball": [
    { id: "sat", label: "Sat", date: "Jun 6", startMin: 12 * 60 },
  ],
  lollapalooza: [
    { id: "sat", label: "Sat", date: "Aug 1", startMin: 12 * 60 },
  ],
  "outside-lands": consecutiveDays(2027, 7, 6, 3, 15 * 60),
  // Two weekends (see FESTIVALS) -- second weekend reuses the same
  // weekday ids with a "2" suffix, same convention as Coachella above.
  // Noon start covers the real full-day lineup now loaded (see
  // festival_sets) -- the previous 6pm marker only reflected the 3
  // headliner-adjacent sets originally on file.
  acl: [...consecutiveDays(2026, 9, 2, 3, 12 * 60), ...consecutiveDays(2026, 9, 9, 3, 12 * 60, { suffix: "2" })],
  "edc-vegas": [...consecutiveDays(2027, 4, 14, 3, 21 * 60), ...consecutiveDays(2027, 4, 21, 3, 21 * 60, { suffix: "2" })],
  // Tomorrowland 2027's confirmed dates (Jul 17–19 & 24–26) actually land
  // on Sat–Mon, not the usual Fri–Sun -- firstId keeps the existing
  // festival_sets rows (tagged day_id "fri"/"fri2") pointing at the right
  // day even though its real label is "Sat", rather than needing a data
  // migration just because the calendar shifted this year.
  tomorrowland: [
    ...consecutiveDays(2027, 6, 17, 3, 14 * 60, { firstId: "fri" }),
    ...consecutiveDays(2027, 6, 24, 3, 14 * 60, { firstId: "fri", suffix: "2" }),
  ],
  "lost-lands": consecutiveDays(2026, 8, 18, 3, 18 * 60),
  // Grid starts at 4pm, matching the confirmed 4:00pm start of Frank Walker's
  // Main Stage set (Miami New Times' published 2026 set times).
  "ultra-miami": consecutiveDays(2027, 2, 26, 3, 16 * 60),
  // Grid starts at 8pm, matching the confirmed doors/first-set time on
  // ultraeurope.com's published 2026 set times.
  "ultra-europe": consecutiveDays(2027, 6, 9, 3, 20 * 60),
  // DJ Mag's Tomorrowland Winter 2026 coverage confirms specific artists on
  // specific days (see the festival_sets table) but not a published daily
  // set-time grid, so these are generic evening-start markers -- only the
  // two days with confirmed artists are modeled, not the full Mar 20–27
  // run (a ski festival spans far more days than it has concert content).
  // 2027's real Sat/Sun fall on Mar 20/21 (previously mislabeled Mar 21/22).
  "tomorrowland-winter": [
    { id: "sat", label: "Sat", date: "Mar 20", startMin: 18 * 60 },
    { id: "sun", label: "Sun", date: "Mar 21", startMin: 18 * 60 },
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
  // Full real 3-day grid (Feb 20-22, 2026) now that the complete official
  // poster is loaded -- previously only 2 sparse days existed under a
  // wrong 2027 date.
  "edc-mexico": consecutiveDays(2026, 1, 20, 3, 16 * 60),
  // Grid starts at 7pm, matching Katseye's confirmed Friday opening slot
  // (perfil.com / lanacion.com.ar's published 2026 day-by-day schedules).
  // 2027's real Fri/Sun fall on Mar 12/14 (previously mislabeled Mar 13/15);
  // Saturday has no lineup data yet but is a real day of the festival, so
  // it's shown (empty) rather than skipped, same as Electric Forest above.
  "lollapalooza-argentina": [
    { id: "fri", label: "Fri", date: "Mar 12", startMin: 19 * 60 },
    { id: "sat", label: "Sat", date: "Mar 13", startMin: 19 * 60 },
    { id: "sun", label: "Sun", date: "Mar 14", startMin: 18 * 60 + 45 },
  ],
  // Grid starts at noon, matching Baran Kok's confirmed Essence Stage
  // opening set time (timeout.com/festivawl.com's published 2026 set times).
  "lollapalooza-berlin": consecutiveDays(2027, 6, 17, 2, 12 * 60),
  // Secret Dreams 2026's new venue (The Cardinal Center, Marengo OH).
  // Official dates are Fri–Sun Sep 4–6; Thursday Sep 3 is a separate
  // pre-party rather than part of the paid festival days proper. No
  // published set-time grid yet, so these are generic start markers.
  "secret-dreams": [
    { id: "thu", label: "Thu", date: "Sep 3", startMin: 19 * 60 },
    { id: "fri", label: "Fri", date: "Sep 4", startMin: 14 * 60 },
    { id: "sat", label: "Sat", date: "Sep 5", startMin: 13 * 60 },
    { id: "sun", label: "Sun", date: "Sep 6", startMin: 13 * 60 },
  ],
  // Reading & Leeds 2026 runs Aug 27-30; day one is arrival/campsite-opening
  // only (no acts play, per readingfestival.com/lineup only listing
  // Fri/Sat/Sun) but is shown anyway, same as Electric Forest's empty first
  // day above. Noon start matches the earliest slot used for the real
  // day/stage data now loaded (see festival_sets).
  "reading-leeds": consecutiveDays(2026, 7, 27, 4, 12 * 60),
  // Rock in Rio 2026 is a biannual, two-weekend festival: Sep 4-7 (real
  // Fri-Mon) + Sep 11-13 (real Fri-Sun), per rockinrio.com's own dates
  // banner ("4, 5, 6, 7, 11, 12 E 13.SET 2026"). Noon start matches the
  // earliest slot used for the real day/stage data now loaded.
  "rock-in-rio": [...consecutiveDays(2026, 8, 4, 4, 12 * 60), ...consecutiveDays(2026, 8, 11, 3, 12 * 60, { suffix: "2" })],
  // Louder Than Life 2026 (Sep 17-20). Gates open 10:45am daily per
  // therockfather.com's coverage -- matches the offset baseline used for
  // the real set times now loaded (see festival_sets).
  "louder-than-life": consecutiveDays(2026, 8, 17, 4, 10 * 60 + 45),
  // Riot Fest 2026 (Sep 18-20). Gates open 11:30am per riotfest.org's own
  // daily schedule graphics -- matches the offset baseline used for the
  // real set times now loaded.
  "riot-fest": consecutiveDays(2026, 8, 18, 3, 11 * 60 + 30),
  // Nocturnal Wonderland 2026 (Sep 19-20), 3pm-12am daily per Insomniac's
  // own event listing.
  "nocturnal-wonderland": consecutiveDays(2026, 8, 19, 2, 15 * 60),
  // Bourbon & Beyond 2026 (Sep 24-27). Earliest published set across all 4
  // days/5 stages is 11:45am (Sunday's Barrel Stage) per bourbonandbeyond.com's
  // own TIMELINE widget -- 11:30am offset baseline matches the real set
  // times now loaded (see festival_sets).
  "bourbon-and-beyond": consecutiveDays(2026, 8, 24, 4, 11 * 60 + 30),
  // All Things Go 2026 (DC/Columbia MD), Fri-Sun Sep 25-27. No real gates
  // time published (no set-time grid exists at all -- see FESTIVAL_STAGES
  // note) -- 3pm is just a display anchor for the placeholder evening slots.
  "all-things-go": consecutiveDays(2026, 8, 25, 3, 15 * 60),
  // Shaky Knees 2026 (Piedmont Park, Atlanta, Sep 18-20). Friday doors
  // 4:00pm; Saturday/Sunday doors 11:30am -- per the festival's own
  // schedule graphics. Different per-day start times, so this is a manual
  // array rather than consecutiveDays().
  "shaky-knees": [
    { id: "fri", label: "Fri", date: "Sep 18", startMin: 16 * 60 },
    { id: "sat", label: "Sat", date: "Sep 19", startMin: 11 * 60 + 30 },
    { id: "sun", label: "Sun", date: "Sep 20", startMin: 11 * 60 + 30 },
  ],
  // Aftershock 2026 (Discovery Park, Sacramento, Oct 1-4). 11:30am is the
  // earliest confirmed slot every day per the official schedule release.
  aftershock: consecutiveDays(2026, 9, 1, 4, 11 * 60 + 30),
};

// Flattened for fmtTime's lookup — day ids are only unique within a
// festival, so fmtTime needs both to resolve the right start time.
const ALL_DAYS = Object.entries(FESTIVAL_DAYS).flatMap(([festivalId, days]) => days.map((d) => ({ ...d, festivalId })));

// Pool the "Simulate a notification" button picks from — stands in for
// server-side events (an artist post, a set reminder) until those are real.
const NOTIFICATION_POOL = [
  { type: "set", title: "OBSIDIAN starts in 15 minutes", body: "What Stage · your #1 match tonight" },
  { type: "artist", title: "RÜFÜS DU SOL posted an update", body: "Closing set is a full production reset — new visuals, new edits" },
  { type: "community", title: "Your crew is talking", body: "3 new replies in a thread you posted" },
];

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

// Real, general safety resources. On-site medical locations are keyed per
// festival since a named tent/plaza is only meaningful (and only true) for
// the festival it actually belongs to — showing Bonnaroo's Centeroo/Outeroo
// tents while browsing Governors Ball would be actively wrong, not just
// unhelpful. Only add a festival here once its real tent names/locations
// are confirmed; every other festival falls back to safe, general guidance
// that doesn't invent place names we haven't verified.
const SAFETY_INFO = {
  medicalByFestival: {
    bonnaroo: [
      { name: "Centeroo Medical", note: "Near What Stage, marked with a red cross flag" },
      { name: "Outeroo Medical — Plaza 6", note: "24/7, closest to camping" },
    ],
  },
  medicalFallback: [
    { name: "Ask any staff, security, or vendor", note: "They can point you to the nearest medical tent or radio one in" },
    { name: "Check the festival's app or text alerts", note: "Most festivals publish exact medical-tent locations there closer to the date" },
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
//
// Tomorrowland Winter has no entry here on purpose (same reasoning as
// DreamVille below): it's spread across an active ski resort rather than a
// single grounds layout, and there's no genuine static wayfinding graphic
// published for it — only the resort's own piste map, which shows ski runs,
// not stage locations, and would be actively misleading relabeled as a
// festival map. Falls back to the "map isn't available yet" empty state.
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
  "secret-dreams": { src: "/festival-maps/secret-dreams.jpg", year: 2026, note: "Map subject to change, per the festival's own note." },
  "louder-than-life": { src: "/festival-maps/louder-than-life.jpg", year: 2026 },
  "bourbon-and-beyond": { src: "/festival-maps/bourbon-and-beyond.jpg", year: 2026 },
  aftershock: { src: "/festival-maps/aftershock.jpg", year: 2026 },
  "shaky-knees": { src: "/festival-maps/shaky-knees.jpg", year: 2026 },
  // Riot Fest's 2026 map isn't published yet (last year's dropped just
  // days before the festival) -- this is 2025's official map.
  "riot-fest": { src: "/festival-maps/riot-fest.jpg", year: 2025, note: "2026's map isn't published yet — this is last year's official map." },
  // Reading & Leeds has no image-format grounds map -- the festival's own
  // site only publishes one as a PDF, which can't be shown as an <img>.
  // Its campsite map (a real image) covers the app's one combined entry
  // instead; see FESTIVAL_CAMPGROUND_MAP_IMAGES' note on this below.
};

// Official lineup flyers -- the festival's own poster graphic, shown
// alongside (not instead of) the real per-artist schedule data above.
//
// Rock in Rio has no entry here on purpose: unlike every other hasData
// festival, it doesn't promote itself with a single all-in-one poster
// graphic at all -- its own site (rockinrio.com/rio/line-up) is a
// per-day, per-stage interactive listing, and its social pushes are
// per-day PDF press releases. There's no genuine single image to show.
const FESTIVAL_LINEUP_IMAGES = {
  "edc-mexico": { src: "/festival-lineups/edc-mexico.jpg", year: 2026 },
  acl: { src: "/festival-lineups/acl.webp", year: 2026 },
  "lost-lands": { src: "/festival-lineups/lost-lands.jpg", year: 2026 },
  "edc-orlando": { src: "/festival-lineups/edc-orlando.jpg", year: 2026 },
  "secret-dreams": { src: "/festival-lineups/secret-dreams.jpg", year: 2026 },
  "reading-leeds": { src: "/festival-lineups/reading-leeds.jpg", year: 2026 },
  "louder-than-life": { src: "/festival-lineups/louder-than-life.jpg", year: 2026 },
  "riot-fest": { src: "/festival-lineups/riot-fest.jpg", year: 2026 },
  "nocturnal-wonderland": { src: "/festival-lineups/nocturnal-wonderland.jpg", year: 2026 },
  "bourbon-and-beyond": { src: "/festival-lineups/bourbon-and-beyond.jpg", year: 2026 },
  "all-things-go": { src: "/festival-lineups/all-things-go.jpg", year: 2026 },
  "shaky-knees": { src: "/festival-lineups/shaky-knees.jpg", year: 2026 },
  aftershock: { src: "/festival-lineups/aftershock.jpg", year: 2026 },
  // Camp Flog Gnaw 2026's own official poster (campfloggnaw.com) doesn't
  // split artists by day at all (Nov 14-15 is shown as one flat lineup) --
  // even less structure than Nocturnal Wonderland/All Things Go had, so
  // there's no real day/stage/time data to responsibly build a schedule
  // from. Showing the real poster only, no festival_sets/hasData yet.
  "camp-flog-gnaw": { src: "/festival-lineups/camp-flog-gnaw.jpg", year: 2026 },
};

// Dedicated campground/camping maps — only for festivals that actually have
// on-site camping (see FESTIVALS' `noCamping` flag) AND publish a genuinely
// separate camping document distinct from their main stages/grounds map.
// Researched against the 5 camping festivals (bonnaroo, coachella,
// electric-forest, tomorrowland, lost-lands): Electric Forest's main map
// already fully depicts all general camping areas (its only separate doc is
// a niche "Group Camping Map" for one paid add-on, not general camping), Lost
// Lands' only published map IS its camping map already (see the note above),
// and Tomorrowland's DreamVille has no genuinely official static map
// available outside its in-app interactive map — so those three are
// intentionally left out rather than duplicated or faked.
const FESTIVAL_CAMPGROUND_MAP_IMAGES = {
  bonnaroo: { src: "/festival-maps/bonnaroo-camping.jpg", year: 2026 },
  coachella: { src: "/festival-maps/coachella-camping.jpg", year: 2026 },
  "louder-than-life": { src: "/festival-maps/louder-than-life-camping.jpg", year: 2026 },
  aftershock: { src: "/festival-maps/aftershock-camping.jpg", year: 2026, note: "2026 is the festival's first year offering on-site camping." },
  // Reading & Leeds is one combined app entry for two separate physical
  // festivals (Reading's own site at Richfield Ave, Leeds' at Bramham
  // Park), each with its own real campsite map -- this is Reading's.
  // There's no image-format grounds/arena map for either site (both
  // publish that one as a PDF only, which can't render as an <img>), so
  // this camping map is the one real graphic shown for this entry.
  "reading-leeds": { src: "/festival-maps/reading-leeds.jpg", year: 2026, note: "Reading's own campsite map — Leeds (the other half of this combined listing) has a separate map on its own site." },
};

// Verified artist posts — visually distinct from crowd posts, always pinned
// to the top of Community regardless of sort. `artistOf` links back to a
// festival_sets row id so the schedule can show a small "artist posted" indicator.
// Verification status per artist, keyed by their festival_sets row id. Only 'verified'
// artists can post to Community or unlock exclusive content — this is what
// stops anyone from posting as "GRiZ" without proof it's actually them.
export const ARTIST_VERIFICATION = {
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

export const ARTIST_POSTS = [
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

export const FLAIRS = {
  meetup: { label: "Meetup", color: "#3DF2E0" },
  tips: { label: "Tips", color: "#FFB23D" },
  lost: { label: "Lost & Found", color: "#FF3DA6" },
  vibes: { label: "Vibes", color: "#9D6BFF" },
  sets: { label: "Set Times", color: "#5FD97A" },
};

export const FESTIVAL_POSTS = {
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

// Was 4 (240px/hour) — way more scrolling than the schedule needs to be
// readable, especially on a phone where every extra inch of header above
// it (day tabs, filters, friend/stage legends) eats into what's visible.
const PX_PER_MIN = 2.5;

// Community tiers — earned from cumulative karma (upvotes received across
// festivals), separate from artist verification. Ordered low to high;
// getTier() picks the highest threshold the user's karma clears.
const TIERS = [
  { id: "newcomer", label: "First Timer", min: 0, color: "#6C6786" },
  { id: "regular", label: "Roo Regular", min: 150, color: "#3DF2E0" },
  { id: "veteran", label: "Farm Veteran", min: 800, color: "#FFB23D" },
  { id: "legend", label: "Roo Legend", min: 3000, color: "#FF3DA6" },
];

export function getTier(karma) {
  return [...TIERS].reverse().find((t) => karma >= t.min) || TIERS[0];
}

// Mock cumulative karma per community member — stands in for a real
// lifetime-upvotes count tracked server-side.
export const USER_KARMA = {
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

export function TierBadge({ username }) {
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

export function fmtTime(offsetMin, dayId = "fri", festivalId = "bonnaroo") {
  const day = ALL_DAYS.find((d) => d.festivalId === festivalId && d.id === dayId) || ALL_DAYS[1];
  const total = day.startMin + offsetMin;
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const hh = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

export function matchColor(match) {
  if (match >= 85) return "#3DF2E0";
  if (match >= 60) return "#FFB23D";
  return "#5B5470";
}
// Real-lineup festivals without personalized listening data use match:
// null rather than a fabricated number — {match}% alone renders as a bare
// "%" for null, so every display spot needs this instead.
export function matchLabel(match) {
  return match == null ? "No data" : `${match}%`;
}

// No orange/gold hue here on purpose — the crew leader indicator is gold
// (LEADER_GOLD below), and an ordinary member hashing to a gold-adjacent
// color made them look like a second leader.
const MEMBER_COLORS = ["#3DF2E0", "#FF3DA6", "#9D6BFF", "#5FD97A", "#4D96FF"];
// customColor is a person's own chosen profiles.color, when they've set
// one — falls back to the old hash-based assignment for anyone who hasn't.
function colorForId(id, customColor) {
  if (customColor) return customColor;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}
// Camp pin types — color-coded by *type*, not by who dropped it (person
// identity is shown when you tap a pin instead).
const PIN_TYPES = {
  camp: { emoji: "🏕️", label: "Camp", color: "#3DF2E0" },
  meetup: { emoji: "📍", label: "Meetup", color: "#FFB23D" },
  other: { emoji: "⭐", label: "Other", color: "#9D6BFF" },
};
const LEADER_GOLD = "linear-gradient(135deg, #FFD700, #C9930A)";
// Gold for the crew's leader, same hash-based color as everyone else
// otherwise — a plain avatar background, so callers can drop this
// straight into a `background` style without branching themselves.
function memberAvatarBg(memberId, crew, customColor) {
  return crew && crew.created_by === memberId ? LEADER_GOLD : colorForId(memberId, customColor);
}

// Adapts real crew members `{id, name, handle}` into the shape the
// (mock-data-era) CrewCompare/CampMap components expect.
function toDisplayFriends(members) {
  return (members || []).map((m) => ({ id: m.id, name: m.name, initial: m.name[0].toUpperCase(), color: colorForId(m.id, m.color) }));
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

export const voteBtnStyle = { background: "none", border: "none", color: "#5B5470", fontSize: 13, cursor: "pointer", padding: 4, lineHeight: 1 };

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

export function Icon({ name, active }) {
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

// Shared by every top-level screen (auth screens here, the main app
// elsewhere) so the mobile-vs-browser sizing rule can't drift between
// copies. The installed app (display-mode: standalone/fullscreen/
// minimal-ui) always keeps this exact compact mobile layout — that's its
// identity, regardless of window size. A plain browser tab (display-mode:
// browser), which is the only way this renders on desktop today, gets
// scaled up instead of sitting tiny-and-centered in empty space. zoom is
// safe here specifically because .frame is never itself position:fixed —
// it's always a flex child inside a fixed full-width wrapper (bottom nav,
// modal backdrops) or a centered flex column (these auth screens), so
// scaling its own box doesn't disturb any fixed-position coordinate math.
const AUTH_SCREEN_SHARED_CSS = `
  .frame { width: 100%; max-width: 430px; }
  /* transform:scale, not zoom — zoom's centering math with a flex-column
     parent is unreliable in Safari (confirmed: content rendered off-center
     on iPadOS). transform doesn't touch the layout box, only the paint, so
     with the default center-center transform-origin the scaled box stays
     centered on the exact same point the unscaled box would have been —
     correct on every engine, not just Chromium. */
  @media (display-mode: browser) and (min-width: 700px) {
    .frame { max-width: 460px; transform: scale(1.35); }
    /* Bottom sheets (.sheet-frame) are flex children with
       alignItems:"flex-end", not centered — scaling from the box's own
       center (transform's default origin) pushes the visual bottom away
       from the real bottom edge, leaving the sheet looking like it's
       floating mid-screen instead of flush with it. Any vh-based
       maxHeight on these sheets gets inflated by the same scale too,
       overflowing the viewport. Real width via .frame's max-width above,
       no transform, avoids both problems. */
    .sheet-frame { transform: none; }
  }
  @media (display-mode: browser) and (min-width: 1100px) {
    .frame { max-width: 480px; transform: scale(1.6); }
    .sheet-frame { transform: none; }
  }
  .prism-glow { animation: prismGlowPulse 3.2s ease-in-out infinite; }
  @keyframes prismGlowPulse {
    0%, 100% { opacity: 0.65; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .prism-glow { animation: none; }
  }
`;

// Shown once, before the sign-in form, on a browser/device that's never
// opened Prism (gated by localStorage in FestivalOptimizer, not session
// state, since it's about first-run vs. returning — not signed-in vs.
// signed-out). Its whole job is answering "what is this" in one glance
// before asking for an email; existing users skip straight to SignInScreen.
const WELCOME_FEATURES = [
  { icon: "schedule", title: "Build your lineup", body: "Every set, every stage — see what's playing and build a schedule that's actually yours." },
  { icon: "crew", title: "See who's into what", body: "Match up with your crew's picks and never lose each other in the crowd." },
  { icon: "map", title: "Find your camp spot", body: "Official festival maps with your crew's pins dropped right on them." },
  { icon: "community", title: "What's happening live", body: "Real-time posts from the crowd — meetups, tips, lost & found, vibes." },
];

function WelcomeScreen({ onGetStarted }) {
  return (
    <div style={{ minHeight: "100svh", background: "#0F0B1A", color: "#F5F0FF", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "calc(env(safe-area-inset-top, 0px) + 10vh) 28px 24px", textAlign: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        ${AUTH_SCREEN_SHARED_CSS}
      `}</style>
      <div className="frame">
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="prism-glow" style={{
            position: "absolute", top: -40, width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(157,107,255,0.35), rgba(61,242,224,0.18) 45%, transparent 70%)",
            filter: "blur(8px)", pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}><PrismLogo size={56} /></div>
          <div style={{ position: "relative", fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: "3px", marginTop: 12, background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PRISM
          </div>
        </div>

        <p style={{ fontSize: 14.5, color: "#F5F0FF", marginTop: 14, lineHeight: 1.5, fontWeight: 600 }}>
          Your festival season, all in one place.
        </p>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
          {WELCOME_FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: "rgba(61,242,224,0.08)", border: "1px solid #2A2440", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={f.icon} active />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{f.title}</div>
                <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "2px 0 0", lineHeight: 1.4 }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onGetStarted}
          style={{ width: "100%", marginTop: 28, background: "linear-gradient(90deg, #3DF2E0, #9D6BFF)", border: "none", borderRadius: 10, padding: "13px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}
        >
          Get started →
        </button>
        <p style={{ fontSize: 11, color: "#5B5470", marginTop: 20 }}>
          By continuing, you agree to Prism's <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color: "#8B85A3" }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color: "#8B85A3" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

export function SignInScreen({ onSubmit, onVerifyCode, sent, error }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Turnstile CAPTCHA is disabled for now (was correlating with GPU-process
  // crashes on at least one user's machine, tied to the widget's animation --
  // see feedback memory). Server-side enforcement in Supabase Auth > Attack
  // Protection must stay off in lockstep with this, or every sign-in fails
  // with "no captcha_token found" since nothing here generates one anymore.

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
    <div style={{ minHeight: "100svh", background: "#0F0B1A", color: "#F5F0FF", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "calc(env(safe-area-inset-top, 0px) + 15vh) 28px 24px", textAlign: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        ${AUTH_SCREEN_SHARED_CSS}
      `}</style>
      <div className="frame">
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="prism-glow" style={{
          position: "absolute", top: -40, width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(157,107,255,0.35), rgba(61,242,224,0.18) 45%, transparent 70%)",
          filter: "blur(8px)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}><PrismLogo size={56} /></div>
        <div style={{ position: "relative", fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: "3px", marginTop: 12, background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          PRISM
        </div>
      </div>

      {sent ? (
        <div style={{ marginTop: 28, marginLeft: "auto", marginRight: "auto", width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>You're almost in 📬</div>
          <p style={{ fontSize: 13, color: "#8B85A3", marginTop: 8, lineHeight: 1.5 }}>
            We sent a code and a link to <span style={{ color: "#F5F0FF" }}>{email}</span> — go check your inbox! If Prism's on your home screen, type the 6-digit code below instead of tapping the link — the link opens your regular browser, which won't sign in the home-screen app.
          </p>
          <form onSubmit={handleVerify} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123456"
              aria-label="6-digit verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{ width: "100%", background: "#171229", border: "1px solid #3DF2E0", boxShadow: "0 0 0 3px rgba(61,242,224,0.12)", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontSize: 18, textAlign: "center", letterSpacing: "4px", fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button
              type="submit"
              disabled={verifying}
              style={{ width: "100%", background: "linear-gradient(90deg, #3DF2E0, #9D6BFF)", border: "none", borderRadius: 10, padding: "12px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14, cursor: verifying ? "default" : "pointer", opacity: verifying ? 0.7 : 1 }}
            >
              {verifying ? "Verifying…" : "Verify & enter →"}
            </button>
            {error && <div style={{ fontSize: 12.5, color: "#FF3DA6" }}>{error}</div>}
          </form>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 28, marginLeft: "auto", marginRight: "auto", width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#8B85A3", marginBottom: 4, lineHeight: 1.5 }}>
            Your crew, your schedule, your sets — one tap away. Drop your email and let's get you in 🎪
          </p>
          <input
            type="email"
            required
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: "100%", background: "#171229", border: "1px solid #2A2440", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", background: "linear-gradient(90deg, #3DF2E0, #9D6BFF)", border: "none", borderRadius: 10, padding: "12px 14px", color: "#0F0B1A", fontWeight: 700, fontSize: 14, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Sending…" : "Send my magic link →"}
          </button>
          {error && <div style={{ fontSize: 12.5, color: "#FF3DA6" }}>{error}</div>}
        </form>
      )}
      <p style={{ fontSize: 11, color: "#5B5470", marginTop: 20 }}>
        By continuing, you agree to Prism's <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color: "#8B85A3" }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color: "#8B85A3" }}>Privacy Policy</a>.
      </p>
      </div>
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
    <div style={{ minHeight: "100svh", background: "#0F0B1A", color: "#F5F0FF", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "calc(env(safe-area-inset-top, 0px) + 15vh) 28px 24px", textAlign: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        ${AUTH_SCREEN_SHARED_CSS}
      `}</style>
      <div className="frame">
      <PrismLogo size={56} />
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "1px", marginTop: 14 }}>
        Welcome to Prism
      </div>
      <p style={{ fontSize: 13, color: "#8B85A3", marginTop: 6, marginLeft: "auto", marginRight: "auto", maxWidth: 300, lineHeight: 1.5 }}>
        One last thing before you're in — how should your crew see you?
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 24, marginLeft: "auto", marginRight: "auto", width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
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
    <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
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
            aria-label="Crew invite code"
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

// Bottom sheet for picking someone from your crews — reused both for
// starting a DM (anyone you share a crew with) and for the report flow
// (who to file a report against), since both just need a member picker.
function NewDmPickerSheet({ members, onClose, onPick, title = "New message", subtitle = "Anyone you share a crew with." }) {
  return (
    <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 26, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "70dvh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.5px" }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 12.5, color: "#8B85A3", margin: "6px 0 16px" }}>{subtitle}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px", background: "transparent", cursor: "pointer" }}
            >
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: colorForId(m.id, m.color), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
  const { session, profile, authLoading, magicLinkSent, authError, signInWithEmail, verifyCode, signOut, updateProfile, deleteAccount } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => localStorage.getItem("prism:seenWelcome") === "1");
  const [threshold, setThreshold] = useState(60);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("home"); // home | mine | crew | map | community
  const { packedItems, toggleItem: togglePackedItem } = usePackingState(profile?.id);
  const spotify = useSpotify(profile?.id);
  useEffect(() => {
    if (window.location.pathname !== "/auth/spotify/callback") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    window.history.replaceState(null, "", "/");
    if (code) spotify.handleCallback(code, state).then(() => setProfileOpen(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);
  const [mustHavesOpen, setMustHavesOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [newDmPickerOpen, setNewDmPickerOpen] = useState(false);
  const { threads: realThreads, openThreadWith, sendMessage: sendRealMessage } = useDMs(profile?.id);
  const { blockedIds, block: blockUser, unblock: unblockUser, report: reportUser } = useBlocking(profile?.id);
  const [reportTarget, setReportTarget] = useState(null); // { id, name } | null
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState("");
  const [blockError, setBlockError] = useState("");
  const [dmMenuOpen, setDmMenuOpen] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const REPORT_REASONS = ["Harassment or abuse", "Spam", "Inappropriate content", "Impersonation", "Something else"];

  async function handleBlockUser(otherProfileId, name) {
    if (!window.confirm(`Block ${name}? They won't be able to message you anymore, and you won't be able to message them.`)) return;
    setBlockError("");
    const result = await blockUser(otherProfileId);
    if (result?.error) {
      setBlockError(result.error.message || "Couldn't block them — try again.");
      return;
    }
    setActiveRealThreadId(null);
    setMessagesOpen(false);
  }

  async function submitReport() {
    if (!reportTarget || !reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    setReportError("");
    const result = await reportUser(reportTarget.id, reportReason, reportDetails.trim());
    setReportSubmitting(false);
    if (result?.error) {
      setReportError(result.error.message || "Couldn't send that report — try again.");
      return;
    }
    setReportSubmitted(true);
  }

  function closeReportSheet() {
    setReportTarget(null);
    setReportReason("");
    setReportDetails("");
    setReportSubmitted(false);
    setReportError("");
  }
  const [activeRealThreadId, setActiveRealThreadId] = useState(null);
  const [realMessageDraft, setRealMessageDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState([]); // File[], staged before Send
  const [attachmentError, setAttachmentError] = useState("");
  const [sendingDM, setSendingDM] = useState(false);
  const dmFileInputRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const messagesListRef = useRef(null);
  // The message list is its own scrolling region now (composer lives
  // outside it, always pinned below -- see the Messages sheet's layout),
  // so opening a thread needs an explicit scroll to bottom to bring the
  // newest message into view.
  //
  // A one-shot scroll on message-count change isn't enough: the list's
  // actual height can keep changing after that (an attached image
  // finishing its async load, a reveal animation, font swap, ...), and
  // each of those reopens the gap between the true bottom and wherever
  // that one scroll landed -- which is what made the newest message (and,
  // before the composer was pulled out of the scrolling region, the
  // composer itself) render as if it were overlapping other content. A
  // ResizeObserver on the message list's inner content re-syncs scrollTop
  // to its scroll container's bottom every time that content's real
  // height changes, for any reason.
  useEffect(() => {
    if (!activeRealThreadId || !messagesListRef.current || !messagesScrollRef.current) return;
    const scrollToBottom = () => {
      if (messagesScrollRef.current) messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    };
    const ro = new ResizeObserver(scrollToBottom);
    ro.observe(messagesListRef.current);
    scrollToBottom();
    return () => ro.disconnect();
  }, [activeRealThreadId]);
  const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
  const MAX_ATTACHMENTS_PER_MESSAGE = 10;
  function handleDmFileSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const tooBig = files.filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    // Wrapped with a stable id rather than keyed/removed by array index --
    // removing anything but the last staged file would otherwise reindex
    // every entry after it, misattributing each remaining row's remove
    // button (and React's own reconciliation) to the wrong file.
    const ok = files.filter((f) => f.size <= MAX_ATTACHMENT_BYTES).map((file) => ({ id: crypto.randomUUID(), file }));
    setPendingAttachments((prev) => [...prev, ...ok].slice(0, MAX_ATTACHMENTS_PER_MESSAGE));
    setAttachmentError(
      tooBig.length > 0
        ? `${tooBig.length === 1 ? "That file's" : `${tooBig.length} files were`} over 10MB and weren't added.`
        : ""
    );
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
  const [festivalsExpanded, setFestivalsExpanded] = useState(false);
  const [festivalRegionFilter, setFestivalRegionFilter] = useState("All");
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [sharing, setSharing] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createCrewOpen, setCreateCrewOpen] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");
  const [creatingCrew, setCreatingCrew] = useState(false);
  const [joinCrewOpen, setJoinCrewOpen] = useState(false);
  const [crewActionError, setCrewActionError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editColor, setEditColor] = useState("");
  const [profileEditError, setProfileEditError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteAccountError("");
    const result = await deleteAccount();
    setDeletingAccount(false);
    if (result?.error) setDeleteAccountError(result.error.message || "Couldn't delete your account — try again.");
    // No else branch needed on success: deleteAccount() already signs out,
    // and the auth-state-change listener in useAuth swaps back to the
    // sign-in screen on its own.
  }

  function startEditingProfile() {
    setEditName(profile.name);
    setEditHandle(profile.handle);
    setEditColor(profile.color || "");
    setProfileEditError("");
    setEditingProfile(true);
  }

  async function saveProfileEdits() {
    if (!editName.trim() || !editHandle.trim() || savingProfile) return;
    setSavingProfile(true);
    const result = await updateProfile({ name: editName.trim(), handle: editHandle.trim().toLowerCase(), color: editColor || null });
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
  const { crews, createCrew: createCrewRemote, joinCrew, setCrewPersistent: setCrewPersistentRemote, renameCrew, removeMember: removeCrewMember, leaveCrew, disbandCrew } = useCrews(profile?.id);
  const [myCrewsOpen, setMyCrewsOpen] = useState(false);
  const [openMemberCard, setOpenMemberCard] = useState(null);
  const [editingCrewId, setEditingCrewId] = useState(null);
  const [crewNameDraft, setCrewNameDraft] = useState("");
  const [crewActionPending, setCrewActionPending] = useState(false);
  const [activeCrewId, setActiveCrewId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedActions, setQueuedActions] = useState(0);
  const [lineupSubview, setLineupSubview] = useState("full"); // matches | full | discover | schedule
  const [currentDay, setCurrentDay] = useState("fri");
  const [currentFestival, setCurrentFestival] = useState(() => localStorage.getItem("prism:lastFestival") || getDefaultFestival());
  const [recentFestivalIds, setRecentFestivalIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("prism:recentFestivals") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    setRecentFestivalIds((prev) => {
      const next = [currentFestival, ...prev.filter((id) => id !== currentFestival)].slice(0, 5);
      localStorage.setItem("prism:recentFestivals", JSON.stringify(next));
      return next;
    });
  }, [currentFestival]);
  const { pickedIds: schedulePickedIds, crewPicks: schedulePickCrewOverlap, toggle: toggleSchedulePick } = useSchedulePicks(profile?.id, currentFestival);
  const [festivalPickerOpen, setFestivalPickerOpen] = useState(false);
  const [officialMapOpen, setOfficialMapOpen] = useState(false);
  const [campingMapOpen, setCampingMapOpen] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState({}); // festival id -> true once its image 404s/fails
  const [lineupFlyerOpen, setLineupFlyerOpen] = useState(false);
  const [lineupFlyerLoadFailed, setLineupFlyerLoadFailed] = useState({});
  const { requestedIds: requestedFestivalIds, requestFestival } = useFestivalRequests(profile?.id);
  const { byFestival: campPinsByFestival, refresh: refreshCampPins, addPin: addCampPin, updatePin: updateCampPin, deletePin: deleteCampPin } = useCampPins(profile?.id);
  const [pinPlacing, setPinPlacing] = useState(null); // null | 'camp' | 'meetup' | 'other'
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
  // A persistent crew shows up under every festival, not just the one it
  // was created at — that's the whole point of marking it persistent.
  const festivalCrews = crews.filter((c) => c.persistent || c.festival === currentFestival);
  const activeCrew = crews.find((c) => c.id === activeCrewId) || null;
  const { matchWith: spotifyMatchWith } = useSpotifyMatch(profile?.id, activeCrew?.members?.map((m) => m.id));
  // Everyone you share any crew with, deduped — the pool a new DM can
  // start with, regardless of which crew's roster you found them in.
  const allCrewMembers = useMemo(() => {
    const byId = new Map();
    for (const c of crews) for (const m of c.members) byId.set(m.id, m);
    return [...byId.values()];
  }, [crews]);

  // Switching festivals lands you on that festival's first crew (or no
  // crew, if none exist yet there) rather than keeping a crew that belongs
  // to a different festival entirely — unless it's persistent, in which
  // case it's valid everywhere and switching festivals shouldn't bump you
  // off it.
  useEffect(() => {
    if (!activeCrew || (!activeCrew.persistent && activeCrew.festival !== currentFestival)) {
      setActiveCrewId(festivalCrews[0]?.id || null);
    }
  }, [currentFestival]); // eslint-disable-line react-hooks/exhaustive-deps

  const crewPersistent = activeCrew ? activeCrew.persistent : true;
  async function setCrewPersistent(fn) {
    if (!activeCrew) return;
    const next = typeof fn === "function" ? fn(activeCrew.persistent) : fn;
    const result = await setCrewPersistentRemote(activeCrew.id, next);
    if (result?.error) setCrewActionError(result.error.message || "Couldn't save that — try again.");
  }

  // Switching festivals lands you on that festival's first day rather than
  // keeping a day id that may not exist for it.
  useEffect(() => {
    if (activeDays.length && !activeDays.some((d) => d.id === currentDay)) {
      setCurrentDay(activeDays[0].id);
    }
  }, [currentFestival]); // eslint-disable-line react-hooks/exhaustive-deps

  const { sets: festivalSets } = useFestivalSets(currentFestival);

  // Real match data, as far as it goes: festivalSets' own match value is
  // otherwise entirely simulated (see the comment at the top of this
  // file), but if a lineup artist is literally one of your own top-20
  // Spotify artists, that's a real signal worth surfacing -- overridden to
  // 100% and flagged via realMatch so the UI can show it's not just
  // another simulated number. Genre-based partial matching isn't possible:
  // Spotify's tightened Development Mode access returns empty genre tags
  // on /me/top/artists, so a name match against top_artist_names is the
  // only real signal available (see useSpotify.js).
  const effectiveSets = useMemo(() => {
    const topNames = spotify.connection?.top_artist_names;
    if (!topNames?.length) return festivalSets;
    const topNameSet = new Set(topNames.map((n) => n.toLowerCase().trim()));
    return festivalSets.map((s) =>
      topNameSet.has(s.artist.toLowerCase().trim()) ? { ...s, match: 100, realMatch: true } : s
    );
  }, [festivalSets, spotify.connection]);

  const daySets = useMemo(
    () => effectiveSets.filter((s) => s.festival === currentFestival && s.day === currentDay),
    [effectiveSets, currentFestival, currentDay]
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

  function toggleSharing(id) {
    setSharing((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  async function openRealThread(otherProfileId) {
    const result = await openThreadWith(otherProfileId);
    if (result?.data) {
      setActiveThread(null);
      setActiveRealThreadId(result.data);
      setMessagesOpen(true);
    }
  }
  // Each attachment still goes out as its own dm_messages row (schema is
  // one-attachment-per-message) -- sent sequentially, not in parallel, so
  // they land and render in the order they were staged. The typed caption
  // rides along with the *last* file rather than being duplicated onto
  // every one of them.
  async function sendDM() {
    if (!activeRealThreadId || (!realMessageDraft.trim() && pendingAttachments.length === 0)) return;
    const text = realMessageDraft.trim();
    const files = pendingAttachments;
    setRealMessageDraft("");
    setPendingAttachments([]);
    setSendingDM(true);
    let error = null;
    if (files.length === 0) {
      const result = await sendRealMessage(activeRealThreadId, text, null);
      error = result?.error;
    } else {
      for (let i = 0; i < files.length; i++) {
        const isLast = i === files.length - 1;
        const result = await sendRealMessage(activeRealThreadId, isLast ? text : "", files[i].file);
        if (result?.error) {
          error = result.error;
          break;
        }
      }
    }
    setSendingDM(false);
    if (error) setAttachmentError(error.message || "Couldn't send that — try again.");
  }
  function openCreateCrew() {
    const festivalName = FESTIVALS.find((f) => f.id === currentFestival)?.name || "New";
    setNewCrewName(`${festivalName} Crew`);
    setCrewActionError("");
    setCreateCrewOpen(true);
  }
  async function submitNewCrew() {
    const name = newCrewName.trim();
    if (!name || creatingCrew) return;
    setCreatingCrew(true);
    setCrewActionError("");
    const result = await createCrewRemote(name, currentFestival);
    setCreatingCrew(false);
    if (result?.data) {
      setActiveCrewId(result.data.id);
      setCreateCrewOpen(false);
      setInviteOpen(true);
    } else {
      setCrewActionError(result?.error?.message || "Couldn't create the crew — try again.");
    }
  }

  async function handleRemoveMember(crewId, memberProfileId, memberName) {
    if (!window.confirm(`Remove ${memberName} from the crew?`)) return;
    setCrewActionError("");
    setCrewActionPending(true);
    const result = await removeCrewMember(crewId, memberProfileId);
    setCrewActionPending(false);
    if (result?.error) setCrewActionError(result.error.message || "Couldn't remove them — try again.");
  }

  async function handleLeaveCrew(crewId) {
    if (!window.confirm("Leave this crew? You'll need a new invite to get back in.")) return;
    setCrewActionError("");
    setCrewActionPending(true);
    const result = await leaveCrew(crewId);
    setCrewActionPending(false);
    if (result?.error) setCrewActionError(result.error.message || "Couldn't leave the crew — try again.");
    else setInviteOpen(false);
  }

  async function handleDisbandCrew(crewId) {
    if (!window.confirm("Disband this crew for everyone? This can't be undone.")) return;
    setCrewActionError("");
    setCrewActionPending(true);
    const result = await disbandCrew(crewId);
    setCrewActionPending(false);
    if (result?.error) setCrewActionError(result.error.message || "Couldn't disband the crew — try again.");
    else setInviteOpen(false);
  }

  async function saveCrewRename(crewId) {
    const result = await renameCrew(crewId, crewNameDraft);
    if (!result?.error) setEditingCrewId(null);
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
    if (n.type === "dm") {
      setMessagesOpen(true);
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

  // s.match is null for real-lineup festivals with no personalized listening
  // data yet — treat that as "always show" rather than letting it coerce to
  // 0 and get filtered out of My Matches like a genuine low match would.
  const visibleSets = daySets.filter((s) => {
    if (lineupSubview === "schedule") return schedulePickedIds.has(s.id);
    if (lineupSubview === "matches") return s.match == null || s.match >= threshold || schedulePickedIds.has(s.id);
    return true; // full
  });

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
    if (!hasSeenWelcome) {
      return (
        <WelcomeScreen
          onGetStarted={() => {
            localStorage.setItem("prism:seenWelcome", "1");
            setHasSeenWelcome(true);
          }}
        />
      );
    }
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
    <div style={{ fontFamily: "'Inter', sans-serif", background: "radial-gradient(circle at 12% 18%, rgba(157,107,255,0.09), transparent 42%), radial-gradient(circle at 88% 82%, rgba(61,242,224,0.07), transparent 42%), #0F0B1A", color: "#F5F0FF", minHeight: "100%", display: "flex", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ${AUTH_SCREEN_SHARED_CSS}
        /* Browser-tab desktop gets a real left nav rail instead of a
           scaled-up bottom tab bar; the installed app never sees this —
           same display-mode gate as the rest of the responsive rules. */
        .desktop-sidebar { display: none; }
        .mobile-bottom-nav-wrap { display: flex; }
        @media (display-mode: browser) and (min-width: 900px) {
          .desktop-sidebar { display: flex; }
          .mobile-bottom-nav-wrap { display: none; }
          /* transform:scale (from AUTH_SCREEN_SHARED_CSS's 1100px rule)
             paints .frame bigger without reserving that extra space in
             the flex layout — fine when .frame is alone, but here it's
             sitting next to the sidebar and the paint-only overflow
             bled sideways into it. Swap to a real, layout-affecting
             width instead once the sidebar is in play. Declared after
             the shared block in source order, so it wins at equal
             specificity without needing !important. */
          .main-frame { max-width: 640px; transform: none; }
        }
        /* Sidebar (220px) + .main-frame's 640px cap leaves most of a wide
           monitor as unused dark background — widen the content column
           further on bigger screens instead of just centering a narrow
           column in a lot of empty space. Still well short of full-width:
           wide unbroken lines of festival-card text would be harder to
           scan, not easier. */
        @media (display-mode: browser) and (min-width: 1300px) {
          .main-frame { max-width: 780px; }
        }
        @media (display-mode: browser) and (min-width: 1650px) {
          .main-frame { max-width: 900px; }
        }
        /* Ultrawide monitors (e.g. Odyssey G9, 5120px) still only get
           this much wider — a single column stretched past ~1100px reads
           badly regardless of how much horizontal real estate is
           available. The ambient radial-gradient glows on the page
           background (rather than more column width) are what's meant to
           fill the rest of the space on these screens. */
        @media (display-mode: browser) and (min-width: 2400px) {
          .main-frame { max-width: 1100px; }
        }
        .sidebar-tab:hover { background: rgba(61,242,224,0.06); }
        .reveal { opacity: 0; transform: translateY(10px); transition: opacity .55s ease, transform .55s ease; }
        .reveal.on { opacity: 1; transform: translateY(0); }
        .set-card { transition: transform .15s ease, box-shadow .15s ease; cursor: pointer; }
        .set-card:active { transform: scale(0.97); }
        .tab-btn { transition: transform .12s ease; }
        .tab-btn:active { transform: scale(0.9); }
        /* Every plain <button> in the app -- not just the hand-picked ones
           above -- gets the same tap-squish so pressing anything feels
           acknowledged instead of just instantly snapping to its result. */
        button:not(.tab-btn):not(.sidebar-tab) { transition: transform .1s ease, opacity .1s ease, box-shadow .15s ease; }
        button:not(.tab-btn):not(.sidebar-tab):active:not(:disabled) { transform: scale(0.96); }
        @media (prefers-reduced-motion: reduce) { button { transition: none; } button:active { transform: none; } }
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
        /* Every sheet/modal used to just snap into existence — a slide-up
           on the sheet plus a fade on its backdrop reads as considerably
           less "computerized" for basically free, since every sheet
           already shares these two classes. */
        @keyframes sheetSlideUp { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sheet-frame { animation: sheetSlideUp .32s cubic-bezier(.2,.9,.3,1.1) both; }
        .sheet-backdrop { animation: backdropFadeIn .22s ease both; }
        .sheet-backdrop > .sheet-frame { animation-delay: .02s; }
        @media (prefers-reduced-motion: reduce) { .reveal, .set-card, .tab-btn, .splash-mark, .sheet-frame, .sheet-backdrop { transition: none; animation: none; } }
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
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{toast.title}</div>
            <div style={{ fontSize: 12, color: "#8B85A3", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{toast.body}</div>
          </div>
        </div>
      )}

      <nav className="desktop-sidebar" style={{
        flexDirection: "column", width: 220, flexShrink: 0, gap: 2, padding: "28px 12px",
        borderRight: "1px solid #2A2440", position: "sticky", top: 0, height: "100svh", alignSelf: "flex-start",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px", marginBottom: 24 }}>
          <PrismLogo size={26} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "2px", background: "linear-gradient(90deg, #3DF2E0, #9D6BFF 60%, #FF3DA6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PRISM
          </span>
        </div>
        {TABS.map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="sidebar-tab"
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                background: active ? "rgba(61,242,224,0.1)" : "none", border: "none", borderRadius: 10,
                padding: "11px 12px", cursor: "pointer", color: active ? "#3DF2E0" : "#8B85A3",
              }}
            >
              <Icon name={t.icon} active={active} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="frame main-frame" style={{ paddingBottom: 84 }}>
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
                onClick={() => setMessagesOpen(true)}
                aria-label="Messages"
                className="tab-btn"
                style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0, position: "relative",
                  background: "rgba(157,107,255,0.12)", border: "1px solid #9D6BFF",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="#9D6BFF" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4V5z"/></svg>
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
            {/* Quick-stats dashboard strip — all three scoped to whichever
                festival is currently active (the one you last tapped into),
                not a global scan across the whole catalog. Tapping a
                different festival below changes what this strip is about. */}
            {(() => {
              const now = new Date();
              const activeFestival = FESTIVALS.find((f) => f.id === currentFestival);
              const startDate = activeFestival ? festivalStartDate(activeFestival) : null;
              const daysUntil = startDate && startDate >= now ? Math.ceil((startDate - now) / 86400000) : null;
              const pickedCount = schedulePickedIds.size;
              const crewCount = festivalCrews.length;
              const stats = [
                {
                  value: daysUntil != null ? daysUntil : "—",
                  color: "#3DF2E0",
                  label: daysUntil != null ? `day${daysUntil === 1 ? "" : "s"} to ${activeFestival.name}` : "no upcoming date",
                },
                { value: pickedCount, color: "#9D6BFF", label: `set${pickedCount === 1 ? "" : "s"} picked` },
                { value: crewCount, color: "#FF3DA6", label: crewCount === 1 ? "crew" : "crews" },
              ];
              return (
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {stats.map((s, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 0, border: "1px solid #2A2440", borderRadius: 14, padding: "12px 8px", textAlign: "center", background: "#161225" }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#8B85A3", marginTop: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

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
                aria-label="Search festivals or cities"
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

            <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
              {["All", ...FESTIVAL_REGIONS].map((r) => (
                <button
                  key={r}
                  onClick={() => setFestivalRegionFilter(r)}
                  style={{
                    flexShrink: 0,
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap",
                    padding: "7px 12px", borderRadius: 20, border: "1px solid " + (festivalRegionFilter === r ? "#3DF2E0" : "#2A2440"),
                    background: festivalRegionFilter === r ? "rgba(61,242,224,0.12)" : "transparent",
                    color: festivalRegionFilter === r ? "#3DF2E0" : "#8B85A3", cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {(() => {
                const q = festivalSearch.trim().toLowerCase();
                const now = new Date();
                const filtered = FESTIVALS
                  .filter((f) => !q || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q))
                  .filter((f) => festivalRegionFilter === "All" || festivalRegion(f) === festivalRegionFilter)
                  .sort((a, b) => {
                    const da = festivalStartDate(a), db = festivalStartDate(b);
                    const ua = da && da >= now, ub = db && db >= now;
                    if (ua !== ub) return ua ? -1 : 1; // upcoming-dated festivals first
                    if (ua && ub) return da - db; // soonest first
                    return a.name.localeCompare(b.name); // past/TBA festivals: alphabetical, at the end
                  });
                if (filtered.length === 0) {
                  return (
                    <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "24px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 13.5, color: "#8B85A3" }}>
                        {q ? `No festivals match "${festivalSearch}"` : `No ${festivalRegionFilter} festivals yet`}
                      </div>
                    </div>
                  );
                }
                const COLLAPSED_COUNT = 6;
                const showAll = !!q || festivalsExpanded;
                const visible = showAll ? filtered : filtered.slice(0, COLLAPSED_COUNT);
                const hiddenCount = filtered.length - visible.length;
                return (
                  <>
                    {visible.map((f) => {
                      const isActive = f.id === currentFestival;
                      return (
                        <button
                          key={f.id}
                          onClick={() => { setCurrentFestival(f.id); setView("mine"); }}
                          className="tab-btn"
                          style={{
                            textAlign: "left", cursor: "pointer", color: "#F5F0FF",
                            border: `1px solid ${isActive ? "#3DF2E0" : "#2A2440"}`,
                            background: isActive ? "rgba(61,242,224,0.08)" : "#161225",
                            borderRadius: 12, padding: "10px 14px",
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                              {f.name}
                              {f.hasData && <Icon name="verified" />}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.location} · {f.dates}</div>
                            {f.note && <div style={{ fontSize: 10, color: "#FFB23D", marginTop: 2, lineHeight: 1.4 }}>{f.note}</div>}
                          </div>
                          {isActive ? (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3DF2E0", whiteSpace: "nowrap", flexShrink: 0 }}>Last viewed</span>
                          ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#5B5470" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6"/></svg>
                          )}
                        </button>
                      );
                    })}
                    {!q && filtered.length > COLLAPSED_COUNT && (
                      <button
                        onClick={() => setFestivalsExpanded((v) => !v)}
                        style={{
                          textAlign: "center", cursor: "pointer", background: "none", border: "none",
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8B85A3",
                          padding: "8px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        {festivalsExpanded ? "Show fewer" : `Show ${hiddenCount} more`}
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#8B85A3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: festivalsExpanded ? "rotate(180deg)" : "none" }}><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Lineup — matches / full / discover / schedule */}
        {view === "mine" && (
          <div style={{ padding: "0 14px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {["full", "schedule", "matches", "discover"].map((sv) => (
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
                  {sv === "matches" ? "% Match" : sv === "full" ? "Full Lineup" : sv === "discover" ? "Discover" : "My Schedule"}
                </button>
              ))}
            </div>

            {lineupSubview === "matches" && (
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
              <Suspense fallback={null}>
                <DiscoverDeck sets={effectiveSets} pickedIds={schedulePickedIds} onAdd={toggleSchedulePick} currentDay={currentDay} currentFestival={currentFestival} stages={activeStages} />
              </Suspense>
            ) : (
              <>
            {lineupSubview === "full" && FESTIVAL_LINEUP_IMAGES[currentFestival] && !lineupFlyerLoadFailed[currentFestival] && (
              <button
                onClick={() => setLineupFlyerOpen(true)}
                style={{ display: "block", width: "100%", padding: 0, marginBottom: 14, border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden", background: "#151024", cursor: "pointer" }}
              >
                <img
                  src={FESTIVAL_LINEUP_IMAGES[currentFestival].src}
                  alt={`${FESTIVALS.find((f) => f.id === currentFestival)?.name} official lineup flyer`}
                  draggable={false}
                  style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover", objectPosition: "top", WebkitUserDrag: "none", userSelect: "none" }}
                  onError={() => setLineupFlyerLoadFailed((prev) => ({ ...prev, [currentFestival]: true }))}
                  onDragStart={(e) => e.preventDefault()}
                />
              </button>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              {activeStages.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3" }}>{s.name}</span>
                </div>
              ))}
            </div>

            {lineupSubview === "schedule" && visibleSets.length === 0 ? (
              <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#8B85A3" }}>Nothing on your schedule for this day yet.</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#5B5470", marginTop: 6 }}>
                  Tap any set in Full Lineup or % Match to add it.
                </div>
              </div>
            ) : (
            <div style={{ border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", paddingTop: 8, paddingBottom: 8 }}>
                <div style={{ width: 60, flexShrink: 0, background: "#151024", borderRight: "1px solid #2A2440" }}>
                  <div style={{ position: "relative", height: timelineEnd * PX_PER_MIN }}>
                    {Array.from({ length: Math.floor(timelineEnd / 60) + 1 }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", top: i * 60 * PX_PER_MIN, right: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470", transform: "translateY(-50%)", whiteSpace: "nowrap" }}>
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
                          const dimmed = lineupSubview === "full" && s.match != null && s.match < threshold;
                          const isConflict = conflicts.has(s.id);
                          const isPicked = schedulePickedIds.has(s.id);
                          const crewAlsoIn = schedulePickCrewOverlap[s.id]?.length || 0;
                          return (
                            <div key={s.id} className="set-card" onClick={() => setSelected(s)} style={{
                              position: "absolute", top: s.start * PX_PER_MIN + 3, height: (s.end - s.start) * PX_PER_MIN - 6, left: 3, right: 3,
                              borderRadius: 7, padding: "6px 7px", background: dimmed ? "#161225" : "#1E1832",
                              border: `1px solid ${isConflict ? "#FF3DA6" : isPicked ? "#9D6BFF" : dimmed ? "#2A2440" : matchColor(s.match)}`,
                              opacity: dimmed ? 0.35 : 1, overflow: "hidden",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.artist}</div>
                                {ARTIST_POSTS.some((a) => a.artistOf === s.id) && (
                                  <span title="Artist posted an update" style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFB23D", flexShrink: 0 }} />
                                )}
                              </div>
                              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: crewAlsoIn ? "#9D6BFF" : matchColor(s.match), marginTop: 2 }}>
                                {crewAlsoIn ? `👥 ${crewAlsoIn} crew too` : matchLabel(s.match)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
              </>
            )}
          </div>
        )}

        {view === "crew" && (
          <div style={{ padding: "0 14px" }}>
            {crews.length > 0 && (
              <button
                onClick={() => setMyCrewsOpen(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, marginBottom: 12,
                  padding: "9px 13px", borderRadius: 10, border: "1px solid #2A2440",
                  background: "#161225", color: "#8B85A3", cursor: "pointer",
                }}
              >
                <span>My crews ({crews.length})</span>
                <span style={{ color: "#5B5470" }}>Manage →</span>
              </button>
            )}
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
                  onClick={openCreateCrew}
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
                    onClick={openCreateCrew}
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{activeCrew.name}</span>
                      {activeCrew.created_by === profile?.id && (
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#FFB23D", border: "1px solid #FFB23D", borderRadius: 10, padding: "1px 6px", flexShrink: 0 }}>YOU'RE THE LEADER</span>
                      )}
                    </div>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 10, marginBottom: 14 }}>
                    {activeCrew.members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setOpenMemberCard(m)}
                        className="tab-btn"
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                          background: "none", border: "none", padding: "6px 2px", cursor: "pointer",
                        }}
                      >
                        <span style={{ position: "relative", width: 44, height: 44, borderRadius: "50%", background: memberAvatarBg(m.id, activeCrew, m.color), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {m.name[0].toUpperCase()}
                          {m.id === activeCrew.created_by && (
                            <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 12, background: "#171229", borderRadius: "50%", lineHeight: 1, padding: 1 }}>👑</span>
                          )}
                        </span>
                        <span style={{ fontSize: 11, color: "#F5F0FF", maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {openMemberCard && (
                  <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setOpenMemberCard(null)}>
                    <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
                      <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 48, height: 48, borderRadius: "50%", background: memberAvatarBg(openMemberCard.id, activeCrew, openMemberCard.color), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {openMemberCard.name[0].toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            {openMemberCard.name}
                            {openMemberCard.id === activeCrew.created_by && (
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#FFB23D", border: "1px solid #FFB23D", borderRadius: 10, padding: "1px 6px" }}>LEADER</span>
                            )}
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#5B5470" }}>@{openMemberCard.handle}</div>
                          {spotifyMatchWith(openMemberCard.id) !== null && (
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#3DF2E0", marginTop: 3 }}>
                              🎧 {spotifyMatchWith(openMemberCard.id)}% music match
                            </div>
                          )}
                        </div>
                        <button onClick={() => setOpenMemberCard(null)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button
                          onClick={() => { setOpenMemberCard(null); openRealThread(openMemberCard.id); }}
                          style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "none", border: "1px solid #2A2440", borderRadius: 10, padding: "11px", color: "#8B85A3", cursor: "pointer" }}
                        >
                          Message
                        </button>
                        {activeCrew.created_by === profile?.id && (
                          <button
                            disabled={crewActionPending}
                            onClick={() => { const m = openMemberCard; setOpenMemberCard(null); handleRemoveMember(activeCrew.id, m.id, m.name); }}
                            style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "rgba(255,61,166,0.08)", border: "1px solid #FF3DA6", borderRadius: 10, padding: "11px", color: "#FF3DA6", cursor: crewActionPending ? "default" : "pointer", opacity: crewActionPending ? 0.6 : 1 }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Suspense fallback={null}>
                  <CrewCompare
                    sets={effectiveSets}
                    friends={toDisplayFriends(activeCrew.members)}
                    sharing={{ ...Object.fromEntries(activeCrew.members.map((m) => [m.id, true])), ...sharing }}
                    onToggleSharing={toggleSharing}
                    onSelect={setSelected}
                    currentDay={currentDay}
                    currentFestival={currentFestival}
                    crewPicks={schedulePickCrewOverlap}
                  />
                </Suspense>
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
                          style={{ width: "100%", display: "block", maxHeight: 340, objectFit: "cover", WebkitUserDrag: "none", userSelect: "none" }}
                          onError={() => setMapLoadFailed((prev) => ({ ...prev, [currentFestival]: true }))}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </button>
                      {mapInfo.note && (
                        <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0", lineHeight: 1.4 }}>{mapInfo.note}</p>
                      )}
                      {(campPinsByFestival[currentFestival]?.length || 0) > 0 && (
                        <p
                          onClick={() => {
                            const pins = campPinsByFestival[currentFestival] || [];
                            setOfficialMapOpen(true);
                            setOpenMapPin(pins.find((p) => p.profile_id === profile?.id) || pins[0] || null);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
                          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#3DF2E0", margin: "6px 0 0", cursor: "pointer" }}
                        >
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

            {FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival] && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", letterSpacing: "0.3px" }}>CAMPING MAP</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470" }}>{FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival].year}</span>
                </div>
                <button
                  onClick={() => setCampingMapOpen(true)}
                  style={{ display: "block", width: "100%", padding: 0, border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden", background: "#151024", cursor: "pointer" }}
                >
                  <img
                    src={FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival].src}
                    alt={`${FESTIVALS.find((f) => f.id === currentFestival)?.name} camping map`}
                    draggable={false}
                    style={{ width: "100%", display: "block", maxHeight: 240, objectFit: "cover", WebkitUserDrag: "none", userSelect: "none" }}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </button>
                {FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival].note && (
                  <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0", lineHeight: 1.4 }}>{FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival].note}</p>
                )}
              </div>
            )}
          </div>
        )}

        {campingMapOpen && FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival] && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}
            onClick={() => setCampingMapOpen(false)}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 14px 6px" }}>
              <button onClick={() => setCampingMapOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5F0FF", fontSize: 22, width: 36, height: 36, borderRadius: "50%", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain" }} onClick={(e) => e.stopPropagation()}>
              <img
                src={FESTIVAL_CAMPGROUND_MAP_IMAGES[currentFestival].src}
                alt={`${FESTIVALS.find((f) => f.id === currentFestival)?.name} camping map, full size`}
                draggable={false}
                style={{ width: "100%", display: "block", WebkitUserDrag: "none", userSelect: "none" }}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        )}

        {officialMapOpen && FESTIVAL_MAP_IMAGES[currentFestival] && (() => {
          const pins = campPinsByFestival[currentFestival] || [];
          const myPins = pins.filter((p) => p.profile_id === profile?.id);
          const otherPins = pins.filter((p) => p.profile_id !== profile?.id);

          function handleLightboxClick(e) {
            if (!pinPlacing) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
            const type = pinPlacing;
            setPinPlacing(null);
            addCampPin(currentFestival, x, y, type, "").then((r) => {
              if (r?.error) setPinActionError(r.error.message || "Couldn't save your pin — try again.");
              else setOpenMapPin(r.data ? { ...r.data, profiles: profile } : null);
            });
          }

          return (
            <div
              style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}
              onClick={() => { setOfficialMapOpen(false); setPinPlacing(null); setOpenMapPin(null); }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "calc(env(safe-area-inset-top, 0px) + 14px) 14px 6px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
                  {Object.entries(PIN_TYPES).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => setPinPlacing((p) => (p === type ? null : type))}
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, whiteSpace: "nowrap",
                        padding: "8px 12px", borderRadius: 20, flexShrink: 0,
                        border: `1px solid ${pinPlacing === type ? info.color : "rgba(255,255,255,0.2)"}`,
                        background: pinPlacing === type ? `${info.color}26` : "rgba(255,255,255,0.08)",
                        color: pinPlacing === type ? info.color : "#F5F0FF", cursor: "pointer",
                      }}
                    >
                      {info.emoji} {pinPlacing === type ? "Tap the map…" : info.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setOfficialMapOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5F0FF", fontSize: 22, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", flexShrink: 0 }}>×</button>
              </div>

              {pinActionError && (
                <div onClick={(e) => e.stopPropagation()} style={{ margin: "0 14px", fontSize: 12, color: "#FF3DA6" }}>{pinActionError}</div>
              )}

              <div style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain", touchAction: pinPlacing ? "none" : "pan-x pan-y pinch-zoom" }}>
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
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); setOpenMapPin(p); }}
                      style={{
                        position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)",
                        width: 36, height: 36, borderRadius: "50%", background: PIN_TYPES[p.pin_type]?.color || "#5B5470",
                        border: "3px solid #0F0B1A", boxShadow: "0 2px 6px rgba(0,0,0,0.7)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer",
                      }}
                    >
                      {PIN_TYPES[p.pin_type]?.emoji || "📍"}
                    </div>
                  ))}
                  {myPins.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); setOpenMapPin(p); }}
                      style={{
                        position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)",
                        width: 38, height: 38, borderRadius: "50%", background: PIN_TYPES[p.pin_type]?.color || "#5B5470",
                        border: "3px solid #F5F0FF", boxShadow: "0 2px 6px rgba(0,0,0,0.7)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, cursor: "pointer",
                      }}
                    >
                      {PIN_TYPES[p.pin_type]?.emoji || "📍"}
                    </div>
                  ))}
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
                      background: PIN_TYPES[openMapPin.pin_type]?.color || "#5B5470",
                      border: openMapPin.profile_id === profile?.id ? "2px solid #F5F0FF" : "2px solid #0F0B1A",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                    }}>
                      {PIN_TYPES[openMapPin.pin_type]?.emoji || "📍"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                        {PIN_TYPES[openMapPin.pin_type]?.label || "Pin"} · {openMapPin.profile_id === profile?.id ? "You" : openMapPin.profiles?.name || "Crew member"}
                      </div>
                      {openMapPin.note && <div style={{ fontSize: 12, color: "#8B85A3", marginTop: 1 }}>{openMapPin.note}</div>}
                    </div>
                    <button onClick={() => setOpenMapPin(null)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
                  </div>
                  {openMapPin.profile_id === profile?.id && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input
                        defaultValue={openMapPin.note || ""}
                        aria-label="Note for this pin"
                        placeholder="Add a note (e.g. blue tent near the tree line)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateCampPin(openMapPin.id, currentFestival, { note: e.currentTarget.value.trim() });
                            setOpenMapPin(null);
                          }
                        }}
                        style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: "#F5F0FF", background: "#0F0B1A", border: "1px solid #2A2440", borderRadius: 8, padding: "8px 10px", outline: "none" }}
                      />
                      <button
                        onClick={() => { deleteCampPin(openMapPin.id, currentFestival); setOpenMapPin(null); }}
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

        {lineupFlyerOpen && FESTIVAL_LINEUP_IMAGES[currentFestival] && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}
            onClick={() => setLineupFlyerOpen(false)}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 14px 6px" }}>
              <button onClick={() => setLineupFlyerOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#F5F0FF", fontSize: 26, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <img
                src={FESTIVAL_LINEUP_IMAGES[currentFestival].src}
                alt={`${FESTIVALS.find((f) => f.id === currentFestival)?.name} official lineup flyer, full size`}
                draggable={false}
                style={{ width: "100%", display: "block" }}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        )}

        {view === "community" && (
          <div style={{ padding: "0 14px" }}>
            <Suspense fallback={null}>
              <Community key={currentFestival} isOnline={isOnline} onQueue={() => setQueuedActions((n) => n + 1)} currentFestival={currentFestival} />
            </Suspense>
          </div>
        )}

        {/* Detail sheet */}
        {selected && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
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
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: matchColor(selected.match), border: `1px solid ${matchColor(selected.match)}`, borderRadius: 6, padding: "3px 9px" }}>{selected.match == null ? "No match data" : `${selected.match}% match`}</span>
                {selected.realMatch && (
                  <span title="One of your actual top-20 Spotify artists" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#3DF2E0" }}>🎧 real match</span>
                )}
                {conflicts.has(selected.id) && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#FF3DA6" }}>⚠ overlaps another set</span>}
              </div>
              <button
                onClick={() => toggleSchedulePick(selected.id)}
                style={{
                  width: "100%", marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, padding: "11px", borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${schedulePickedIds.has(selected.id) ? "#9D6BFF" : "#2A2440"}`,
                  background: schedulePickedIds.has(selected.id) ? "rgba(157,107,255,0.12)" : "transparent",
                  color: schedulePickedIds.has(selected.id) ? "#9D6BFF" : "#8B85A3",
                }}
              >
                {schedulePickedIds.has(selected.id) ? "✓ On your schedule" : "+ Add to my schedule"}
              </button>
              {schedulePickCrewOverlap[selected.id]?.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: "#9D6BFF" }}>
                  👥 {schedulePickCrewOverlap[selected.id].map((id) => allCrewMembers.find((m) => m.id === id)?.name || "A crew mate").join(", ")} {schedulePickCrewOverlap[selected.id].length === 1 ? "has" : "have"} this on their schedule too
                </div>
              )}
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
            </div>
          </div>
        )}

        {/* Invite sheet */}
        {inviteOpen && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setInviteOpen(false)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
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
                  role="switch"
                  aria-checked={crewPersistent}
                  aria-label="Keep this crew after the festival"
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

              {crewActionError && (
                <div style={{ marginTop: 14, fontSize: 12, color: "#FF3DA6" }}>{crewActionError}</div>
              )}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
                {activeCrew?.created_by === profile?.id ? (
                  <button
                    disabled={crewActionPending}
                    onClick={() => handleDisbandCrew(activeCrew.id)}
                    style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "11px", borderRadius: 10, border: "1px solid #FF3DA6", background: "rgba(255,61,166,0.08)", color: "#FF3DA6", cursor: crewActionPending ? "default" : "pointer", opacity: crewActionPending ? 0.6 : 1 }}
                  >
                    Disband crew
                  </button>
                ) : (
                  <button
                    disabled={crewActionPending}
                    onClick={() => handleLeaveCrew(activeCrew.id)}
                    style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "11px", borderRadius: 10, border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: crewActionPending ? "default" : "pointer", opacity: crewActionPending ? 0.6 : 1 }}
                  >
                    Leave crew
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Join a crew by code */}
        {joinCrewOpen && (
          <JoinCrewSheet onClose={() => setJoinCrewOpen(false)} onSubmit={submitJoinCrew} />
        )}

        {/* My Crews — every crew you're in, across every festival, with rename */}
        {myCrewsOpen && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => { setMyCrewsOpen(false); setEditingCrewId(null); }}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "78dvh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>My crews</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => { setMyCrewsOpen(false); setEditingCrewId(null); openCreateCrew(); }}
                    aria-label="Start a new crew"
                    style={{ background: "none", border: "none", color: "#3DF2E0", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "0 6px" }}
                  >
                    +
                  </button>
                  <button onClick={() => { setMyCrewsOpen(false); setEditingCrewId(null); }} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                {crews.map((c) => (
                  <div key={c.id} style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "12px 14px" }}>
                    {editingCrewId === c.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          autoFocus
                          aria-label="Crew name"
                          value={crewNameDraft}
                          onChange={(e) => setCrewNameDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveCrewRename(c.id); if (e.key === "Escape") setEditingCrewId(null); }}
                          style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#F5F0FF", background: "#0F0B1A", border: "1px solid #3DF2E0", borderRadius: 8, padding: "8px 10px", outline: "none" }}
                        />
                        <button onClick={() => saveCrewRename(c.id)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "0 12px", borderRadius: 8, border: "none", background: "#3DF2E0", color: "#0F0B1A", cursor: "pointer" }}>Save</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            {c.name}
                            {c.created_by === profile?.id && (
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#FFB23D", border: "1px solid #FFB23D", borderRadius: 10, padding: "1px 6px", flexShrink: 0 }}>LEADER</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 2 }}>
                            {c.members.length + 1} members · {c.persistent ? "persists everywhere" : FESTIVALS.find((f) => f.id === c.festival)?.name || c.festival}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => { setEditingCrewId(c.id); setCrewNameDraft(c.name); }}
                            aria-label={`Rename ${c.name}`}
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "5px 11px", color: "#8B85A3", cursor: "pointer" }}
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => { setMyCrewsOpen(false); setEditingCrewId(null); if (!c.persistent) setCurrentFestival(c.festival); setActiveCrewId(c.id); setView("crew"); }}
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.1)", borderRadius: 20, padding: "5px 11px", color: "#3DF2E0", cursor: "pointer" }}
                          >
                            Go
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {createCrewOpen && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 22, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setCreateCrewOpen(false)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "80dvh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px" }}>Create a crew</div>
                <button onClick={() => setCreateCrewOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>

              <label style={{ display: "block", marginTop: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3" }}>
                Crew name
                <input
                  autoFocus
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitNewCrew(); }}
                  placeholder="Crew name"
                  aria-label="New crew name"
                  style={{ width: "100%", marginTop: 6, background: "#1A1428", border: "1px solid #2A2440", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontSize: 15 }}
                />
              </label>

              {crewActionError && <div style={{ fontSize: 12.5, color: "#FF3DA6", marginTop: 10 }}>{crewActionError}</div>}

              <button
                onClick={submitNewCrew}
                disabled={!newCrewName.trim() || creatingCrew}
                style={{
                  width: "100%", marginTop: 18, borderRadius: 12, padding: "13px", border: "none", fontSize: 14, fontWeight: 700, cursor: !newCrewName.trim() || creatingCrew ? "default" : "pointer",
                  background: !newCrewName.trim() ? "#2A2440" : "linear-gradient(90deg, #3DF2E0, #9D6BFF)",
                  color: !newCrewName.trim() ? "#5B5470" : "#0F0B1A",
                  opacity: creatingCrew ? 0.7 : 1,
                }}
              >
                {creatingCrew ? "Creating…" : "Create crew"}
              </button>
            </div>
          </div>
        )}

        {/* Profile sheet */}
        {profileOpen && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setProfileOpen(false)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "82dvh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: (editingProfile ? editColor : profile.color) || "linear-gradient(135deg, #3DF2E0, #9D6BFF)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 18, color: "#0F0B1A", flexShrink: 0 }}>
                  {profile.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingProfile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Display name"
                        aria-label="Display name"
                        style={{ width: "100%", background: "#0F0B1A", border: "1px solid #2A2440", borderRadius: 8, padding: "6px 10px", color: "#F5F0FF", fontSize: 14 }}
                      />
                      <div style={{ display: "flex", alignItems: "center", background: "#0F0B1A", border: "1px solid #2A2440", borderRadius: 8, padding: "0 10px" }}>
                        <span style={{ color: "#5B5470", fontSize: 13 }}>@</span>
                        <input
                          value={editHandle}
                          onChange={(e) => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="handle"
                          aria-label="Handle"
                          style={{ flex: 1, background: "none", border: "none", padding: "6px 4px", color: "#F5F0FF", fontSize: 14 }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        {MEMBER_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            aria-label={`Use avatar color ${c}`}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: c,
                              border: editColor === c ? "2px solid #F5F0FF" : "2px solid transparent",
                              boxShadow: editColor === c ? "0 0 0 2px #171229" : "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          />
                        ))}
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
                    style={{ flex: 1, background: "linear-gradient(90deg, #3DF2E0, #9D6BFF)", border: "none", borderRadius: 8, padding: "8px", color: "#0F0B1A", fontWeight: 700, fontSize: 12.5, cursor: savingProfile ? "default" : "pointer", opacity: savingProfile ? 0.7 : 1, boxShadow: savingProfile ? "none" : "0 2px 14px rgba(157,107,255,0.35)" }}
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
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{effectiveSets.filter((s) => s.festival === currentFestival && s.match >= threshold).length}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470" }}>MATCHED SETS</div>
                </div>
                <div style={{ flex: 1, border: "1px solid #2A2440", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{schedulePickedIds.size}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470" }}>MY SCHEDULE</div>
                </div>
                <div style={{ flex: 1, border: "1px solid #2A2440", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{crews.length}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470" }}>CREWS</div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>CONNECTED ACCOUNTS</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #201A33" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>Spotify</div>
                    <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1 }}>
                      {spotify.connection
                        ? spotify.connection.top_genre
                          ? `Top genre: ${spotify.connection.top_genre.replace(/\b\w/g, (ch) => ch.toUpperCase())}`
                          : spotify.connection.top_artist
                          ? `Top artist: ${spotify.connection.top_artist}`
                          : "Connected"
                        : spotify.loading
                        ? "Connecting…"
                        : "Not connected"}
                    </div>
                  </div>
                  <button
                    onClick={spotify.connection ? spotify.disconnect : spotify.connect}
                    disabled={spotify.loading}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: `1px solid ${spotify.connection ? "#2A2440" : "#3DF2E0"}`, borderRadius: 20, padding: "3px 9px", color: spotify.connection ? "#8B85A3" : "#3DF2E0", cursor: spotify.loading ? "default" : "pointer" }}
                  >
                    {spotify.connection ? "Disconnect" : "Connect"}
                  </button>
                </div>
                {spotify.error && <div style={{ fontSize: 11.5, color: "#FF3DA6", marginTop: 6 }}>{spotify.error}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #201A33" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>Soundcloud</div>
                    <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1 }}>Not available yet</div>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470", border: "1px solid #2A2440", borderRadius: 20, padding: "3px 9px" }}>
                    Coming soon
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>YOUR CREWS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {crews.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #201A33" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

              <button onClick={() => setDeleteAccountOpen(true)} style={{ width: "100%", marginTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "10px", borderRadius: 10, border: "1px solid #2A2440", background: "transparent", color: "#5B5470", cursor: "pointer" }}>
                Delete account
              </button>

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
                <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#5B5470" }}>Privacy Policy</a>
                <a href="/terms.html" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#5B5470" }}>Terms of Service</a>
              </div>
            </div>
          </div>
        )}

        {/* Delete account confirmation — reachable from Profile > Settings */}
        {deleteAccountOpen && (() => {
          const leadingCrews = crews.filter((c) => c.created_by === profile?.id);
          return (
            <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 22, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => { if (!deletingAccount) setDeleteAccountOpen(false); }}>
              <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #FF3DA6", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "80dvh", overflowY: "auto" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.5px", color: "#FF3DA6" }}>Delete account</div>
                  <button onClick={() => setDeleteAccountOpen(false)} disabled={deletingAccount} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: deletingAccount ? "default" : "pointer" }}>×</button>
                </div>

                <p style={{ marginTop: 14, fontSize: 13.5, color: "#C9C3E0", lineHeight: 1.5 }}>
                  This permanently deletes your profile, crew memberships, direct messages, camp pins, packing lists, Spotify connection, and everything else tied to your account. This can't be undone.
                </p>

                {leadingCrews.length > 0 && (
                  <div style={{ marginTop: 12, border: "1px solid #FFB23D", background: "rgba(255,178,61,0.08)", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#FFB23D", lineHeight: 1.5 }}>
                    You lead {leadingCrews.length === 1 ? `"${leadingCrews[0].name}"` : `${leadingCrews.length} crews`} — {leadingCrews.length === 1 ? "it" : "those"} will be disbanded for every member, not just you.
                  </div>
                )}

                {deleteAccountError && <div style={{ fontSize: 12.5, color: "#FF3DA6", marginTop: 12 }}>{deleteAccountError}</div>}

                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  style={{
                    width: "100%", marginTop: 18, borderRadius: 12, padding: "13px", border: "1px solid #FF3DA6", fontSize: 14, fontWeight: 700, cursor: deletingAccount ? "default" : "pointer",
                    background: "rgba(255,61,166,0.12)", color: "#FF3DA6", opacity: deletingAccount ? 0.7 : 1,
                  }}
                >
                  {deletingAccount ? "Deleting…" : "Permanently delete my account"}
                </button>
                <button
                  onClick={() => setDeleteAccountOpen(false)}
                  disabled={deletingAccount}
                  style={{ width: "100%", marginTop: 10, borderRadius: 12, padding: "13px", border: "1px solid #2A2440", fontSize: 13, background: "transparent", color: "#8B85A3", cursor: deletingAccount ? "default" : "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

        {/* Artist claim sheet */}
        {claimTarget && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setClaimTarget(null)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
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
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setFestivalPickerOpen(false)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "82dvh", overflowY: "auto" }}>
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
                  const now = new Date();
                  const byDateSoonestFirst = (a, b) => {
                    const da = festivalStartDate(a), db = festivalStartDate(b);
                    const ua = da && da >= now, ub = db && db >= now;
                    if (ua !== ub) return ua ? -1 : 1;
                    if (ua && ub) return da - db;
                    return a.name.localeCompare(b.name);
                  };
                  const renderRow = (f) => {
                    const requested = requestedFestivalIds.has(f.id);
                    return (
                      <div key={f.id} style={{ border: `1px solid ${f.hasData ? "#3DF2E0" : "#2A2440"}`, borderRadius: 12, padding: "12px 14px", background: f.hasData ? "rgba(61,242,224,0.08)" : "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                              {f.name}
                              {f.hasData && <Icon name="verified" />}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#5B5470", marginTop: 2 }}>{f.location} · {f.dates}</div>
                            {f.note && <div style={{ fontSize: 10, color: "#FFB23D", marginTop: 2, lineHeight: 1.4 }}>{f.note}</div>}
                          </div>
                          {f.hasData ? (
                            f.id === currentFestival ? (
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3DF2E0", whiteSpace: "nowrap", flexShrink: 0 }}>Viewing</span>
                            ) : (
                              <button
                                onClick={() => { setCurrentFestival(f.id); setFestivalPickerOpen(false); }}
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, whiteSpace: "nowrap", padding: "5px 10px", borderRadius: 20, flexShrink: 0,
                                  border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer",
                                }}
                              >
                                Switch
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => requestFestival(f.id)}
                              disabled={requested}
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, whiteSpace: "nowrap", padding: "5px 10px", borderRadius: 20, flexShrink: 0,
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
                  };

                  if (q) {
                    const filtered = FESTIVALS.filter((f) => f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)).sort(byDateSoonestFirst);
                    if (filtered.length === 0) {
                      return (
                        <div style={{ border: "1px solid #2A2440", borderRadius: 12, padding: "20px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 13, color: "#8B85A3" }}>No festivals match "{festivalSearch}"</div>
                        </div>
                      );
                    }
                    return filtered.map(renderRow);
                  }

                  const recents = recentFestivalIds.map((id) => FESTIVALS.find((f) => f.id === id)).filter(Boolean).slice(0, 4);
                  const sorted = [...FESTIVALS].sort(byDateSoonestFirst);
                  const COLLAPSED_COUNT = 6;
                  const visible = pickerExpanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
                  const hiddenCount = sorted.length - visible.length;

                  return (
                    <>
                      {recents.length > 0 && (
                        <>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8B85A3", letterSpacing: "0.3px" }}>RECENTLY VIEWED</div>
                          {recents.map(renderRow)}
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8B85A3", letterSpacing: "0.3px", marginTop: 4 }}>ALL FESTIVALS</div>
                        </>
                      )}
                      {visible.map(renderRow)}
                      {hiddenCount > 0 && (
                        <button
                          onClick={() => setPickerExpanded((v) => !v)}
                          style={{
                            textAlign: "center", cursor: "pointer", background: "none", border: "none",
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8B85A3",
                            padding: "8px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}
                        >
                          {pickerExpanded ? "Show fewer" : `Show ${hiddenCount} more`}
                          <svg viewBox="0 0 24 24" width="12" height="12" stroke="#8B85A3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: pickerExpanded ? "rotate(180deg)" : "none" }}><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                      )}
                    </>
                  );
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
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setNotificationsOpen(false)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "82dvh", overflowY: "auto" }}>
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
                  role="switch"
                  aria-checked={pushEnabled}
                  aria-label="Push notifications"
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
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => { setMessagesOpen(false); setActiveRealThreadId(null); }}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #2A2440", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "85dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />

              {!activeRealThreadId ? (
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, flex: 1, minHeight: 0, overflowY: "auto" }}>
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
                        <span style={{ width: 34, height: 34, borderRadius: "50%", background: colorForId(t.other.id, t.other.color), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                    {realThreads.filter((t) => t.other).length === 0 && (
                      <p style={{ fontSize: 13, color: "#5B5470", textAlign: "center", marginTop: 20 }}>
                        No messages yet — tap "+ New" to message someone you share a crew with.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                (() => {
                  const t = realThreads.find((th) => th.id === activeRealThreadId);
                  if (!t || !t.other) return null;
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => setActiveRealThreadId(null)} aria-label="Back to inbox" style={{ background: "none", border: "none", color: "#8B85A3", cursor: "pointer", padding: 0, display: "flex" }}>
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#8B85A3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                        </button>
                        <span style={{ width: 28, height: 28, borderRadius: "50%", background: colorForId(t.other.id, t.other.color), color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {t.other.name[0].toUpperCase()}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.other.name}</span>
                        <div style={{ position: "relative" }}>
                          <button onClick={() => setDmMenuOpen((v) => !v)} aria-label="Thread options" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 18, cursor: "pointer", padding: "0 4px" }}>⋯</button>
                          {dmMenuOpen && (
                            <>
                              <div style={{ position: "fixed", inset: 0, zIndex: 29 }} onClick={() => setDmMenuOpen(false)} />
                              <div className="sheet-frame" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30, background: "#1A1428", border: "1px solid #2A2440", borderRadius: 12, overflow: "hidden", minWidth: 150, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                                <button
                                  onClick={() => { setDmMenuOpen(false); setReportTarget({ id: t.other.id, name: t.other.name }); }}
                                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 14px", fontSize: 13, color: "#F5F0FF", cursor: "pointer" }}
                                >
                                  Report {t.other.name}
                                </button>
                                <button
                                  onClick={() => { setDmMenuOpen(false); handleBlockUser(t.other.id, t.other.name); }}
                                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 14px", fontSize: 13, color: "#FF3DA6", cursor: "pointer", borderTop: "1px solid #2A2440" }}
                                >
                                  Block {t.other.name}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <button onClick={() => setMessagesOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
                      </div>
                      {blockError && <div style={{ fontSize: 12, color: "#FF3DA6", marginTop: 8 }}>{blockError}</div>}

                      <div ref={messagesScrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 16 }}>
                      <div ref={messagesListRef} style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 160 }}>
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
                      </div>

                      {attachmentError && (
                        <div style={{ fontSize: 12, color: "#FF3DA6", marginTop: 10 }}>{attachmentError}</div>
                      )}

                      {pendingAttachments.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                          {pendingAttachments.map(({ id, file }) => (
                            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1A1428", border: "1px solid #2A2440", borderRadius: 10, padding: "8px 10px" }}>
                              <span style={{ fontSize: 16 }}>{file.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F5F0FF" }}>
                                {file.name}
                              </span>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470" }}>{formatFileSize(file.size)}</span>
                              <button
                                onClick={() => setPendingAttachments((prev) => prev.filter((entry) => entry.id !== id))}
                                aria-label="Remove attachment"
                                style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <input
                          ref={dmFileInputRef}
                          type="file"
                          multiple
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
                          aria-label={`Message ${t.other.name}`}
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
                            border: "none", background: "linear-gradient(90deg, #3DF2E0, #9D6BFF)", color: "#0F0B1A", fontWeight: 700,
                            cursor: sendingDM ? "default" : "pointer", opacity: sendingDM ? 0.6 : 1, whiteSpace: "nowrap",
                            boxShadow: sendingDM ? "none" : "0 2px 14px rgba(157,107,255,0.35)",
                          }}
                        >
                          {sendingDM ? "Sending…" : "Send"}
                        </button>
                      </div>
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

        {reportPickerOpen && (
          <NewDmPickerSheet
            members={allCrewMembers}
            title="Report someone"
            subtitle="Anyone you share a crew with."
            onClose={() => setReportPickerOpen(false)}
            onPick={(id) => {
              setReportPickerOpen(false);
              const m = allCrewMembers.find((x) => x.id === id);
              if (m) setReportTarget({ id: m.id, name: m.name });
            }}
          />
        )}

        {/* Report-a-user sheet — opened either from a DM thread's "⋯" menu
            or from Safety > Report someone. */}
        {reportTarget && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 27, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={closeReportSheet}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #FF3DA6", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "85dvh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2440", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.5px", color: "#FF3DA6" }}>Report {reportTarget.name}</div>
                <button onClick={closeReportSheet} aria-label="Close" style={{ background: "none", border: "none", color: "#8B85A3", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>

              {reportSubmitted ? (
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "#5FD97A", fontWeight: 700 }}>Report sent</div>
                  <p style={{ fontSize: 12.5, color: "#8B85A3", marginTop: 8 }}>Thanks — our team will review it. You can also block {reportTarget.name} from a DM thread's ⋯ menu.</p>
                  <button onClick={closeReportSheet} style={{ marginTop: 16, width: "100%", background: "#2A2440", border: "none", borderRadius: 10, padding: "12px 14px", color: "#F5F0FF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Done</button>
                </div>
              ) : (
                <>
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>REASON</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setReportReason(r)}
                          style={{
                            textAlign: "left", padding: "11px 12px", borderRadius: 12, cursor: "pointer",
                            border: `1px solid ${reportReason === r ? "#FF3DA6" : "#2A2440"}`,
                            background: reportReason === r ? "rgba(255,61,166,0.12)" : "transparent",
                            color: reportReason === r ? "#FF3DA6" : "#F5F0FF", fontSize: 13.5,
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>DETAILS (OPTIONAL)</div>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Anything else that would help us understand what happened"
                      aria-label="Report details"
                      rows={3}
                      style={{ width: "100%", background: "#1A1428", border: "1px solid #2A2440", borderRadius: 12, padding: "10px 12px", color: "#F5F0FF", fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
                    />
                  </div>

                  {reportError && <div style={{ fontSize: 12, color: "#FF3DA6", marginTop: 10 }}>{reportError}</div>}

                  <button
                    onClick={submitReport}
                    disabled={!reportReason || reportSubmitting}
                    style={{
                      width: "100%", marginTop: 16, borderRadius: 12, padding: "13px", border: "none", fontSize: 14, fontWeight: 700, cursor: !reportReason || reportSubmitting ? "default" : "pointer",
                      background: !reportReason ? "#2A2440" : "linear-gradient(90deg, #FF3DA6, #9D6BFF)",
                      color: !reportReason ? "#5B5470" : "#0F0B1A",
                      opacity: reportSubmitting ? 0.7 : 1,
                    }}
                  >
                    {reportSubmitting ? "Sending…" : "Send report"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Safety sheet — reachable from any tab via the header */}
        {safetyOpen && (
          <div className="sheet-backdrop" style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }} onClick={() => setSafetyOpen(false)}>
            <div className="frame sheet-frame" onClick={(e) => e.stopPropagation()} style={{ background: "#171229", border: "1px solid #FF3DA6", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxHeight: "85dvh", overflowY: "auto" }}>
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
                {(SAFETY_INFO.medicalByFestival[currentFestival] || SAFETY_INFO.medicalFallback).map((m) => (
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

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8B85A3", marginBottom: 8 }}>COMMUNITY SAFETY</div>
                <button
                  onClick={() => { setSafetyOpen(false); setReportPickerOpen(true); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px", background: "transparent", color: "#F5F0FF", fontSize: 13, cursor: "pointer" }}
                >
                  Report someone
                  <span style={{ color: "#5B5470" }}>›</span>
                </button>

                {blockedIds.size > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470", marginBottom: 6 }}>BLOCKED ({blockedIds.size})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[...blockedIds].map((id) => {
                        const m = allCrewMembers.find((x) => x.id === id);
                        return (
                          <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                            <span style={{ fontSize: 13 }}>{m?.name || "Someone you've blocked"}</span>
                            <button
                              onClick={async () => {
                                const result = await unblockUser(id);
                                if (result?.error) setBlockError(result.error.message || "Couldn't unblock — try again.");
                              }}
                              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, border: "1px solid #2A2440", borderRadius: 20, padding: "4px 10px", background: "transparent", color: "#8B85A3", cursor: "pointer" }}
                            >
                              Unblock
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom tab bar — mobile/installed app only; browser-desktop uses the sidebar instead */}
        <div className="mobile-bottom-nav-wrap" style={{ position: "fixed", bottom: 0, left: 0, right: 0, justifyContent: "center", zIndex: 10 }}>
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

// DiscoverDeck, CrewCompare, and Community live in src/components/CommunityViews.jsx
// now, lazy-loaded below — split out so a first-time visitor's sign-in
// screen doesn't have to fetch their code before they're even signed in.

