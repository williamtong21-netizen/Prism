import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Mirrors the shape the app already used (an array of checked item ids) so
// swapping this in for local useState is a one-line change at the call
// site, but every toggle now persists to `packing_state`.
export function usePackingState(profileId) {
  const [packedItems, setPackedItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    supabase
      .from("packing_state")
      .select("item_id")
      .eq("profile_id", profileId)
      .then(({ data }) => {
        if (cancelled) return;
        setPackedItems((data || []).map((r) => r.item_id));
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [profileId]);

  function toggleItem(itemId) {
    const checked = packedItems.includes(itemId);
    setPackedItems((prev) => (checked ? prev.filter((id) => id !== itemId) : [...prev, itemId]));

    if (checked) {
      supabase.from("packing_state").delete().eq("profile_id", profileId).eq("item_id", itemId).then();
    } else {
      supabase.from("packing_state").upsert({ profile_id: profileId, item_id: itemId, checked: true }).then();
    }
  }

  return { packedItems, toggleItem, loaded };
}
