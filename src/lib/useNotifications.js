import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real per-user notification inbox: loads existing rows, then stays live
// via a realtime subscription so a notification inserted from anywhere
// (another tab, a future server-side event) shows up without a reload.
export function useNotifications(profileId) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;

    supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setNotifications(data || []);
      });

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
      cancelled = true;
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
