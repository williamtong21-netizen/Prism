import { useState } from "react";
import { Icon, TierBadge, matchColor, fmtTime, matchLabel, relativeTime, voteBtnStyle, FLAIRS, ARTIST_VERIFICATION, ARTIST_POSTS, ArtistAvatarFor } from "../App.jsx";

// Split out of App.jsx (lazy-loaded from the Lineup/Crew/Community tabs) so
// a first-time visitor's initial sign-in load doesn't have to fetch this
// code before they're even signed in -- these three are only ever rendered
// once a festival + view are selected inside the main app.

export function DiscoverDeck({ sets, pickedIds, onAdd, onSelect, currentDay, currentFestival, stages }) {
  // The discover range is deliberately mid-tier: high enough to be a
  // plausible fit, low enough that it's not already on your schedule.
  const deck = sets.filter((s) => s.festival === currentFestival && s.day === currentDay && s.match >= 40 && s.match < 80 && !pickedIds.has(s.id)).sort((a, b) => b.match - a.match);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState([]);

  const remaining = deck.filter((s) => !skipped.includes(s.id));
  const current = remaining[0];

  if (!current) {
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-dim)" }}>That's everyone in your discover range.</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-dimmer)", marginTop: 6 }}>
          {pickedIds.size} sets on your schedule so far
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-dimmer)", marginBottom: 10 }}>
        {remaining.length} left to discover
      </div>
      <div
        style={{
          border: `1px solid ${matchColor(current.match)}`, borderRadius: 16, padding: "22px 20px",
          background: "var(--surface)",
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-dim)" }}>
          {stages.find((st) => st.id === current.stage)?.name} · {fmtTime(current.start, current.day, current.festival)} · {current.genre}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 6px" }}>
          <ArtistAvatarFor artist={current.artist} size={44} />
          <button
            onClick={() => onSelect && onSelect(current)}
            style={{ display: "block", background: "none", border: "none", padding: 0, cursor: onSelect ? "pointer" : "default", textAlign: "left", fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "0.5px", color: "var(--text)" }}
          >
            {current.artist}
          </button>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: matchColor(current.match), border: `1px solid ${matchColor(current.match)}`, borderRadius: 6, padding: "3px 9px" }}>
          {current.match}% match
        </span>
        <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.5, minHeight: 40 }}>
          {current.sounds_like || "New territory — not close to anything in your library yet."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={() => setSkipped((prev) => [...prev, current.id])}
          style={{
            flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "13px", borderRadius: 12,
            border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer",
          }}
        >
          Skip
        </button>
        <button
          onClick={() => onAdd(current.id)}
          style={{
            flex: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "13px", borderRadius: 12,
            border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer",
          }}
        >
          + Add to schedule
        </button>
      </div>
    </div>
  );
}

