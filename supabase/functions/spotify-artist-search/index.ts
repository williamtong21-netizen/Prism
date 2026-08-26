// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor), same as spotify-callback/send-push -- see
// supabase/README.md.
//
// Returns a real Spotify artist photo for the artist-profile sheet's
// "Find on Spotify" area, when Spotify's own search has a confident top
// match. Uses the Client Credentials flow (app-level auth, no user token
// needed) so this works for every set, not just ones the signed-in user
// has connected Spotify for -- reuses the same SPOTIFY_CLIENT_ID/
// SPOTIFY_CLIENT_SECRET function secrets as spotify-callback, but never
// touches a user's own tokens or spotify_connections/spotify_taste.
//
// Deliberately returns nothing (no image) rather than guess -- a wrong
// photo of a real person is worse than no photo. Only returns an image
// when Spotify's search puts the query as the #1 result AND the
// returned artist name matches (case-insensitively, ignoring a
// parenthetical like "(Sunset Set)") -- ambiguous/no-match names (e.g.
// "Two Guys", "5AM", single-word aliases with no Spotify presence) come
// back empty and the client shows no image, same as it does today.

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
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();
    if (!searchRes.ok) {
      console.log("spotify search failed", searchData);
      return new Response(JSON.stringify({ image: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const top = searchData.artists?.items?.[0];
    const confidentMatch = top && normalize(top.name) === normalize(artist);
    const image = confidentMatch ? top.images?.[0]?.url || null : null;
    const spotifyUrl = confidentMatch ? top.external_urls?.spotify || null : null;

    return new Response(JSON.stringify({ image, spotifyUrl, matchedName: confidentMatch ? top.name : null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(JSON.stringify({ image: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
