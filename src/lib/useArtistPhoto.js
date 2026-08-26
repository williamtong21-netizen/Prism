import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real Spotify artist photos for the profile sheet, via the
// spotify-artist-search edge function (Client Credentials flow, no user
// token needed -- see supabase/functions/spotify-artist-search). Returns
// an array of 1+ { name, image } entries -- most sets resolve to one, but
// a "B2B" billing (two DJs performing together, e.g. "Armin van Buuren
// B2B Marlon Hoffstadt") resolves to one entry per person, each with its
// own real photo or none. Caches by the raw artist string for the life of
// the tab so re-opening the same set's detail sheet doesn't re-fetch.
const photoCache = new Map(); // artist -> array of { name, image }

export function useArtistPhotos(artist) {
  const [entries, setEntries] = useState(() => (artist ? photoCache.get(artist) ?? [] : []));

  useEffect(() => {
    if (!artist) {
      setEntries([]);
      return;
    }
    if (photoCache.has(artist)) {
      setEntries(photoCache.get(artist));
      return;
    }
    let cancelled = false;
    setEntries([]);
    (async () => {
      const { data } = await supabase.functions.invoke("spotify-artist-search", { body: { artist } });
      const found = data?.artists || [];
      photoCache.set(artist, found);
      if (!cancelled) setEntries(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [artist]);

  return entries;
}
