import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real, persisted "request data for this festival" -- previously just a
// useState([]) that reset on every reload and was never saved anywhere
// (see 028_festival_data_requests.sql).
export function useFestivalRequests(profileId) {
  const [requestedIds, setRequestedIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!profileId) {
      setRequestedIds(new Set());
      return;
    }
    const { data } = await supabase.from("festival_data_requests").select("festival_id").eq("profile_id", profileId);
    setRequestedIds(new Set((data || []).map((r) => r.festival_id)));
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function requestFestival(festivalId) {
    if (!profileId || requestedIds.has(festivalId)) return {};
    setRequestedIds((prev) => new Set(prev).add(festivalId));
    const { error } = await supabase.from("festival_data_requests").insert({ profile_id: profileId, festival_id: festivalId });
    if (error) {
      setRequestedIds((prev) => {
        const next = new Set(prev);
        next.delete(festivalId);
        return next;
      });
      return { error };
    }
    return {};
  }

  return { requestedIds, requestFestival };
}
