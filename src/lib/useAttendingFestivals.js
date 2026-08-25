import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// A stable "I'm actually going to this one" signal, distinct from
// currentFestival (which just tracks whatever's currently being browsed and
// changes every time you peek at a different festival's schedule). Backs
// the Home countdown, which should track the nearest festival you're
// attending, not the last one you happened to tap into. See
// 039_attending_festivals.sql.
export function useAttendingFestivals(profileId) {
  const [attendingIds, setAttendingIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!profileId) {
      setAttendingIds(new Set());
      return;
    }
    const { data } = await supabase.from("attending_festivals").select("festival_id").eq("profile_id", profileId);
    setAttendingIds(new Set((data || []).map((r) => r.festival_id)));
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleAttending(festivalId) {
    if (!profileId) return {};
    const wasAttending = attendingIds.has(festivalId);
    setAttendingIds((prev) => {
      const next = new Set(prev);
      if (wasAttending) next.delete(festivalId);
      else next.add(festivalId);
      return next;
    });
    const { error } = wasAttending
      ? await supabase.from("attending_festivals").delete().eq("profile_id", profileId).eq("festival_id", festivalId)
      : await supabase.from("attending_festivals").insert({ profile_id: profileId, festival_id: festivalId });
    if (error) {
      setAttendingIds((prev) => {
        const next = new Set(prev);
        if (wasAttending) next.add(festivalId);
        else next.delete(festivalId);
        return next;
      });
      return { error };
    }
    return {};
  }

  return { attendingIds, toggleAttending };
}
