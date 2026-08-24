import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Lineup/set-time data lives in the festival_sets table now (see
// supabase/024_festival_sets.sql) instead of a hardcoded array in App.jsx --
// adding a festival/year going forward is a SQL insert, not a code change.
// Fetched per-festival rather than all at once: with 17+ festivals' worth
// of lineups, loading only the one the user's actually looking at matters
// on festival wifi.
export function useFestivalSets(festivalId) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!festivalId) {
      setSets([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("festival_sets")
      .select("id, festival_id, day_id, artist, stage_id, start_min, end_min, match, genre, sounds_like, sources")
      .eq("festival_id", festivalId)
      .then(({ data, error }) => {
        if (cancelled) return;
        setSets(
          error || !data
            ? []
            : data.map((s) => ({
                id: s.id,
                festival: s.festival_id,
                day: s.day_id,
                artist: s.artist,
                stage: s.stage_id,
                start: s.start_min,
                end: s.end_min,
                match: s.match,
                genre: s.genre,
                sounds_like: s.sounds_like,
                sources: s.sources || [],
              }))
        );
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [festivalId]);

  return { sets, loading };
}
