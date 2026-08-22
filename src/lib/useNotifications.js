import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real per-user notification inbox: loads existing rows, then stays live
// via a realtime subscription so a notification inserted from anywhere
// (another tab, a future server-side event) shows up without a reload.
export function useNotifications(profileId) {
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    setNotifications(data || []);
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime's websocket gets suspended when a backgrounded tab/PWA is
  // frozen by the OS, and on reconnect it only streams changes going
  // forward -- a notification inserted while backgrounded was silently
  // missed and only showed up after a full app restart re-ran the
  // mount-time refresh() above. Re-running it whenever the app comes back
  // to the foreground closes that gap without waiting for a restart.
  useEffect(() => {
    if (!profileId) return;
    function handleVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [profileId, refresh]);

  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${profileId}` },
        (payload) => {
          setNotifications((prev) => (prev.some((n) => n.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  async function pushNotification(base) {
    const row = {
      profile_id: profileId,
      type: base.type,
      title: base.title,
      body: base.body ?? null,
      meta: base.meta ?? {},
      read: false,
    };
    const { data, error } = await supabase.from("notifications").insert(row).select().single();
    if (!error && data) {
      setNotifications((prev) => (prev.some((n) => n.id === data.id) ? prev : [data, ...prev]));
    }
    return data;
  }

  function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    supabase.from("notifications").update({ read: true }).eq("id", id).then();
  }

  return { notifications, pushNotification, markRead };
}
