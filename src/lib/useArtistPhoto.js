import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real Spotify artist photos, via the spotify-artist-search edge function
// (Client Credentials flow, no user token needed -- see
// supabase/functions/spotify-artist-search). Returns an array of 1+
// { name, image } entries -- most sets resolve to one, but a "B2B" billing
// (two DJs performing together, e.g. "Armin van Buuren B2B Marlon
// Hoffstadt") resolves to one entry per person, each with its own real
// photo or none. Caches by the raw artist string for the life of the tab.
//
// This hook is used on dense list/grid screens (a full day's lineup can be
// 50-200 sets rendering at once), so lookups go through a small shared
// queue rather than firing one fetch per artist in parallel -- an
// unthrottled burst like that is exactly what tripped Spotify's app-level
// rate limit for a full day during this feature's own rollout. MAX_CONCURRENT
// keeps only a few requests in flight at a time; `pending` also dedupes
// simultaneous lookups for the same artist (e.g. a headliner showing up in
// both the schedule grid and a picked-sets list at once) into one request.
const photoCache = new Map(); // artist -> array of { name, image }
const pending = new Map(); // artist -> in-flight Promise<array>
const queue = [];
let activeCount = 0;
const MAX_CONCURRENT = 3;

function runNext() {
  if (activeCount >= MAX_CONCURRENT || queue.length === 0) return;
  const job = queue.shift();
  activeCount++;
  job().finally(() => {
    activeCount--;
    runNext();
  });
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push(() => fn().then(resolve, reject));
    runNext();
  });
}

async function fetchArtists(artist) {
  const { data } = await supabase.functions.invoke("spotify-artist-search", { body: { artist } });
  return data?.artists || [];
}

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

    let promise = pending.get(artist);
    if (!promise) {
      promise = enqueue(() => fetchArtists(artist)).then((found) => {
        photoCache.set(artist, found);
        pending.delete(artist);
        return found;
      });
      pending.set(artist, promise);
    }
    promise.then((found) => {
      if (!cancelled) setEntries(found);
    });

    return () => {
      cancelled = true;
    };
  }, [artist]);

  return entries;
}
