import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real 1:1 DM threads. Each thread is loaded with its other participant's
// profile and full message history; `sender_id === profileId` gets mapped
// to the same "you" | "them" shape the old mock DM_THREADS used, so the
// message-bubble rendering barely has to change.
export function useDMs(profileId) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    const { data: mine } = await supabase.from("dm_participants").select("thread_id").eq("profile_id", profileId);
    const threadIds = [...new Set((mine || []).map((p) => p.thread_id))];
    if (threadIds.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }
    const [{ data: participants }, { data: messages }] = await Promise.all([
      supabase.from("dm_participants").select("thread_id, profiles(id, name, handle)").in("thread_id", threadIds),
      supabase.from("dm_messages").select("id, thread_id, sender_id, text, created_at").in("thread_id", threadIds).order("created_at", { ascending: true }),
    ]);
    const byThreadOther = {};
    for (const p of participants || []) {
      if (p.profiles?.id !== profileId) byThreadOther[p.thread_id] = p.profiles;
    }
    const byThreadMessages = {};
    for (const m of messages || []) {
      (byThreadMessages[m.thread_id] ||= []).push({ ...m, from: m.sender_id === profileId ? "you" : "them" });
    }
    setThreads(
      threadIds.map((id) => {
        const msgs = byThreadMessages[id] || [];
        return { id, other: byThreadOther[id] || null, messages: msgs, lastMessage: msgs[msgs.length - 1] || null };
      })
    );
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`dm_messages:${profileId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, (payload) => {
        setThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === payload.new.thread_id);
          if (idx === -1) return prev; // message in a thread we don't know about yet — next refresh() picks it up
          const existing = prev[idx];
          if (existing.messages.some((m) => m.id === payload.new.id)) return prev;
          const msg = { ...payload.new, from: payload.new.sender_id === profileId ? "you" : "them" };
          const next = [...prev];
          next[idx] = { ...existing, messages: [...existing.messages, msg], lastMessage: msg };
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profileId]);

  async function openThreadWith(otherProfileId) {
    const existing = threads.find((t) => t.other?.id === otherProfileId);
    if (existing) return { data: existing.id };
    const { data, error } = await supabase.rpc("start_dm_thread", { other_profile_id: otherProfileId });
    if (error) return { error };
    await refresh();
    return { data };
  }

  async function sendMessage(threadId, text) {
    const { data, error } = await supabase
      .from("dm_messages")
      .insert({ thread_id: threadId, sender_id: profileId, text })
      .select()
      .single();
    if (error) return { error };
    const msg = { ...data, from: "you" };
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, msg], lastMessage: msg } : t)));
    return { data: msg };
  }

  return { threads, loading, openThreadWith, sendMessage };
}
