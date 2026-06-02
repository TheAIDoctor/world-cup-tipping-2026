"use client";

import { useEffect } from "react";
import { TEAM_INFO } from "@/lib/team-data";

interface TeamModalProps {
  team: { code: string; name: string; flagEmoji: string } | null;
  onClose: () => void;
}

export function TeamModal({ team, onClose }: TeamModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!team) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [team, onClose]);

  if (!team) return null;

  const info = TEAM_INFO[team.code];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={`${team.name} team profile`}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-70 z-10"
          style={{ background: "rgba(193,15,255,0.15)", color: "var(--cm-muted)" }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background: "linear-gradient(135deg, rgba(6,0,151,0.5), rgba(193,15,255,0.15))",
            borderBottom: "1px solid var(--cm-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">{team.flagEmoji}</span>
            <div>
              <h2 className="text-xl font-extrabold leading-tight">{team.name}</h2>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--cm-muted)" }}>{team.code}</p>
            </div>
          </div>

          {info && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className="px-2 py-1 rounded-md text-xs font-bold"
                style={{ background: "rgba(255,205,87,0.15)", color: "#ffcd57", border: "1px solid rgba(255,205,87,0.3)" }}
              >
                FIFA #{info.fifaRanking}
              </span>
              <span
                className="px-2 py-1 rounded-md text-xs font-semibold"
                style={{ background: "rgba(193,15,255,0.12)", color: "var(--cm-muted)", border: "1px solid var(--cm-border)" }}
              >
                {info.fifaPoints.toLocaleString()} pts
              </span>
              {info.worldCupTitles > 0 && (
                <span
                  className="px-2 py-1 rounded-md text-xs font-bold"
                  style={{ background: "rgba(255,205,87,0.25)", color: "#ffcd57", border: "1px solid rgba(255,205,87,0.5)" }}
                >
                  {"🏆".repeat(info.worldCupTitles)} {info.worldCupTitles}× World Champion
                </span>
              )}
            </div>
          )}
        </div>

        {info ? (
          <div className="px-5 py-4 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-3 text-center border"
                style={{ background: "var(--cm-card-deep)", borderColor: "var(--cm-border-faint)" }}
              >
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: "#ffcd57" }}>
                  {info.worldCupTitles}
                </div>
                <div className="text-[11px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                  World Cup Titles
                </div>
              </div>
              <div
                className="rounded-xl p-3 text-center border"
                style={{ background: "var(--cm-card-deep)", borderColor: "var(--cm-border-faint)" }}
              >
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: "#ffcd57" }}>
                  {info.worldCupAppearances === 0 ? "1st" : info.worldCupAppearances}
                </div>
                <div className="text-[11px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                  {info.worldCupAppearances === 0 ? "World Cup — Ever!" : "Previous World Cups"}
                </div>
              </div>
            </div>

            {/* Best finishes */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--cm-muted)" }}>
                🏅 Best World Cup Finishes
              </h3>
              <ul className="space-y-1.5">
                {info.bestFinishes.map((finish, i) => (
                  <li
                    key={i}
                    className="text-sm px-3 py-2 rounded-lg"
                    style={{ background: "var(--cm-card-deep)", color: "var(--cm-foreground)" }}
                  >
                    {finish}
                  </li>
                ))}
              </ul>
            </div>

            {/* Qualification summary */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--cm-muted)" }}>
                🎟️ How They Qualified
              </h3>
              <p
                className="text-sm leading-relaxed px-3 py-2 rounded-lg"
                style={{ background: "var(--cm-card-deep)", color: "var(--cm-foreground)" }}
              >
                {info.qualificationSummary}
              </p>
            </div>

            {/* Players to watch */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--cm-muted)" }}>
                ⭐ Players to Watch
              </h3>
              <div className="space-y-2">
                {info.playersToWatch.map((player) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border"
                    style={{ background: "var(--cm-card-deep)", borderColor: "var(--cm-border-faint)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{player.name}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--cm-muted)" }}>{player.club}</p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: "rgba(193,15,255,0.15)", color: "#c10fff" }}
                    >
                      {player.position}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-center pb-1" style={{ color: "var(--cm-muted)" }}>
              FIFA ranking &amp; points are approximate mid-2025 estimates.
            </p>
          </div>
        ) : (
          <div className="px-5 py-8 text-center" style={{ color: "var(--cm-muted)" }}>
            <p className="text-4xl mb-3">{team.flagEmoji}</p>
            <p className="text-sm">No detailed profile available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
