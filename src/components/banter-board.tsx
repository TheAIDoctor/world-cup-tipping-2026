"use client";

import { useState, useEffect, useRef } from "react";

const CLOUDY_EMAIL = "cloudy@wc26.cloudmarc.com.au";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null; email: string | null; isBot?: boolean };
}

interface BanterBoardProps {
  initialComments: Comment[];
  currentUserId: string | null;
  currentUserName: string | null;
  isAdmin: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function displayName(user: { name: string | null; email: string | null }) {
  return user.name || user.email?.split("@")[0] || "Anonymous";
}

function initials(user: { name: string | null; email: string | null }) {
  const n = displayName(user);
  return n.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "#c10fff", "#3b82f6", "#ff6b35", "#00b4d8",
  "#f72585", "#4cc9f0", "#ffcd57", "#06d6a0",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function BanterBoard({ initialComments, currentUserId, currentUserName, isAdmin }: BanterBoardProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 280;

  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const latest = sorted[sorted.length - 1];

  // Poll every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/comments");
      if (res.ok) setComments(await res.json());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Focus input when expanding
  useEffect(() => {
    if (expanded) setTimeout(() => inputRef.current?.focus(), 100);
  }, [expanded]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to post");
        return;
      }
      const newComment = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setText("");
    } catch {
      setError("Failed to post — try again");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        background: "var(--cm-card-bg)",
        borderColor: expanded ? "rgba(193,15,255,0.5)" : "var(--cm-border)",
        boxShadow: expanded ? "0 0 24px rgba(193,15,255,0.12)" : "none",
      }}
    >
      {/* ── Collapsed header / always-visible strip ────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        {/* Pulse dot when there are messages */}
        <div className="relative shrink-0">
          <span className="text-xl">🗣️</span>
          {comments.length > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#c10fff", borderColor: "var(--cm-card-bg)" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">Banter Board</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ background: "rgba(193,15,255,0.18)", color: "#e0aaff" }}
            >
              {comments.length} {comments.length === 1 ? "message" : "messages"}
            </span>
          </div>

          {/* Latest message preview when collapsed */}
          {!expanded && latest && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--cm-muted)" }}>
              <span className="font-semibold" style={{ color: avatarColor(displayName(latest.user)) }}>
                {displayName(latest.user)}:
              </span>{" "}
              {latest.content}
            </p>
          )}
          {!expanded && !latest && (
            <p className="text-xs mt-0.5" style={{ color: "var(--cm-muted)" }}>
              Be the first to talk trash 👀
            </p>
          )}
        </div>

        {/* Chevron */}
        <span
          className="text-xs transition-transform duration-300 shrink-0"
          style={{
            color: "var(--cm-muted)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {/* ── Expanded body ──────────────────────────────────────────────────── */}
      {expanded && (
        <>
          <div
            className="border-t"
            style={{ borderColor: "var(--cm-border-faint)" }}
          />

          {/* Messages */}
          <div className="h-72 overflow-y-auto flex flex-col gap-0.5 px-3 py-3">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                <span className="text-3xl">🦗</span>
                <p className="text-sm">Nothing yet. Be the first to talk trash.</p>
              </div>
            ) : (
              sorted.map((c) => {
                const isCloudy = c.user.email === CLOUDY_EMAIL || c.user.isBot;
                const name = displayName(c.user);
                const color = isCloudy ? "#00b4d8" : avatarColor(name);
                const isOwn = c.user.name === currentUserName;
                return (
                  <div
                    key={c.id}
                    className={`flex items-start gap-2.5 px-2 py-1.5 rounded-xl group ${isOwn ? "flex-row-reverse" : ""}`}
                    style={isOwn ? { background: "rgba(193,15,255,0.08)" } : isCloudy ? { background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" } : {}}
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: color, color: "#fff" }}
                    >
                      {isCloudy ? "☁️" : initials(c.user)}
                    </div>
                    {/* Bubble */}
                    <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? "items-end" : ""}`}>
                      <div className={`flex items-center gap-1.5 flex-wrap ${isOwn ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-semibold" style={{ color }}>
                          {isOwn ? "You" : name}
                        </span>
                        {isCloudy && (
                          <span
                            className="text-xs px-1.5 py-0 rounded-full font-bold"
                            style={{ background: "rgba(0,180,216,0.2)", color: "#00b4d8", fontSize: "10px" }}
                          >
                            AI
                          </span>
                        )}
                        <span className="text-xs opacity-40">{timeAgo(c.createdAt)}</span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-red-400"
                            title="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-sm leading-snug break-words" style={{ color: "var(--cm-foreground)" }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div
            className="border-t px-3 py-3"
            style={{ borderColor: "var(--cm-border-faint)" }}
          >
            {currentUserId ? (
              <form onSubmit={handlePost} className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePost(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder="Talk your football talk… 👀"
                    rows={2}
                    maxLength={MAX}
                    className="flex-1 rounded-xl px-3 py-2 text-sm border outline-none resize-none transition-all focus:ring-2 ring-offset-0"
                    style={{
                      background: "var(--cm-card-deep, rgba(13,0,96,0.3))",
                      borderColor: "var(--cm-border)",
                      color: "var(--cm-foreground)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={posting || !text.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                    style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
                  >
                    {posting ? "…" : "Send"}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  {error
                    ? <span className="text-xs text-red-400">{error}</span>
                    : <span className="text-xs opacity-0">_</span>
                  }
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: text.length > MAX * 0.85 ? "#f59e0b" : "var(--cm-muted)" }}
                  >
                    {text.length}/{MAX}
                  </span>
                </div>
              </form>
            ) : (
              <p className="text-sm text-center py-1" style={{ color: "var(--cm-muted)" }}>
                <a href="/signin" className="font-semibold underline-offset-2 hover:underline" style={{ color: "#c10fff" }}>
                  Sign in
                </a>{" "}
                to join the banter
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
