import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous-looking chars
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
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
      supabase.from("crew_members").select("crew_id, profiles(id, name, handle)").in("crew_id", crewIds),
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
      .eq("code", code.trim().toUpperCase())
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

  return { crews, loading, createCrew, joinCrew, setCrewPersistent, refresh };
}
