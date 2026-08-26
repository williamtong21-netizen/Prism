// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor), same as spotify-callback/send-push -- see
// supabase/README.md.
//
// Returns real Spotify artist photos for the artist-profile sheet's
// "Find on Spotify" area, when Spotify's own search has a confident top
// match. Uses the Client Credentials flow (app-level auth, no user token
// needed) so this works for every set, not just ones the signed-in user
// has connected Spotify for -- reuses the same SPOTIFY_CLIENT_ID/
// SPOTIFY_CLIENT_SECRET function secrets as spotify-callback, but never
// touches a user's own tokens or spotify_connections/spotify_taste.
//
// Deliberately returns no image for an entry rather than guess -- a wrong
// photo of a real person is worse than no photo. Only returns an image
// when Spotify's search puts the query as the #1 result AND the returned
// artist name matches (case-insensitively, ignoring a parenthetical like
// "(Sunset Set)").
//
// Many festival lineups bill two DJs performing together as one string,
// e.g. "Armin van Buuren B2B Marlon Hoffstadt" -- that combined string
// never matches a single Spotify artist, even though both individuals
// almost certainly have their own real profiles. "B2B" unambiguously means
// two different people (unlike "&"/"and", which plenty of real duos use as
// part of their own single Spotify artist name, e.g. "Angus & Julia
// Stone") so it's the one separator safe to split on automatically.
// "Presents"/"pres."/"convida"/"convide" billings ("Alok & Family pres.
// Rave The World") put a promo/event tail after the real headliner's name
// -- only the part before that marker is a real, searchable artist.
// Returns `artists`, an array of 1+ resolved names -- most sets resolve to
// exactly one.

const spotifyClientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
const spotifyClientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;

const ALLOWED_ORIGINS = ["https://prismfest.io", "http://localhost:5173"];
function corsHeadersFor(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Client Credentials tokens last ~1hr; a short in-memory cache avoids a
// token fetch on every single artist lookup within that window. Cold on
// every deploy/cold-start, which is fine -- worst case one extra request.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Spotify token fetch failed");
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

// Strips a trailing set-specific qualifier the same way the client's
// artistSearchLinks() does, so "Excision (2 Hour Set)" searches as
// "Excision" -- keeps this function's own matching consistent with what
// the Spotify/SoundCloud text links already search for.
function cleanArtistName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim() || name;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Drops a "presents"/"pres."/"convida"/"convide" promo/guest tail, keeping
// only the real headliner name before it.
function stripPresentsTail(name: string): string {
  return name.split(/\s+(?:presents:?|pres\.?|convida|convide)\s+/i)[0].trim();
}

// Splits an unambiguous back-to-back billing into its individual names.
function splitB2B(name: string): string[] {
  return name
    .split(/\s+b2b\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// If the whole-string search fails, retries once with "&" swapped for
// "and" (or vice versa) -- covers real duo/band names stored with the
// other spelling than Spotify uses (e.g. "Angus and Julia Stone" in our
// data vs. "Angus & Julia Stone" on Spotify). Not a split -- still one
// artist, one search.
function swapConjunction(name: string): string | null {
  if (/\s&\s/.test(name)) return name.replace(/\s&\s/, " and ");
  if (/\sand\s/i.test(name)) return name.replace(/\sand\s/i, " & ");
  return null;
}

async function searchOne(token: string, name: string) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) {
    console.log("spotify search failed", data);
    return { name, image: null, spotifyUrl: null };
  }
  const top = data.artists?.items?.[0];
  const confident = top && normalize(top.name) === normalize(name);
  return {
    name: confident ? top.name : name,
    image: confident ? top.images?.[0]?.url || null : null,
    spotifyUrl: confident ? top.external_urls?.spotify || null : null,
  };
}

async function resolveArtists(token: string, rawArtist: string) {
  const primary = stripPresentsTail(rawArtist);

  const direct = await searchOne(token, primary);
  if (direct.image) return [direct];

  const swapped = swapConjunction(primary);
  if (swapped) {
    const viaSwap = await searchOne(token, swapped);
    if (viaSwap.image) return [{ ...viaSwap, name: primary }];
  }

  const parts = splitB2B(primary);
  if (parts.length > 1) {
    const results = [];
    for (const part of parts) results.push(await searchOne(token, part));
    return results;
  }

  return [direct];
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let rawArtist = url.searchParams.get("artist") || "";
    if (!rawArtist && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      rawArtist = body?.artist || "";
    }
    const artist = cleanArtistName(rawArtist);
    if (!artist) {
      return new Response(JSON.stringify({ error: "Missing artist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getAppToken();
    const artists = await resolveArtists(token, artist);

    return new Response(JSON.stringify({ artists }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(JSON.stringify({ artists: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
