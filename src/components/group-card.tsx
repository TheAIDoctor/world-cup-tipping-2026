"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hostCountryFlag, formatKickoffDate, formatKickoffTime } from "@/lib/format";

export type GroupMatchData = {
  id: string;
  matchNumber: number;
  date: string; // ISO string — serialisable across the RSC boundary
  homeTeam: { name: string; code: string; flagEmoji: string } | null;
  awayTeam: { name: string; code: string; flagEmoji: string } | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type GroupStanding = {
  team: { id: string; name: string; code: string; flagEmoji: string; group: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

type GroupCardProps = {
  group: string;
  standings: GroupStanding[];
  matches: GroupMatchData[];
  venues: { countries: string[]; cityCount: number };
};

export function GroupCard({ group, standings, matches, venues }: GroupCardProps) {
  const chunk = (arr: GroupMatchData[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      [...arr.slice(i * size, i * size + size)].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
  const rounds = chunk(matches, 2).filter((r) => r.length > 0);
  const [roundIdx, setRoundIdx] = useState(0);
  const currentMatches = rounds[roundIdx] ?? [];

  return (
    <Card
      className="border py-3 gap-2"
      style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
    >
      <CardHeader className="px-3 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs shrink-0"
            style={{ background: "linear-gradient(135deg, #060097, #c10fff)", color: "#fff" }}
          >
            {group}
          </span>
          <span>Group {group}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 space-y-0">
        {/* Two-panel row: standings (left) + match carousel (right) */}
        <div className="flex flex-col sm:flex-row sm:gap-0">

          {/* ── Standings table ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Column headers — mobile shows P + Pts only; sm+ shows all */}
            <div
              className="gc-grid grid gap-x-1 items-center pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              <span />
              <span />
              <span className="text-right">P</span>
              <span className="hidden sm:block text-right">W</span>
              <span className="hidden sm:block text-right">D</span>
              <span className="hidden sm:block text-right">L</span>
              <span className="hidden sm:block text-right">GD</span>
              <span className="text-right">Pts</span>
            </div>
            <ul>
              {standings.map((s, i) => {
                const advances = i < 2;
                return (
                  <li
                    key={s.team.id}
                    className="gc-grid grid gap-x-1 items-center py-1.5 tabular-nums border-t"
                    style={{
                      borderColor: "var(--cm-border-faint)",
                      background: advances
                        ? "linear-gradient(90deg, var(--cm-row-highlight), transparent 60%)"
                        : undefined,
                    }}
                  >
                    {/* Position */}
                    <span
                      className="text-xs font-mono text-slate-500"
                      style={advances ? { color: "#ffcd57" } : undefined}
                    >
                      {i + 1}
                    </span>

                    {/* Flag + team code */}
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm leading-none shrink-0">{s.team.flagEmoji}</span>
                      <span
                        className="text-xs truncate font-medium"
                        style={{ color: advances ? "var(--cm-foreground)" : undefined }}
                      >
                        {s.team.code}
                      </span>
                    </span>

                    {/* P — played */}
                    <span className="text-right text-xs text-slate-400">{s.played}</span>

                    {/* W, D, L, GD — desktop only */}
                    <span className="hidden sm:block text-right text-[11px] text-slate-300">{s.won}</span>
                    <span className="hidden sm:block text-right text-[11px] text-slate-400">{s.drawn}</span>
                    <span className="hidden sm:block text-right text-[11px] text-slate-400">{s.lost}</span>
                    <span
                      className="hidden sm:block text-right text-[11px] text-slate-300"
                      style={
                        s.goalDiff > 0
                          ? { color: "rgb(134 239 172)" }
                          : s.goalDiff < 0
                          ? { color: "rgb(252 165 165)" }
                          : undefined
                      }
                    >
                      {s.goalDiff > 0 ? "+" : ""}{s.goalDiff}
                    </span>

                    {/* Pts */}
                    <span
                      className="text-right text-xs font-bold"
                      style={{ color: advances ? "#ffcd57" : "var(--cm-foreground)" }}
                    >
                      {s.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Match carousel ──────────────────────────────────────── */}
          <div
            className="mt-3 pt-3 border-t sm:mt-0 sm:pt-0 sm:border-t-0 sm:border-l sm:ml-3 sm:pl-3 sm:w-[150px] shrink-0"
            style={{ borderColor: "var(--cm-border)" }}
          >
            {/* Round nav */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Matchday
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setRoundIdx((r) => Math.max(0, r - 1))}
                  disabled={roundIdx === 0}
                  className="w-9 h-9 flex items-center justify-center rounded transition-opacity disabled:opacity-25 text-xl leading-none"
                  style={{ color: "#c10fff" }}
                  aria-label="Previous matchday"
                >
                  ‹
                </button>
                <span
                  className="text-xs font-bold tabular-nums w-6 text-center"
                  style={{ color: "#ffcd57" }}
                >
                  {roundIdx + 1}/3
                </span>
                <button
                  onClick={() => setRoundIdx((r) => Math.min(rounds.length - 1, r + 1))}
                  disabled={roundIdx === rounds.length - 1}
                  className="w-9 h-9 flex items-center justify-center rounded transition-opacity disabled:opacity-25 text-xl leading-none"
                  style={{ color: "#c10fff" }}
                  aria-label="Next matchday"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Match rows */}
            <div className="space-y-3">
              {currentMatches.map((m, idx) => {
                const played = m.homeScore !== null && m.awayScore !== null;
                const homeWon = played && m.homeScore! > m.awayScore!;
                const awayWon = played && m.awayScore! > m.homeScore!;
                return (
                  <div
                    key={m.id}
                    className={idx > 0 ? "pt-3 border-t" : ""}
                    style={{ borderColor: "var(--cm-border-faint)" }}
                  >
                    {/* Date + time */}
                    <p className="text-xs text-slate-500 tabular-nums mb-1.5">
                      {formatKickoffDate(m.date)} · {formatKickoffTime(m.date)}
                    </p>

                    {/* Home team */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={
                          "flex items-center gap-1 min-w-0 flex-1 " +
                          (homeWon
                            ? "font-semibold"
                            : played
                            ? "text-slate-400"
                            : "")
                        }
                        style={homeWon ? { color: "var(--cm-foreground)" } : undefined}
                      >
                        <span className="text-base leading-none shrink-0">
                          {m.homeTeam?.flagEmoji ?? "❓"}
                        </span>
                        <span className="text-xs truncate">
                          {m.homeTeam?.code ?? "TBD"}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-xs font-bold tabular-nums w-8 text-right"
                        style={{ color: played ? "#ffcd57" : "rgb(100 116 139)" }}
                      >
                        {played ? m.homeScore : "–"}
                      </span>
                    </div>

                    {/* Away team */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={
                          "flex items-center gap-1 min-w-0 flex-1 " +
                          (awayWon
                            ? "font-semibold"
                            : played
                            ? "text-slate-400"
                            : "")
                        }
                        style={awayWon ? { color: "var(--cm-foreground)" } : undefined}
                      >
                        <span className="text-base leading-none shrink-0">
                          {m.awayTeam?.flagEmoji ?? "❓"}
                        </span>
                        <span className="text-xs truncate">
                          {m.awayTeam?.code ?? "TBD"}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-xs font-bold tabular-nums w-8 text-right"
                        style={{ color: played ? "#ffcd57" : "rgb(100 116 139)" }}
                      >
                        {played ? m.awayScore : "–"}
                      </span>
                    </div>

                    {/* "vs" label when not yet played */}
                    {!played && (
                      <p className="text-[10px] text-slate-500 italic text-center mt-0.5">vs</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Venue footer */}
        {venues && (venues.countries.length > 0 || venues.cityCount > 0) && (
          <div
            className="mt-3 pt-2 border-t flex items-center justify-between gap-2 text-xs text-slate-400"
            style={{ borderColor: "var(--cm-border)" }}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-sm leading-none">
                {venues.countries
                  .map((c) => hostCountryFlag(c))
                  .filter(Boolean)
                  .join("")}
              </span>
              <span className="truncate">
                {venues.countries.length === 1
                  ? venues.countries[0]
                  : venues.countries.join(" · ")}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              {venues.cityCount} cit{venues.cityCount === 1 ? "y" : "ies"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