export function CrewCompare({ sets, friends, sharing, onToggleSharing, onSelect, currentDay, currentFestival, crewPicks }) {
  const rows = sets.filter((s) => s.festival === currentFestival && s.day === currentDay && (s.match >= 50 || (crewPicks[s.id] || []).length > 0)).sort((a, b) => a.start - b.start);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-dim)", borderBottom: "1px solid var(--border)" }}>SET</th>
              <th style={{ textAlign: "center", padding: "10px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, borderBottom: "1px solid var(--border)" }}>You</th>
              {friends.map((f) => (
                <th key={f.id} style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.initial}</span>
                    <button onClick={() => onToggleSharing(f.id)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, background: "none", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 6px", color: sharing[f.id] ? "#3DF2E0" : "var(--text-dimmer)", cursor: "pointer" }}>
                      {sharing[f.id] ? "On" : "Off"}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
                <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ArtistAvatarFor artist={s.artist} size={24} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{s.artist}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "var(--text-dimmer)", marginTop: 2 }}>{fmtTime(s.start, s.day, s.festival)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "center", padding: "9px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: matchColor(s.match) }}>{matchLabel(s.match)}</span>
                </td>
                {friends.map((f) => {
                  const picked = (crewPicks[s.id] || []).includes(f.id);
                  return (
                    <td key={f.id} style={{ textAlign: "center", padding: "9px", borderBottom: "1px solid var(--border)" }}>
                      {!sharing[f.id] ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--text-dimmer)" }}>hidden</span>
                        : picked ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#3DF2E0" }}>✓ on schedule</span>
                        : <span style={{ color: "var(--text-dimmer)", fontSize: 12 }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--text-dimmer)", borderTop: "1px solid var(--border)" }}>
        "Hidden" = sharing off for this crew. Still a member, matches just aren't visible.
      </p>
    </div>
  );
}

// Builds the nested reply tree for one post out of the flat comments list
// -- comments self-reference via parent_id, so a reply can be arbitrarily
// deep (a reply to a reply to a reply), not just one flat level under the
// post the way the old mock data modeled it.
function buildCommentTree(comments, postId) {
  const byParent = {};
  for (const c of comments) {
    if (c.post_id !== postId) continue;
    const key = c.parent_id || "root";
    (byParent[key] ||= []).push(c);
  }
  function attach(list) {
    return [...list]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((c) => ({ ...c, children: attach(byParent[c.id] || []) }));
  }
  return attach(byParent.root || []);
}

function ReplyBox({ value, onChange, error, onCancel, onSubmit, isOnline, autoFocus }) {
  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a reply…"
        rows={2}
        autoFocus={autoFocus}
        style={{
          width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text)",
          background: "var(--surface)", border: `1px solid ${error ? "#FF3DA6" : "var(--border)"}`, borderRadius: 10,
          padding: "9px 11px", resize: "none", outline: "none",
        }}
      />
      {error && <p style={{ fontSize: 11, color: "#FF3DA6", margin: "5px 0 0" }}>{error}</p>}
      {!isOnline && <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0" }}>You're offline — reconnect to reply.</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        {onCancel && (
          <button onClick={onCancel} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}>
            Cancel
          </button>
        )}
        <button
          onClick={onSubmit}
          disabled={!isOnline}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 14px", borderRadius: 8, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: isOnline ? "pointer" : "not-allowed", opacity: isOnline ? 1 : 0.6 }}
        >
          Reply
        </button>
      </div>
    </div>
  );
}

// One comment plus its nested children, indented by depth. Indent is capped
// at 6 levels so a very deep thread doesn't squeeze itself into a sliver —
// replies past that depth still nest logically, just without extra
// left-margin per level.
function CommentNode({ comment, depth, postId, scores, myVotes, onVote, replyTo, setReplyTo, replyText, setReplyText, replyError, setReplyError, onSubmitReply, isOnline, collapsed, toggleCollapse, onReport }) {
  const score = scores[comment.id] ?? 1;
  const myVote = myVotes[comment.id] || 0;
  const isCollapsed = collapsed.has(comment.id);
  const hasChildren = comment.children.length > 0;

  return (
    <div style={{ marginLeft: Math.min(depth, 6) * 14, borderLeft: "2px solid var(--border)", paddingLeft: 11, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-dimmer)" }}>
        <span>u/{comment.profiles?.handle || "deleted"}</span>
        <TierBadge username={comment.profiles?.handle} />
        <span>· {relativeTime(comment.created_at)}</span>
        {hasChildren && (
          <button
            onClick={() => toggleCollapse(comment.id)}
            style={{ background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", fontFamily: "inherit", fontSize: 10.5, padding: 0 }}
          >
            {isCollapsed ? `[+${comment.children.length}]` : "[–]"}
          </button>
        )}
      </div>
      {!isCollapsed && (
        <>
          <p style={{ fontSize: 13, color: "var(--text)", margin: "3px 0 6px", lineHeight: 1.5 }}>{comment.text}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => onVote(comment.id, true, 1)} disabled={!isOnline} aria-label="Upvote" style={voteBtnStyle}>▲</button>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: myVote ? "#9D6BFF" : "var(--text-dim)" }}>{score}</span>
            <button onClick={() => onVote(comment.id, true, -1)} disabled={!isOnline} aria-label="Downvote" style={voteBtnStyle}>▼</button>
            <button
              onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyText(""); setReplyError(""); }}
              disabled={!isOnline}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "none", color: "#3DF2E0", cursor: isOnline ? "pointer" : "default", padding: "2px 6px", opacity: isOnline ? 1 : 0.6 }}
            >
              reply
            </button>
            <button
              onClick={() => onReport({ kind: "comment", id: comment.id, label: comment.text.slice(0, 60) })}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", padding: "2px 6px" }}
            >
              report
            </button>
          </div>
          {replyTo === comment.id && (
            <ReplyBox
              value={replyText}
              onChange={setReplyText}
              error={replyError}
              isOnline={isOnline}
              autoFocus
              onCancel={() => { setReplyTo(null); setReplyText(""); setReplyError(""); }}
              onSubmit={() => onSubmitReply(postId, comment.id)}
            />
          )}
          {comment.children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              postId={postId}
              scores={scores}
              myVotes={myVotes}
              onVote={onVote}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              replyError={replyError}
              setReplyError={setReplyError}
              onSubmitReply={onSubmitReply}
              isOnline={isOnline}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onReport={onReport}
            />
          ))}
        </>
      )}
    </div>
  );
}

