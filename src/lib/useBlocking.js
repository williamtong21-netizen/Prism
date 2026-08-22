import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Blocking a DM contact and filing a report against them. The actual
// message-stopping enforcement lives server-side (dm_messages' insert
// policy and start_dm_thread both check is_blocked() -- see
// 019_block_report_users.sql); this hook is just the client's view of who
// you've blocked, plus the two mutations.
export function useBlocking(profileId) {
  const [blockedIds, setBlockedIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!profileId) {
      setBlockedIds(new Set());
      return;
    }
    const { data } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", profileId);
    setBlockedIds(new Set((data || []).map((r) => r.blocked_id)));
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function block(otherProfileId) {
    if (!profileId) return { error: { message: "Not signed in." } };
    setBlockedIds((prev) => new Set(prev).add(otherProfileId));
    const { error } = await supabase.from("blocked_users").insert({ blocker_id: profileId, blocked_id: otherProfileId });
    if (error) {
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(otherProfileId);
        return next;
      });
      return { error };
    }
    return {};
  }

  async function unblock(otherProfileId) {
    if (!profileId) return { error: { message: "Not signed in." } };
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(otherProfileId);
      return next;
    });
    const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", profileId).eq("blocked_id", otherProfileId);
    if (error) {
      setBlockedIds((prev) => new Set(prev).add(otherProfileId));
      return { error };
    }
    return {};
  }

  async function report(otherProfileId, reason, details) {
    if (!profileId) return { error: { message: "Not signed in." } };
    const { error } = await supabase
      .from("user_reports")
      .insert({ reporter_id: profileId, reported_id: otherProfileId, reason, details: details || null });
    if (error) return { error };
    return {};
  }

  return { blockedIds, block, unblock, report };
}
