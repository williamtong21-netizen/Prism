import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real crew camp pins — one row per (profile, festival), x/y stored as
// percentages of the map image so the same row can position a marker on
// both the schematic CampMap and the real official map image. RLS already
// scopes a plain select to "your own pin, plus anyone you share a crew
// with for this festival," so the client doesn't need to filter anything.
export function useCampPins(profileId) {
  const [byFestival, setByFestival] = useState({}); // festivalId -> pin[]
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (festivalId) => {
      if (!profileId || !festivalId) return;
      setLoading(true);
      const { data } = await supabase
        .from("camp_pins")
        .select("profile_id, festival_id, x, y, note, updated_at, profiles(id, name, handle)")
        .eq("festival_id", festivalId);
      setByFestival((prev) => ({ ...prev, [festivalId]: data || [] }));
      setLoading(false);
    },
    [profileId]
  );

  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`camp_pins:${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "camp_pins" }, (payload) => {
        const festivalId = (payload.new || payload.old)?.festival_id;
        if (festivalId) refresh(festivalId);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profileId, refresh]);

  async function setMyPin(festivalId, x, y, note) {
    if (!profileId) return { error: { message: "Not signed in." } };
    const { error } = await supabase
      .from("camp_pins")
      .upsert({ profile_id: profileId, festival_id: festivalId, x, y, note: note || null, updated_at: new Date().toISOString() });
    if (error) return { error };
    await refresh(festivalId);
    return {};
  }

  async function clearMyPin(festivalId) {
    if (!profileId) return { error: { message: "Not signed in." } };
    const { error } = await supabase.from("camp_pins").delete().eq("profile_id", profileId).eq("festival_id", festivalId);
    if (error) return { error };
    await refresh(festivalId);
    return {};
  }

  return { byFestival, loading, refresh, setMyPin, clearMyPin };
}
