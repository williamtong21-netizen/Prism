import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Not a secret -- Spotify's client ID is meant to be embedded in
// public/client-side code. The client secret lives only in the
// spotify-callback edge function's Supabase secrets.
const SPOTIFY_CLIENT_ID = "3608ccf1ffbe4d3d849534460f2821c0";
const REDIRECT_URI = "https://prismfest.io/auth/spotify/callback";
const SCOPE = "user-top-read";

// Tracks whether the signed-in profile has linked Spotify, and its
// computed top_genre (both live in spotify_connections, written server-
// side by the spotify-callback edge function since that's the only place
// that holds the client secret needed to exchange an auth code).
export function useSpotify(profileId) {
  const [connection, setConnection] = useState(null); // { top_genre, connected_at } | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!profileId) {
      setConnection(null);
      return;
    }
    const { data } = await supabase
      .from("spotify_connections")
      .select("top_genre, top_artist, connected_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    setConnection(data || null);
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function connect() {
    const state = crypto.randomUUID();
    sessionStorage.setItem("spotify_oauth_state", state);
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      state,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }

  // Called once, on load, if the URL is the OAuth redirect landing with a
  // ?code=...&state=... -- see the effect in App.jsx that checks
  // window.location.pathname.
  async function handleCallback(code, state) {
    const expectedState = sessionStorage.getItem("spotify_oauth_state");
    sessionStorage.removeItem("spotify_oauth_state");
    if (!state || state !== expectedState) {
      setError("Spotify sign-in couldn't be verified — try connecting again.");
      return { error: { message: "State mismatch" } };
    }
    setLoading(true);
    setError("");
    const { data, error: invokeError } = await supabase.functions.invoke("spotify-callback", { body: { code } });
    setLoading(false);
    if (invokeError) {
      setError(invokeError.message);
      return { error: invokeError };
    }
    await refresh();
    return { data };
  }

  async function disconnect() {
    if (!profileId) return;
    await Promise.all([
      supabase.from("spotify_connections").delete().eq("profile_id", profileId),
      supabase.from("spotify_taste").delete().eq("profile_id", profileId),
    ]);
    setConnection(null);
  }

  return { connection, loading, error, connect, handleCallback, disconnect };
}
