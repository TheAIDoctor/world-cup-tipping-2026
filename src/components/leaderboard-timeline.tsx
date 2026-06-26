"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardTimeline } from "@/lib/scoring";

// Distinct-ish hue spread; saturation/lightness tuned for the dark theme.
function colorFor(index: number, total: number): string {
  const hue = Math.round((index * 360) / Math.max(total, 1));
  return `hsl(${hue} 72% 62%)`;
}

const W_PAD_L = 8;
const W_PAD_R = 12;
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
  const [tip, setTip] = useState<
    { x: number; y: number; name: string; value: string; match: string } | null
  >(null);
  const active = hover ?? pinned;

  // Fit the chart to the container width so it never scrolls horizontally;
  // the gap between matches simply shrinks as more results come in.
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(el.clientWidth, 280));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

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
  const chartW = width;
  const plotW = chartW - W_PAD_L - W_PAD_R;
  const maxPts = Math.max(1, ...players.map((p) => p.finalPoints));

  const stepX = (s: number) =>
    W_PAD_L + (stepCount <= 1 ? 0 : (s / (stepCount - 1)) * plotW);

  // Thin x-axis labels so they don't overlap when matches are tightly packed;
  // always keep the first and last.
  const labelStride = Math.max(
    1,
    Math.ceil(stepCount / Math.max(2, Math.floor(plotW / 46)))
  );
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
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
            View by
          </span>
          <div
            className="inline-flex rounded-lg border p-1 gap-1"
            style={{ borderColor: "rgba(193,15,255,0.4)", background: "var(--cm-card-deep)" }}
            role="tablist"
            aria-label="Timeline view mode"
          >
            {([
              { key: "rank", label: "Position", icon: "📊", hint: "rank" },
              { key: "points", label: "Points", icon: "📈", hint: "total" },
            ] as const).map((opt) => {
              const on = mode === opt.key;
              return (
                <button
                  key={opt.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setMode(opt.key)}
                  className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                  style={
                    on
                      ? { background: "linear-gradient(135deg, #060097, #c10fff)", color: "#fff", boxShadow: "0 0 12px rgba(193,15,255,0.45)" }
                      : { background: "rgba(193,15,255,0.10)", color: "var(--cm-foreground)" }
                  }
                >
                  {opt.icon} {opt.label}
                  <span className="ml-1 text-[10px] font-normal opacity-70">({opt.hint})</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Match-tipping race · {mode === "rank" ? "each player's rank after every match (1 = top)" : "each player's cumulative points over time"}
          {active && <> · highlighting <span style={{ color: "#ffcd57" }}>{players.find((p) => p.id === active)?.name}</span></>}
        </p>

        {/* Chart — fits the container width (no horizontal scroll) */}
        <div ref={containerRef} className="w-full relative">
          <svg
            viewBox={`0 0 ${chartW} ${H}`}
            style={{ width: "100%", height: H, display: "block" }}
            onMouseLeave={() => { setHover(null); setTip(null); }}
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

            {/* X labels (match results), rotated; thinned to avoid overlap */}
            {steps.map((st, s) => {
              if (s % labelStride !== 0 && s !== stepCount - 1) return null;
              const x = stepX(s);
              const y = H - BOTTOM + 13;
              return (
                <text
                  key={`xl-${s}`}
                  x={x}
                  y={y}
                  fontSize={8}
                  fill="rgba(148,163,184,0.85)"
                  textAnchor="end"
                  transform={`rotate(40 ${x} ${y})`}
                  style={{ whiteSpace: "pre" }}
                >
                  {st.label}
                </text>
              );
            })}

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

            {/* Data-point dots + hover tooltips for the highlighted player.
                Hover (or tap) any line to highlight it, then hover its dots to
                read the exact value and which match it was. */}
            {active &&
              (() => {
                const p = players.find((x) => x.id === active);
                if (!p) return null;
                return steps.map((st, s) => {
                  const cx = stepX(s);
                  const cy = yFor(p, s);
                  const value =
                    mode === "rank"
                      ? `Position #${p.ranks[s]}`
                      : `${p.points[s]} pt${p.points[s] === 1 ? "" : "s"}`;
                  const matchLabel = s === 0 ? "Start" : st.label;
                  const show = () => setTip({ x: cx, y: cy, name: p.name, value, match: matchLabel });
                  return (
                    <g key={`dot-${s}`}>
                      <circle cx={cx} cy={cy} r={3.4} fill="#ffcd57" stroke="#0b0030" strokeWidth={1} />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={show}
                        onMouseMove={show}
                        onMouseLeave={() => setTip(null)}
                        onClick={show}
                      />
                    </g>
                  );
                });
              })()}
          </svg>

          {tip && (() => {
            const leftPct = Math.min(92, Math.max(8, (tip.x / chartW) * 100));
            const above = tip.y > 70;
            return (
              <div
                className="pointer-events-none absolute z-10 rounded-md px-2 py-1 text-[11px] shadow-lg"
                style={{
                  left: `${leftPct}%`,
                  top: tip.y,
                  transform: above ? "translate(-50%, calc(-100% - 10px))" : "translate(-50%, 14px)",
                  background: "rgba(7,0,40,0.96)",
                  border: "1px solid rgba(193,15,255,0.55)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                <div className="font-bold" style={{ color: "#ffcd57" }}>{tip.name}</div>
                <div>
                  {tip.value} · <span style={{ color: "rgba(148,163,184,0.95)" }}>{tip.match}</span>
                </div>
              </div>
            );
          })()}
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
