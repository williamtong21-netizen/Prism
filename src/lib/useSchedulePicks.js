import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Manually-built schedule picks -- independent of the algorithmic match
// score. Crew-mates' picks for the same festival come back in the same
// query (RLS: shares_crew_with, see 020_schedule_picks.sql) so the Lineup
// tab can show "N of your crew are here too" without a separate query per
// crew member.
export function useSchedulePicks(profileId, festivalId) {
  const [pickedIds, setPickedIds] = useState(new Set());
  const [crewPicks, setCrewPicks] = useState({}); // set_id -> [profile_id, ...] (crew-mates only, not you)

  const refresh = useCallback(async () => {
    if (!profileId || !festivalId) {
      setPickedIds(new Set());
      setCrewPicks({});
      return;
    }
    const { data } = await supabase.from("schedule_picks").select("set_id, profile_id").eq("festival_id", festivalId);
    const mine = new Set();
    const others = {};
    for (const row of data || []) {
      if (row.profile_id === profileId) {
        mine.add(row.set_id);
      } else {
        (others[row.set_id] ||= []).push(row.profile_id);
      }
    }
    setPickedIds(mine);
    setCrewPicks(others);
  }, [profileId, festivalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggle(setId) {
    if (!profileId || !festivalId) return { error: { message: "Not signed in." } };
    const wasPicked = pickedIds.has(setId);
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (wasPicked) next.delete(setId);
      else next.add(setId);
      return next;
    });
    const { error } = wasPicked
      ? await supabase.from("schedule_picks").delete().eq("profile_id", profileId).eq("festival_id", festivalId).eq("set_id", setId)
      : await supabase.from("schedule_picks").insert({ profile_id: profileId, festival_id: festivalId, set_id: setId });
    if (error) {
      setPickedIds((prev) => {
        const next = new Set(prev);
        if (wasPicked) next.add(setId);
        else next.delete(setId);
        return next;
      });
      return { error };
    }
    return {};
  }

  return { pickedIds, crewPicks, toggle };
}
