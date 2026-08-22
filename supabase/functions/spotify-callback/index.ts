// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor), same as send-push -- see supabase/README.md.
//
// Called by the client (useSpotify.js) right after Spotify redirects back
// to /auth/spotify/callback with a `code`. This function is the only place
// that ever sees the Spotify client secret or writes to
// spotify_connections: it exchanges the code for tokens, pulls the user's
// top artists to compute a top genre, and stores it all via the service
// role key (which bypasses RLS -- the client can only read/delete its own
// rows, never write tokens directly).
//
// Writes to two tables: spotify_connections (private -- tokens, never
// readable by anyone but the owner) and spotify_taste (shareable -- top
// genre/artist plus the top-20 artist id list crew-mates are allowed to
// read, used to compute a music match % between two people).
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected. Set
// SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET as function secrets.

import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const spotifyClientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
const spotifyClientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
const REDIRECT_URI = "https://prismfest.io/auth/spotify/callback";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const profileId = userData.user.id;

    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.log("spotify token exchange failed", tokenData);
      return new Response(JSON.stringify({ error: tokenData.error_description || "Token exchange failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Best-effort -- if this fails, still save the connection with no
    // top_genre/top_artist rather than losing the whole connect attempt.
    // Genre tags on artist objects have been coming back empty under
    // Spotify's tightened Development Mode access, so top_artist is a
    // fallback the UI shows whenever no genre could be computed.
    let topGenre = null;
    let topArtist = null;
    let topArtistIds: string[] = [];
    const topRes = await fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (topRes.ok) {
      const topData = await topRes.json();
      const genreCounts: Record<string, number> = {};
      for (const artist of topData.items || []) {
        for (const genre of artist.genres || []) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      }
      const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
      topGenre = sorted[0]?.[0] || null;
      topArtist = topData.items?.[0]?.name || null;
      topArtistIds = (topData.items || []).map((a: { id: string }) => a.id);
    } else {
      console.log("spotify top artists fetch failed", await topRes.text());
    }

    const nowIso = new Date().toISOString();
    const { error: upsertError } = await supabase.from("spotify_connections").upsert({
      profile_id: profileId,
      access_token,
      refresh_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      top_genre: topGenre,
      top_artist: topArtist,
      connected_at: nowIso,
    });
    if (upsertError) {
      console.log("spotify_connections upsert failed", upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: tasteError } = await supabase.from("spotify_taste").upsert({
      profile_id: profileId,
      top_genre: topGenre,
      top_artist: topArtist,
      top_artist_ids: topArtistIds,
      updated_at: nowIso,
    });
    if (tasteError) {
      console.log("spotify_taste upsert failed", tasteError);
      return new Response(JSON.stringify({ error: tasteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ topGenre, topArtist }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
