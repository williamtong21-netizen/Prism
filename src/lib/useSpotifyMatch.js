import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Music match % between the signed-in profile and their crew-mates, based
// on overlap in each person's top-20 Spotify artists (spotify_taste.
// top_artist_ids, written by the spotify-callback edge function). Only
// meaningful between two people who've both connected Spotify -- matchWith
// returns null rather than 0 when either side has no data, so the UI can
// tell "no overlap" apart from "nothing to compare."
export function useSpotifyMatch(profileId, memberIds) {
  const [taste, setTaste] = useState({}); // profileId -> { top_artist_ids, top_genre, top_artist }
  const memberIdsKey = (memberIds || []).slice().sort().join(",");

  useEffect(() => {
    if (!profileId || !memberIdsKey) {
      setTaste({});
      return;
    }
    let cancelled = false;
    (async () => {
      const ids = [...new Set([profileId, ...memberIdsKey.split(",")])];
      const { data } = await supabase
        .from("spotify_taste")
        .select("profile_id, top_genre, top_artist, top_artist_ids")
        .in("profile_id", ids);
      if (!cancelled) {
        const byId = {};
        for (const row of data || []) byId[row.profile_id] = row;
        setTaste(byId);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, memberIdsKey]);

  function matchWith(otherId) {
    const mine = taste[profileId]?.top_artist_ids;
    const theirs = taste[otherId]?.top_artist_ids;
    if (!mine?.length || !theirs?.length) return null;
    const a = new Set(mine);
    const b = new Set(theirs);
    const shared = [...a].filter((id) => b.has(id));
    const union = new Set([...a, ...b]);
    return Math.round((shared.length / union.size) * 100);
  }

  return { taste, matchWith };
}
