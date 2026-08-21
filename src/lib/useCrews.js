import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous-looking chars
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

// Codes are shown/shared as "XXX-XXX", but people retype them without the
// dash, with lowercase, with extra spaces, etc. — reconstruct the canonical
// form so the lookup isn't brittle about exact formatting.
function normalizeCode(input) {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.length === 6 ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` : input.trim().toUpperCase();
}

// Real crews, backed by crews/crew_members. Shape stays close to the old
// mock CREWS_SEED (id, festival, name, code, persistent, members) so the
// existing crew UI needs minimal changes — `members` here is real profile
// rows `{id, name, handle}` instead of FRIENDS ids, which the schedule-match
// and camp-map views degrade against gracefully (they just show no data
// for a member they don't have mock stats for).
export function useCrews(profileId) {
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    const { data: memberships } = await supabase.from("crew_members").select("crew_id").eq("profile_id", profileId);
    const crewIds = [...new Set((memberships || []).map((m) => m.crew_id))];
    if (crewIds.length === 0) {
      setCrews([]);
      setLoading(false);
      return;
    }
    const [{ data: crewRows }, { data: memberRows }] = await Promise.all([
      supabase.from("crews").select("id, festival_id, name, code, persistent, created_by").in("id", crewIds),
      supabase.from("crew_members").select("crew_id, profiles(id, name, handle, color)").in("crew_id", crewIds),
    ]);
    const byCrew = {};
    for (const m of memberRows || []) {
      (byCrew[m.crew_id] ||= []).push(m.profiles);
    }
    setCrews(
      (crewRows || []).map((c) => ({
        ...c,
        festival: c.festival_id,
        members: (byCrew[c.id] || []).filter((p) => p.id !== profileId),
      }))
    );
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // crew_members was already added to the realtime publication (schema.sql)
  // but nothing ever subscribed to it — membership changes (someone joins,
  // leaves, gets removed, or the crew gets disbanded) only showed up on
  // your next reload. RLS scopes what postgres_changes actually delivers,
  // so this only ever fires for crews you're already in.
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`crew_members:${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crew_members" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profileId, refresh]);

  async function createCrew(name, festivalId) {
    const { data: crew, error } = await supabase
      .from("crews")
      .insert({ name, festival_id: festivalId, code: randomCode(), persistent: false, created_by: profileId })
      .select()
      .single();
    if (error) return { error };
    await supabase.from("crew_members").insert({ crew_id: crew.id, profile_id: profileId });
    await refresh();
    return { data: crew };
  }

  async function joinCrew(code) {
    const { data: crew, error } = await supabase
      .from("crews")
      .select("id, name")
      .eq("code", normalizeCode(code))
      .maybeSingle();
    if (error) return { error };
    if (!crew) return { error: { message: "No crew found with that code." } };
    const { error: joinError } = await supabase.from("crew_members").insert({ crew_id: crew.id, profile_id: profileId });
    if (joinError && joinError.code !== "23505") return { error: joinError }; // 23505 = already a member, fine
    await refresh();
    return { data: crew };
  }

  async function setCrewPersistent(crewId, persistent) {
    setCrews((prev) => prev.map((c) => (c.id === crewId ? { ...c, persistent } : c)));
    supabase.from("crews").update({ persistent }).eq("id", crewId).then();
  }

  async function renameCrew(crewId, name) {
    const trimmed = name.trim();
    if (!trimmed) return { error: { message: "Crew name can't be empty." } };
    setCrews((prev) => prev.map((c) => (c.id === crewId ? { ...c, name: trimmed } : c)));
    const { error } = await supabase.from("crews").update({ name: trimmed }).eq("id", crewId);
    if (error) return { error };
    return {};
  }

  // Removing someone else is leader-only, enforced server-side by the
  // remove_crew_member RPC — this isn't the path for leaving yourself.
  async function removeMember(crewId, memberProfileId) {
    const { error } = await supabase.rpc("remove_crew_member", {
      target_crew_id: crewId,
      target_profile_id: memberProfileId,
    });
    if (error) return { error };
    await refresh();
    return {};
  }

  async function leaveCrew(crewId) {
    const { error } = await supabase.from("crew_members").delete().eq("crew_id", crewId).eq("profile_id", profileId);
    if (error) return { error };
    setCrews((prev) => prev.filter((c) => c.id !== crewId));
    return {};
  }

  // Deletes the crews row outright; crew_members rows cascade via FK.
  // RLS restricts this to the crew's creator.
  async function disbandCrew(crewId) {
    const { error } = await supabase.from("crews").delete().eq("id", crewId);
    if (error) return { error };
    setCrews((prev) => prev.filter((c) => c.id !== crewId));
    return {};
  }

  return { crews, loading, createCrew, joinCrew, setCrewPersistent, renameCrew, removeMember, leaveCrew, disbandCrew, refresh };
}
