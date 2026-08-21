import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const ATTACHMENT_BUCKET = "dm-attachments";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days — re-signed on every refresh/receive anyway

// The bucket is private, so a stored path is useless to <img>/<a> on its
// own — sign it into a temporary URL each time a message is loaded rather
// than persisting a URL that would eventually expire.
async function signAttachment(path) {
  if (!path) return null;
  const { data } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl || null;
}

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
      supabase.from("dm_participants").select("thread_id, profiles(id, name, handle, color)").in("thread_id", threadIds),
      supabase
        .from("dm_messages")
        .select("id, thread_id, sender_id, text, created_at, attachment_path, attachment_type, attachment_name, attachment_size")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true }),
    ]);
    const byThreadOther = {};
    for (const p of participants || []) {
      if (p.profiles?.id !== profileId) byThreadOther[p.thread_id] = p.profiles;
    }
    const byThreadMessages = {};
    for (const m of messages || []) {
      (byThreadMessages[m.thread_id] ||= []).push({ ...m, from: m.sender_id === profileId ? "you" : "them" });
    }
    await Promise.all(
      Object.values(byThreadMessages)
        .flat()
        .filter((m) => m.attachment_path)
        .map(async (m) => { m.attachmentUrl = await signAttachment(m.attachment_path); })
    );
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, async (payload) => {
        const attachmentUrl = payload.new.attachment_path ? await signAttachment(payload.new.attachment_path) : null;
        setThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === payload.new.thread_id);
          if (idx === -1) return prev; // message in a thread we don't know about yet — next refresh() picks it up
          const existing = prev[idx];
          if (existing.messages.some((m) => m.id === payload.new.id)) return prev;
          const msg = { ...payload.new, from: payload.new.sender_id === profileId ? "you" : "them", attachmentUrl };
          const next = [...prev];
          next[idx] = { ...existing, messages: [...existing.messages, msg], lastMessage: msg };
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profileId]);

  // The subscription above only knows about threads already in `threads`,
  // so a brand-new incoming thread (someone DMing you for the first time)
  // never showed up until the app was reloaded and refresh() ran again on
  // mount. This listens for your own participant row showing up in a new
  // thread and re-fetches so it appears without a manual reload.
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`dm_participants:${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_participants", filter: `profile_id=eq.${profileId}` },
        () => refresh()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profileId, refresh]);

  async function openThreadWith(otherProfileId) {
    const existing = threads.find((t) => t.other?.id === otherProfileId);
    if (existing) return { data: existing.id };
    const { data, error } = await supabase.rpc("start_dm_thread", { other_profile_id: otherProfileId });
    if (error) return { error };
    await refresh();
    return { data };
  }

  async function sendMessage(threadId, text, file) {
    let attachmentFields = {};
    if (file) {
      const path = `${threadId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file, { contentType: file.type });
      if (uploadError) return { error: uploadError };
      attachmentFields = {
        attachment_path: path,
        attachment_type: file.type,
        attachment_name: file.name,
        attachment_size: file.size,
      };
    }
    const { data, error } = await supabase
      .from("dm_messages")
      .insert({ thread_id: threadId, sender_id: profileId, text: text || "", ...attachmentFields })
      .select()
      .single();
    if (error) return { error };
    const attachmentUrl = data.attachment_path ? await signAttachment(data.attachment_path) : null;
    const msg = { ...data, from: "you", attachmentUrl };
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, msg], lastMessage: msg } : t)));
    return { data: msg };
  }

  return { threads, loading, openThreadWith, sendMessage };
}
