import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Your own real Community karma (profile_karma view, 056_profile_karma.sql)
// -- a cross-festival cumulative stat, unlike useCommunity's per-festival
// posts/comments, so it's its own small hook rather than folded into that
// one. Used for the Profile sheet's own tier badge.
export function useMyKarma(profileId) {
  const [karma, setKarma] = useState(0);

  const refresh = useCallback(async () => {
    if (!profileId) {
      setKarma(0);
      return;
    }
    const { data } = await supabase.from("profile_karma").select("karma").eq("profile_id", profileId).maybeSingle();
    setKarma(data?.karma ?? 0);
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { karma, refresh };
}
