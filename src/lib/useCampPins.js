import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real crew camp pins — any number per (profile, festival), each tagged
// with a pin_type ('camp' | 'meetup' | 'other'). x/y are percentages of
// the map image. RLS already scopes a plain select to "your own pins,
// plus anyone you share a crew with for this festival," so the client
// doesn't need to filter anything.
export function useCampPins(profileId) {
  const [byFestival, setByFestival] = useState({}); // festivalId -> pin[]
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (festivalId) => {
      if (!profileId || !festivalId) return;
      setLoading(true);
      const { data } = await supabase
        .from("camp_pins")
        .select("id, profile_id, festival_id, x, y, pin_type, note, updated_at, profiles(id, name, handle)")
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

  async function addPin(festivalId, x, y, pinType, note) {
    if (!profileId) return { error: { message: "Not signed in." } };
    const { data, error } = await supabase
      .from("camp_pins")
      .insert({ profile_id: profileId, festival_id: festivalId, x, y, pin_type: pinType, note: note || null })
      .select()
      .single();
    if (error) return { error };
    await refresh(festivalId);
    return { data };
  }

  async function updatePin(pinId, festivalId, fields) {
    if (!profileId) return { error: { message: "Not signed in." } };
    const { error } = await supabase
      .from("camp_pins")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", pinId)
      .eq("profile_id", profileId);
    if (error) return { error };
    await refresh(festivalId);
    return {};
  }

  async function deletePin(pinId, festivalId) {
    if (!profileId) return { error: { message: "Not signed in." } };
    const { error } = await supabase.from("camp_pins").delete().eq("id", pinId).eq("profile_id", profileId);
    if (error) return { error };
    await refresh(festivalId);
    return {};
  }

  return { byFestival, loading, refresh, addPin, updatePin, deletePin };
}