export function Community({ isOnline, currentFestival, posts, comments, scores, myVotes, loading, createPost, createComment, vote, onReport }) {
  const artistPosts = ARTIST_POSTS.filter((a) => a.festival === currentFestival);
  const [sort, setSort] = useState("hot");
  const [flairFilter, setFlairFilter] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeFlair, setComposeFlair] = useState("vibes");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeError, setComposeError] = useState("");
  // Nested-reply state is shared across the whole open thread rather than
  // per-comment -- only one reply box is ever open at a time, so there's
  // nothing to gain from tracking text/errors per comment id.
  const [replyTo, setReplyTo] = useState(null); // null | "post" | a comment id
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());

  function toggleCollapse(id) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submitPost() {
    if (!composeTitle.trim()) {
      setComposeError("Write something first");
      return;
    }
    const { error } = await createPost(composeFlair, composeTitle.trim());
    if (error) {
      setComposeError(error.message || "Couldn't post — try again.");
      return;
    }
    setComposeTitle("");
    setComposeError("");
    setComposeOpen(false);
  }

  async function submitReply(postId, parentId) {
    if (!replyText.trim()) {
      setReplyError("Write a reply first");
      return;
    }
    const { error } = await createComment(postId, parentId, replyText.trim());
    if (error) {
      setReplyError(error.message || "Couldn't reply — try again.");
      return;
    }
    setReplyText("");
    setReplyError("");
    setReplyTo(null);
  }

  const sorted = posts.filter((p) => !flairFilter || p.flair === flairFilter).sort((a, b) => {
    const av = scores[a.id] ?? 1, bv = scores[b.id] ?? 1;
    if (sort === "top") return bv - av;
    if (sort === "new") return new Date(b.created_at) - new Date(a.created_at);
    const aComments = comments.filter((c) => c.post_id === a.id).length;
    const bComments = comments.filter((c) => c.post_id === b.id).length;
    return bv + bComments - (av + aComments);
  });

  if (openPost) {
    const p = posts.find((post) => post.id === openPost);
    if (!p) {
      return (
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "16px 16px" }}>
          <button onClick={() => setOpenPost(null)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← back</button>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 12 }}>This post is gone.</p>
        </div>
      );
    }
    const v = scores[p.id] ?? 1;
    const myVote = myVotes[p.id] || 0;
    const tree = buildCommentTree(comments, p.id);
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "16px 16px" }}>
        <button onClick={() => setOpenPost(null)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}>← back</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: FLAIRS[p.flair].color, border: `1px solid ${FLAIRS[p.flair].color}`, borderRadius: 5, padding: "2px 7px" }}>{FLAIRS[p.flair]?.label || p.flair}</span>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 700, margin: "10px 0 4px" }}>{p.title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-dimmer)", marginBottom: 12 }}>
          <span>u/{p.profiles?.handle || "deleted"}</span>
          <TierBadge username={p.profiles?.handle} />
          <span>· {relativeTime(p.created_at)} · {v} upvotes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <button onClick={() => vote(p.id, false, 1)} disabled={!isOnline} aria-label="Upvote" style={voteBtnStyle}>▲</button>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: myVote ? "#9D6BFF" : "var(--text-dim)" }}>{v}</span>
          <button onClick={() => vote(p.id, false, -1)} disabled={!isOnline} aria-label="Downvote" style={voteBtnStyle}>▼</button>
          <button
            onClick={() => onReport({ kind: "post", id: p.id, label: p.title.slice(0, 60) })}
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", padding: "2px 6px", marginLeft: 4 }}
          >
            report
          </button>
        </div>

        <div>
          {tree.length === 0 && <p style={{ fontSize: 13, color: "var(--text-dimmer)" }}>No comments yet — be the first to reply.</p>}
          {tree.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              depth={0}
              postId={p.id}
              scores={scores}
              myVotes={myVotes}
              onVote={vote}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              replyError={replyError}
              setReplyError={setReplyError}
              onSubmitReply={submitReply}
              isOnline={isOnline}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onReport={onReport}
            />
          ))}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <ReplyBox
            value={replyTo === "post" ? replyText : ""}
            onChange={(v) => { setReplyTo("post"); setReplyText(v); }}
            error={replyTo === "post" ? replyError : ""}
            isOnline={isOnline}
            onSubmit={() => submitReply(p.id, null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["hot", "new", "top"].map((s) => (
            <button key={s} onClick={() => setSort(s)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, border: "1px solid " + (sort === s ? "#3DF2E0" : "var(--border)"), background: sort === s ? "rgba(61,242,224,0.1)" : "transparent", color: sort === s ? "#3DF2E0" : "var(--text-dim)", cursor: "pointer" }}>{s}</button>
          ))}
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          disabled={!isOnline}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "6px 12px", borderRadius: 7, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: isOnline ? "pointer" : "not-allowed", opacity: isOnline ? 1 : 0.6, whiteSpace: "nowrap" }}
        >
          + New post
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(FLAIRS).map(([key, f]) => (
          <button key={key} onClick={() => setFlairFilter(flairFilter === key ? null : key)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "4px 9px", borderRadius: 20, border: `1px solid ${flairFilter === key ? f.color : "var(--border)"}`, background: flairFilter === key ? `${f.color}1A` : "transparent", color: flairFilter === key ? f.color : "var(--text-dim)", cursor: "pointer" }}>{f.label}</button>
        ))}
      </div>

      {composeOpen && (
        <div style={{ border: "1px solid #3DF2E0", borderRadius: 12, padding: "12px 14px", marginBottom: 14, background: "var(--surface)" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.entries(FLAIRS).map(([key, f]) => (
              <button
                key={key}
                onClick={() => setComposeFlair(key)}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "3px 8px", borderRadius: 20, border: `1px solid ${composeFlair === key ? f.color : "var(--border)"}`, background: composeFlair === key ? `${f.color}1A` : "transparent", color: composeFlair === key ? f.color : "var(--text-dim)", cursor: "pointer" }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <textarea
            value={composeTitle}
            onChange={(e) => { setComposeTitle(e.target.value); if (composeError) setComposeError(""); }}
            placeholder="What's going on at the festival?"
            rows={2}
            style={{
              width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text)",
              background: "var(--surface)", border: `1px solid ${composeError ? "#FF3DA6" : "var(--border)"}`, borderRadius: 10,
              padding: "9px 11px", resize: "none", outline: "none",
            }}
          />
          {composeError && <p style={{ fontSize: 11, color: "#FF3DA6", margin: "5px 0 0" }}>{composeError}</p>}
          {!isOnline && <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0" }}>You're offline — reconnect to post.</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button onClick={() => { setComposeOpen(false); setComposeError(""); }} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}>Cancel</button>
            <button onClick={submitPost} disabled={!isOnline} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 14px", borderRadius: 8, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: isOnline ? "pointer" : "not-allowed", opacity: isOnline ? 1 : 0.6 }}>
              Post
            </button>
          </div>
        </div>
      )}

      {artistPosts.filter((a) => ARTIST_VERIFICATION[a.artistOf] === "verified").length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {artistPosts.filter((a) => ARTIST_VERIFICATION[a.artistOf] === "verified").map((a) => (
            <div key={a.id} style={{ border: "1px solid #FFB23D", borderRadius: 12, padding: "11px 12px", background: "rgba(255,178,61,0.08)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#FFB23D", letterSpacing: "0.3px" }}>
                <Icon name="verified" /> VERIFIED ARTIST · {a.artist.toUpperCase()}
              </span>
              <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 5px", lineHeight: 1.35, color: "#FFD9A0" }}>{a.title}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#C9915C" }}>{a.time} · {a.votes} upvotes</div>
            </div>
          ))}
        </div>
      )}

      {loading && posts.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-dimmer)", textAlign: "center", padding: "20px 0" }}>Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="facet-card" style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ position: "relative", zIndex: 3, fontSize: 14, color: "var(--text-dim)" }}>Nothing posted here yet.</div>
          <div style={{ position: "relative", zIndex: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "var(--text-dimmer)", marginTop: 6 }}>Be the first — tap "+ New post" above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((p, i) => {
            const v = scores[p.id] ?? 1;
            const myVote = myVotes[p.id] || 0;
            const commentCount = comments.filter((c) => c.post_id === p.id).length;
            return (
              <div key={p.id} className="facet-card" style={{ "--shine-delay": `${(i % 5) * 1.1}s`, display: "flex", gap: 10, padding: "11px 12px" }}>
                <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 26 }}>
                  <button onClick={() => vote(p.id, false, 1)} disabled={!isOnline} aria-label="Upvote" style={voteBtnStyle}>▲</button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: myVote ? "#9D6BFF" : "var(--text)" }}>{v}</span>
                  <button onClick={() => vote(p.id, false, -1)} disabled={!isOnline} aria-label="Downvote" style={voteBtnStyle}>▼</button>
                </div>
                <div style={{ position: "relative", zIndex: 3, flex: 1, cursor: "pointer" }} onClick={() => setOpenPost(p.id)}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: FLAIRS[p.flair]?.color || "var(--text-dim)", border: `1px solid ${FLAIRS[p.flair]?.color || "var(--border)"}`, borderRadius: 5, padding: "1px 6px" }}>{FLAIRS[p.flair]?.label || p.flair}</span>
                  <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 5px", lineHeight: 1.35 }}>{p.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-dimmer)" }}>
                    <span>u/{p.profiles?.handle || "deleted"}</span>
                    <TierBadge username={p.profiles?.handle} />
                    <span>· {relativeTime(p.created_at)} · {commentCount} comment{commentCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
