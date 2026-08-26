import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real Spotify artist photos for the profile sheet, via the
// spotify-artist-search edge function (Client Credentials flow, no user
// token needed -- see supabase/functions/spotify-artist-search). Caches by
// artist name for the life of the tab so re-opening the same set's detail
// sheet doesn't re-fetch. Returns null (no photo) while loading or when the
// function found no confident match -- the caller should treat both the
// same, since showing a wrong photo is worse than showing none.
const photoCache = new Map(); // artist -> image url | null

export function useArtistPhoto(artist) {
  const [image, setImage] = useState(() => (artist ? photoCache.get(artist) ?? null : null));

  useEffect(() => {
    if (!artist) {
      setImage(null);
      return;
    }
    if (photoCache.has(artist)) {
      setImage(photoCache.get(artist));
      return;
    }
    let cancelled = false;
    setImage(null);
    (async () => {
      const { data } = await supabase.functions.invoke("spotify-artist-search", { body: { artist } });
      const found = data?.image || null;
      photoCache.set(artist, found);
      if (!cancelled) setImage(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [artist]);

  return image;
}
