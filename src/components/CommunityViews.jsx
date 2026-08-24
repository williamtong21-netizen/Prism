import { useState } from "react";
import { Icon, TierBadge, matchColor, fmtTime, matchLabel, voteBtnStyle, FRIEND_MATCHES, FLAIRS, ARTIST_VERIFICATION, ARTIST_POSTS, FESTIVAL_POSTS } from "../App.jsx";

// Split out of App.jsx (lazy-loaded from the Lineup/Crew/Community tabs) so
// a first-time visitor's initial sign-in load doesn't have to fetch this
// code before they're even signed in -- these three are only ever rendered
// once a festival + view are selected inside the main app.

export function DiscoverDeck({ sets, pickedIds, onAdd, currentDay, currentFestival, stages }) {
  // The discover range is deliberately mid-tier: high enough to be a
  // plausible fit, low enough that it's not already on your schedule.
  const deck = sets.filter((s) => s.festival === currentFestival && s.day === currentDay && s.match >= 40 && s.match < 80 && !pickedIds.has(s.id)).sort((a, b) => b.match - a.match);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState([]);

  const remaining = deck.filter((s) => !skipped.includes(s.id));
  const current = remaining[0];

  if (!current) {
    return (
      <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#8B85A3" }}>That's everyone in your discover range.</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", marginTop: 6 }}>
          {pickedIds.size} sets on your schedule so far
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", marginBottom: 10 }}>
        {remaining.length} left to discover
      </div>
      <div
        style={{
          border: `1px solid ${matchColor(current.match)}`, borderRadius: 16, padding: "22px 20px",
          background: "#1A1428",
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8B85A3" }}>
          {stages.find((st) => st.id === current.stage)?.name} · {fmtTime(current.start, current.day, current.festival)} · {current.genre}
        </span>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "0.5px", margin: "8px 0 6px" }}>
          {current.artist}
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: matchColor(current.match), border: `1px solid ${matchColor(current.match)}`, borderRadius: 6, padding: "3px 9px" }}>
          {current.match}% match
        </span>
        <p style={{ marginTop: 14, fontSize: 13.5, color: "#C9C3E0", lineHeight: 1.5, minHeight: 40 }}>
          {current.sounds_like || "New territory — not close to anything in your library yet."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={() => setSkipped((prev) => [...prev, current.id])}
          style={{
            flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "13px", borderRadius: 12,
            border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: "pointer",
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

export function CrewCompare({ sets, friends, sharing, onToggleSharing, onSelect, currentDay, currentFestival }) {
  const rows = sets.filter((s) => s.festival === currentFestival && s.day === currentDay && (s.match >= 50 || Object.values(FRIEND_MATCHES[s.id] || {}).some((v) => v >= 50))).sort((a, b) => a.start - b.start);
  return (
    <div style={{ border: "1px solid #2A2440", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead>
            <tr style={{ background: "#151024" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8B85A3", borderBottom: "1px solid #2A2440" }}>SET</th>
              <th style={{ textAlign: "center", padding: "10px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, borderBottom: "1px solid #2A2440" }}>You</th>
              {friends.map((f) => (
                <th key={f.id} style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #2A2440" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: f.color, color: "#0F0B1A", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.initial}</span>
                    <button onClick={() => onToggleSharing(f.id)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, background: "none", border: "1px solid #2A2440", borderRadius: 20, padding: "2px 6px", color: sharing[f.id] ? "#3DF2E0" : "#5B5470", cursor: "pointer" }}>
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
                <td style={{ padding: "9px 12px", borderBottom: "1px solid #201A33" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{s.artist}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#5B5470", marginTop: 2 }}>{fmtTime(s.start, s.day, s.festival)}</div>
                </td>
                <td style={{ textAlign: "center", padding: "9px", borderBottom: "1px solid #201A33" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: matchColor(s.match) }}>{matchLabel(s.match)}</span>
                </td>
                {friends.map((f) => {
                  const val = (FRIEND_MATCHES[s.id] || {})[f.id];
                  return (
                    <td key={f.id} style={{ textAlign: "center", padding: "9px", borderBottom: "1px solid #201A33" }}>
                      {!sharing[f.id] ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3A3552" }}>hidden</span>
                        : val != null ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: matchColor(val) }}>{val}%</span>
                        : <span style={{ color: "#3A3552", fontSize: 12 }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5B5470", borderTop: "1px solid #2A2440" }}>
        "Hidden" = sharing off for this crew. Still a member, matches just aren't visible.
      </p>
    </div>
  );
}

export function Community({ isOnline, onQueue, currentFestival }) {
  const posts = FESTIVAL_POSTS[currentFestival] || [];
  const artistPosts = ARTIST_POSTS.filter((a) => a.festival === currentFestival);
  const [sort, setSort] = useState("hot");
  const [flairFilter, setFlairFilter] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [votes, setVotes] = useState({});
  const [pendingVotes, setPendingVotes] = useState({});
  const [myPosts, setMyPosts] = useState([]);
  const [extraComments, setExtraComments] = useState({}); // postId -> [comment, ...]
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeFlair, setComposeFlair] = useState("vibes");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeError, setComposeError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");

  function vote(id, base, delta) {
    if (!isOnline) {
      setPendingVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + delta }));
      onQueue && onQueue();
      return;
    }
    setVotes((prev) => {
      const current = prev[id] ?? base;
      const already = prev[id] != null;
      return { ...prev, [id]: already ? current : current + delta };
    });
  }

  function submitPost() {
    if (!composeTitle.trim()) {
      setComposeError("Write something first");
      return;
    }
    const newPost = {
      id: `mine-${Date.now()}`,
      flair: composeFlair,
      title: composeTitle.trim(),
      author: "you",
      votes: 1,
      time: isOnline ? "just now" : "queued",
      comments: [],
      queued: !isOnline,
    };
    setMyPosts((prev) => [newPost, ...prev]);
    setComposeTitle("");
    setComposeError("");
    setComposeOpen(false);
    if (!isOnline) onQueue && onQueue();
  }

  function submitReply(postId) {
    if (!replyText.trim()) {
      setReplyError("Write a reply first");
      return;
    }
    const newComment = { id: `mine-c-${Date.now()}`, author: "you", text: replyText.trim(), votes: 1, queued: !isOnline };
    setExtraComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
    setReplyText("");
    setReplyError("");
    if (!isOnline) onQueue && onQueue();
  }

  const allPosts = [
    ...myPosts,
    ...posts.map((p) => (extraComments[p.id] ? { ...p, comments: [...p.comments, ...extraComments[p.id]] } : p)),
  ];

  const sorted = allPosts.filter((p) => !flairFilter || p.flair === flairFilter).sort((a, b) => {
    const av = votes[a.id] ?? a.votes, bv = votes[b.id] ?? b.votes;
    if (sort === "top") return bv - av;
    if (sort === "new") return allPosts.indexOf(a) - allPosts.indexOf(b);
    return bv + a.comments.length - (av + b.comments.length);
  });

  if (openPost) {
    const p = allPosts.find((post) => post.id === openPost) || openPost;
    const v = (votes[p.id] ?? p.votes) + (pendingVotes[p.id] || 0);
    return (
      <div style={{ border: "1px solid #2A2440", borderRadius: 14, padding: "16px 16px" }}>
        <button onClick={() => setOpenPost(null)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B85A3", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}>← back</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: FLAIRS[p.flair].color, border: `1px solid ${FLAIRS[p.flair].color}`, borderRadius: 5, padding: "2px 7px" }}>{FLAIRS[p.flair].label}</span>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 700, margin: "10px 0 4px" }}>{p.title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5B5470", marginBottom: 12 }}>
          <span>u/{p.author}</span>
          <TierBadge username={p.author} />
          <span>· {p.time} · {v} upvotes{pendingVotes[p.id] ? " · queued" : ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {p.comments.length === 0 && <p style={{ fontSize: 13, color: "#5B5470" }}>No comments yet — be the first to reply.</p>}
          {p.comments.map((c) => {
            const cv = (votes[c.id] ?? c.votes) + (pendingVotes[c.id] || 0);
            return (
              <div key={c.id} style={{ borderLeft: "2px solid #2A2440", paddingLeft: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>
                  <span>u/{c.author}</span>
                  <TierBadge username={c.author} />
                </div>
                <p style={{ fontSize: 13, color: "#F5F0FF", margin: "3px 0 6px", lineHeight: 1.5 }}>{c.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => vote(c.id, c.votes, 1)} aria-label="Upvote" style={voteBtnStyle}>▲</button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: pendingVotes[c.id] ? "#FFB23D" : "#8B85A3" }}>{cv}</span>
                  <button onClick={() => vote(c.id, c.votes, -1)} aria-label="Downvote" style={voteBtnStyle}>▼</button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #2A2440" }}>
          <textarea
            value={replyText}
            onChange={(e) => { setReplyText(e.target.value); if (replyError) setReplyError(""); }}
            placeholder="Add a reply…"
            rows={2}
            style={{
              width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F5F0FF",
              background: "#1A1428", border: `1px solid ${replyError ? "#FF3DA6" : "#2A2440"}`, borderRadius: 10,
              padding: "9px 11px", resize: "none", outline: "none",
            }}
          />
          {replyError && <p style={{ fontSize: 11, color: "#FF3DA6", margin: "5px 0 0" }}>{replyError}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={() => submitReply(p.id)}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 14px", borderRadius: 8, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer" }}
            >
              {isOnline ? "Reply" : "Queue reply"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["hot", "new", "top"].map((s) => (
            <button key={s} onClick={() => setSort(s)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, border: "1px solid " + (sort === s ? "#3DF2E0" : "#2A2440"), background: sort === s ? "rgba(61,242,224,0.1)" : "transparent", color: sort === s ? "#3DF2E0" : "#8B85A3", cursor: "pointer" }}>{s}</button>
          ))}
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "6px 12px", borderRadius: 7, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + New post
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(FLAIRS).map(([key, f]) => (
          <button key={key} onClick={() => setFlairFilter(flairFilter === key ? null : key)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "4px 9px", borderRadius: 20, border: `1px solid ${flairFilter === key ? f.color : "#2A2440"}`, background: flairFilter === key ? `${f.color}1A` : "transparent", color: flairFilter === key ? f.color : "#8B85A3", cursor: "pointer" }}>{f.label}</button>
        ))}
      </div>

      {composeOpen && (
        <div style={{ border: "1px solid #3DF2E0", borderRadius: 12, padding: "12px 14px", marginBottom: 14, background: "#1A1428" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.entries(FLAIRS).map(([key, f]) => (
              <button
                key={key}
                onClick={() => setComposeFlair(key)}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "3px 8px", borderRadius: 20, border: `1px solid ${composeFlair === key ? f.color : "#2A2440"}`, background: composeFlair === key ? `${f.color}1A` : "transparent", color: composeFlair === key ? f.color : "#8B85A3", cursor: "pointer" }}
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
              width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F5F0FF",
              background: "#151024", border: `1px solid ${composeError ? "#FF3DA6" : "#2A2440"}`, borderRadius: 10,
              padding: "9px 11px", resize: "none", outline: "none",
            }}
          />
          {composeError && <p style={{ fontSize: 11, color: "#FF3DA6", margin: "5px 0 0" }}>{composeError}</p>}
          {!isOnline && <p style={{ fontSize: 11, color: "#FFB23D", margin: "6px 0 0" }}>Offline — this will post once you're back online.</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button onClick={() => { setComposeOpen(false); setComposeError(""); }} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 12px", borderRadius: 8, border: "1px solid #2A2440", background: "transparent", color: "#8B85A3", cursor: "pointer" }}>Cancel</button>
            <button onClick={submitPost} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "8px 14px", borderRadius: 8, border: "1px solid #3DF2E0", background: "rgba(61,242,224,0.12)", color: "#3DF2E0", cursor: "pointer" }}>
              {isOnline ? "Post" : "Queue post"}
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((p) => {
          const v = (votes[p.id] ?? p.votes) + (pendingVotes[p.id] || 0);
          return (
            <div key={p.id} style={{ display: "flex", gap: 10, border: "1px solid #2A2440", borderRadius: 12, padding: "11px 12px", background: "#161225" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 26 }}>
                <button onClick={() => vote(p.id, p.votes, 1)} aria-label="Upvote" style={voteBtnStyle}>▲</button>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: pendingVotes[p.id] ? "#FFB23D" : "#F5F0FF" }}>{v}</span>
                <button onClick={() => vote(p.id, p.votes, -1)} aria-label="Downvote" style={voteBtnStyle}>▼</button>
              </div>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setOpenPost(p.id)}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: FLAIRS[p.flair].color, border: `1px solid ${FLAIRS[p.flair].color}`, borderRadius: 5, padding: "1px 6px" }}>{FLAIRS[p.flair].label}</span>
                <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 5px", lineHeight: 1.35 }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5B5470" }}>
                  <span>u/{p.author}</span>
                  <TierBadge username={p.author} />
                  <span>· {p.time} · {p.comments.length} comments</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
