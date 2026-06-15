"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardTimeline } from "@/lib/scoring";

// Distinct-ish hue spread; saturation/lightness tuned for the dark theme.
function colorFor(index: number, total: number): string {
  const hue = Math.round((index * 360) / Math.max(total, 1));
  return `hsl(${hue} 72% 62%)`;
}

const W_PAD_L = 8;
const W_PAD_R = 12;
const STEP_W = 88;       // px per match column
const H = 460;           // fixed chart height
const TOP = 18;
const BOTTOM = 56;
const PLOT_H = H - TOP - BOTTOM;

export function LeaderboardTimeline({
  data,
  currentUserId,
}: {
  data: LeaderboardTimeline;
  currentUserId?: string | null;
}) {
  const [mode, setMode] = useState<"rank" | "points">("rank");
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hover ?? pinned;

  const { steps, players } = data;

  if (steps.length <= 1 || players.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          The race timeline appears once the first match results are in.
        </CardContent>
      </Card>
    );
  }

  const stepCount = steps.length;
  const playerCount = players.length;
  const chartW = W_PAD_L + (stepCount - 1) * STEP_W + W_PAD_R;
  const maxPts = Math.max(1, ...players.map((p) => p.finalPoints));

  const stepX = (s: number) => W_PAD_L + s * STEP_W;
  const yFor = (player: LeaderboardTimeline["players"][number], s: number) => {
    if (mode === "rank") {
      // rank 1 at top → rank N at bottom
      return TOP + ((player.ranks[s] - 1) / Math.max(playerCount - 1, 1)) * PLOT_H;
    }
    // points: max at top → 0 at bottom
    return TOP + (1 - player.points[s] / maxPts) * PLOT_H;
  };

  const isActive = (id: string) => active === id;
  const dim = active !== null;

  // Y-axis reference labels
  const yTicks =
    mode === "rank"
      ? [1, ...(playerCount > 6 ? [Math.ceil(playerCount / 2)] : []), playerCount]
      : [0, Math.round(maxPts / 2), maxPts];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: "var(--cm-border)", background: "var(--cm-card-deep)" }}>
            {([
              { key: "rank", label: "Position" },
              { key: "points", label: "Points" },
            ] as const).map((opt) => {
              const on = mode === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  style={on ? { background: "linear-gradient(135deg, #060097, #c10fff)", color: "#fff" } : { color: "var(--cm-muted)" }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Match-tipping race · {mode === "rank" ? "rank after each match (1 = top)" : "cumulative points"}
            {active && <> · <span style={{ color: "#ffcd57" }}>{players.find((p) => p.id === active)?.name}</span></>}
          </p>
        </div>

        {/* Chart (horizontally scrollable when wide) */}
        <div className="overflow-x-auto -mx-4 px-4">
          <svg
            width={chartW}
            height={H}
            viewBox={`0 0 ${chartW} ${H}`}
            style={{ minWidth: chartW, display: "block" }}
            onMouseLeave={() => setHover(null)}
          >
            {/* Y ticks / gridlines */}
            {yTicks.map((t) => {
              const yy =
                mode === "rank"
                  ? TOP + ((t - 1) / Math.max(playerCount - 1, 1)) * PLOT_H
                  : TOP + (1 - t / maxPts) * PLOT_H;
              return (
                <g key={`yt-${t}`}>
                  <line x1={W_PAD_L} y1={yy} x2={chartW - W_PAD_R} y2={yy} stroke="rgba(193,15,255,0.12)" strokeWidth={1} />
                  <text x={W_PAD_L} y={yy - 3} fontSize={9} fill="rgba(148,163,184,0.8)">
                    {mode === "rank" ? `#${t}` : `${t}`}
                  </text>
                </g>
              );
            })}

            {/* X labels (match results), rotated for density */}
            {steps.map((st, s) => (
              <text
                key={`xl-${s}`}
                x={stepX(s)}
                y={H - BOTTOM + 14}
                fontSize={9}
                fill="rgba(148,163,184,0.85)"
                transform={`rotate(35 ${stepX(s)} ${H - BOTTOM + 14})`}
                style={{ whiteSpace: "pre" }}
              >
                {st.label}
              </text>
            ))}

            {/* Player lines */}
            {players.map((p, i) => {
              const pts = steps.map((_, s) => `${stepX(s)},${yFor(p, s).toFixed(1)}`).join(" ");
              const mine = p.id === currentUserId;
              const on = isActive(p.id);
              const color = p.isBot ? "#00b4d8" : colorFor(i, playerCount);
              const baseWidth = mine ? 2.6 : 1.6;
              return (
                <polyline
                  key={p.id}
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth={on ? 4 : baseWidth}
                  strokeOpacity={dim && !on ? 0.12 : p.isBot || mine ? 1 : 0.85}
                  strokeDasharray={p.isBot ? "5 3" : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ cursor: "pointer", transition: "stroke-opacity 120ms, stroke-width 120ms" }}
                  onMouseEnter={() => setHover(p.id)}
                  onClick={() => setPinned((prev) => (prev === p.id ? null : p.id))}
                >
                  <title>{p.name}</title>
                </polyline>
              );
            })}

            {/* End dots for the active line */}
            {active &&
              (() => {
                const p = players.find((x) => x.id === active);
                if (!p) return null;
                return steps.map((_, s) => (
                  <circle key={`d-${s}`} cx={stepX(s)} cy={yFor(p, s)} r={2.8} fill="#ffcd57" />
                ));
              })()}
          </svg>
        </div>

        {/* Legend — click/hover to highlight a line */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {players.map((p, i) => {
            const color = p.isBot ? "#00b4d8" : colorFor(i, playerCount);
            const on = isActive(p.id);
            const mine = p.id === currentUserId;
            return (
              <button
                key={p.id}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setPinned((prev) => (prev === p.id ? null : p.id))}
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors"
                style={{
                  borderColor: on ? "#ffcd57" : "var(--cm-border)",
                  background: on ? "rgba(255,205,87,0.12)" : "transparent",
                  color: dim && !on ? "var(--cm-muted)" : "var(--cm-foreground)",
                  opacity: dim && !on ? 0.5 : 1,
                }}
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="font-mono text-[10px] text-muted-foreground">#{p.finalRank}</span>
                <span className={"truncate max-w-[9rem] " + (mine ? "font-bold" : "")}>{p.name}</span>
                {mine && <span className="text-[9px]" style={{ color: "#ffcd57" }}>you</span>}
                {p.isBot && <span className="text-[9px]" style={{ color: "#00b4d8" }}>AI</span>}
                <span className="font-bold tabular-nums" style={{ color: "#ffcd57" }}>{p.finalPoints}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
