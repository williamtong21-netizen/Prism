import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Real Community posts + nested comment threads + votes, replacing the
// local-only mock FESTIVAL_POSTS/FLAIRS data (see App.jsx's old mock and
// 053_community_backend.sql for the real schema). Scoped to one festival
// at a time, like useFestivalSets -- refetched whenever festivalId changes.
//
// Comments nest via a self-referencing parent_id (arbitrarily deep replies,
// not just one flat level under each post) -- this hook returns the flat
// row list; building the actual tree is left to the component, since that's
// a rendering concern, not a data-fetching one.
//
// Votes are returned pre-reduced into two id-keyed maps (`scores`,
// `myVotes`) covering both posts and comments together -- UUID collision
// between the two tables is astronomically unlikely, so one merged map per
// concern is simpler than four separate ones for callers to juggle.
export function useCommunity(profileId, festivalId) {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [votes, setVotes] = useState([]); // flat [{voter_id, post_id, comment_id, value}]
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!festivalId) return;
    setLoading(true);
    const { data: postRows } = await supabase
      .from("community_posts")
      .select("id, festival_id, flair, title, created_at, author_id, profiles(id, name, handle, color)")
      .eq("festival_id", festivalId)
      .order("created_at", { ascending: false });
    const ids = (postRows || []).map((p) => p.id);

    let commentRows = [];
    let voteRows = [];
    if (ids.length) {
      const { data: c } = await supabase
        .from("community_comments")
        .select("id, post_id, parent_id, text, created_at, author_id, profiles(id, name, handle, color)")
        .in("post_id", ids)
        .order("created_at", { ascending: true });
      commentRows = c || [];
      const commentIds = commentRows.map((c) => c.id);

      const votePromises = [supabase.from("community_votes").select("voter_id, post_id, comment_id, value").in("post_id", ids)];
      if (commentIds.length) votePromises.push(supabase.from("community_votes").select("voter_id, post_id, comment_id, value").in("comment_id", commentIds));
      const voteResults = await Promise.all(votePromises);
      voteRows = voteResults.flatMap((r) => r.data || []);
    }

    setPosts(postRows || []);
    setComments(commentRows);
    setVotes(voteRows);
    setLoading(false);
  }, [festivalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // See useDMs.js for why this exists -- realtime silently misses events
  // sent while the tab/PWA was backgrounded and frozen by the OS.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!festivalId) return;
    const channel = supabase
      .channel(`community:${festivalId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, (payload) => {
        if (payload.new.festival_id !== festivalId) return;
        refresh(); // simplest correct way to pick up the new row's joined author profile
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_comments" }, () => {
        refresh(); // real content needs the author's joined profile, so refetch rather than patch in the bare payload
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_votes" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [festivalId, refresh]);

  const scores = {};
  const myVotes = {};
  for (const v of votes) {
    const key = v.post_id || v.comment_id;
    scores[key] = (scores[key] || 0) + v.value;
    if (v.voter_id === profileId) myVotes[key] = v.value;
  }
  // Every post/comment starts at a base score of 1 (its author's implicit
  // upvote) the same way the old mock's seed data did, rather than 0 --
  // matches how every real vote/comment count in the rest of the app reads.
  for (const p of posts) scores[p.id] = (scores[p.id] || 0) + 1;
  for (const c of comments) scores[c.id] = (scores[c.id] || 0) + 1;

  async function createPost(flair, title) {
    if (!profileId) return { error: { message: "Not signed in" } };
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ festival_id: festivalId, author_id: profileId, flair, title })
      .select("id, festival_id, flair, title, created_at, author_id, profiles(id, name, handle, color)")
      .single();
    if (error) return { error };
    setPosts((prev) => [data, ...prev]);
    return { data };
  }

  async function createComment(postId, parentId, text) {
    if (!profileId) return { error: { message: "Not signed in" } };
    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, parent_id: parentId || null, author_id: profileId, text })
      .select("id, post_id, parent_id, text, created_at, author_id, profiles(id, name, handle, color)")
      .single();
    if (error) return { error };
    setComments((prev) => [...prev, data]);
    return { data };
  }

  // Toggle semantics: clicking the same direction again retracts the vote;
  // clicking the other direction flips it; otherwise it's a fresh vote.
  async function vote(targetId, isComment, value) {
    if (!profileId) return { error: { message: "Not signed in" } };
    const column = isComment ? "comment_id" : "post_id";
    const existing = votes.find((v) => v.voter_id === profileId && v[column] === targetId);
    if (existing && existing.value === value) {
      const { error } = await supabase.from("community_votes").delete().eq("voter_id", profileId).eq(column, targetId);
      if (error) return { error };
      setVotes((prev) => prev.filter((v) => !(v.voter_id === profileId && v[column] === targetId)));
      return { data: null };
    }
    if (existing) {
      const { error } = await supabase.from("community_votes").update({ value }).eq("voter_id", profileId).eq(column, targetId);
      if (error) return { error };
      setVotes((prev) => prev.map((v) => (v.voter_id === profileId && v[column] === targetId ? { ...v, value } : v)));
      return { data: null };
    }
    const { error } = await supabase.from("community_votes").insert({ voter_id: profileId, [column]: targetId, value });
    if (error) return { error };
    setVotes((prev) => [...prev, { voter_id: profileId, post_id: isComment ? null : targetId, comment_id: isComment ? targetId : null, value }]);
    return { data: null };
  }

  return { posts, comments, scores, myVotes, loading, createPost, createComment, vote, refresh };
}
