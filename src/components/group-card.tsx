"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hostCountryFlag, formatKickoffDate, formatKickoffTime } from "@/lib/format";
import { TeamModal } from "@/components/team-modal";

export type GroupMatchData = {
  id: string;
  matchNumber: number;
  date: string; // ISO string — serialisable across the RSC boundary
  homeTeam: { name: string; code: string; flagEmoji: string } | null;
  awayTeam: { name: string; code: string; flagEmoji: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  liveHomeScore?: number | null;
  liveAwayScore?: number | null;
  liveStatus?: string | null;
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

// Partition the six group-stage matches into three matchday pairs, each sorted
// by kick-off time. Matches arrive ordered by matchNumber (which tracks date),
// so consecutive pairs are always the correct matchday grouping.
function splitIntoMatchdays(matches: GroupMatchData[]): GroupMatchData[][] {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  const days: GroupMatchData[][] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    days.push(sorted.slice(i, i + 2));
  }
  return days.filter((d) => d.length > 0);
}

export function GroupCard({ group, standings, matches, venues }: GroupCardProps) {
  const matchdays = splitIntoMatchdays(matches);
  const [dayIdx, setDayIdx] = useState(0);
  const currentDay = matchdays[dayIdx] ?? [];
  const [selectedTeam, setSelectedTeam] = useState<GroupStanding["team"] | null>(null);

  return (
    <>
    <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
    <Card
      className="border flex flex-col"
      style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
    >
      {/* ── Card header ─────────────────────────────────────────────────── */}
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs shrink-0"
            style={{ background: "linear-gradient(135deg, #060097, #c10fff)", color: "#fff" }}
          >
            {group}
          </span>
          Group {group}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex flex-col gap-4 flex-1">

        {/* ── Standings table ──────────────────────────────────────────── */}
        {/* table-fixed keeps columns stable regardless of viewport width.
            Widths are set on <th> elements; <colgroup> is intentionally omitted
            because React treats indentation whitespace as invalid text children
            inside that element and raises a hydration error. */}
        <table className="w-full table-fixed border-collapse text-[11px]">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: "var(--cm-muted)" }}
            >
              <th className="text-left pb-1.5 font-semibold" style={{ width: "1.25rem" }}>#</th>
              <th className="text-left pb-1.5 font-semibold">Team</th>
              <th className="text-right pb-1.5 font-semibold" style={{ width: "1.5rem" }}>P</th>
              <th className="text-right pb-1.5 font-semibold" style={{ width: "1.5rem" }}>W</th>
              <th className="text-right pb-1.5 font-semibold" style={{ width: "1.5rem" }}>D</th>
              <th className="text-right pb-1.5 font-semibold" style={{ width: "1.5rem" }}>L</th>
              <th className="text-right pb-1.5 font-semibold" style={{ width: "2rem" }}>GD</th>
              <th className="text-right pb-1.5 font-semibold" style={{ width: "2rem", color: "#ffcd57" }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const advances = i < 2;
              return (
                <tr
                  key={s.team.id}
                  className="border-t cursor-pointer hover:brightness-125 transition-[filter]"
                  style={{
                    borderColor: "var(--cm-border-faint)",
                    background: advances
                      ? "linear-gradient(90deg, var(--cm-row-highlight), transparent 80%)"
                      : undefined,
                  }}
                  onClick={() => setSelectedTeam(s.team)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedTeam(s.team); }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${s.team.name} team profile`}
                >
                  {/* Position */}
                  <td
                    className="py-1.5 font-mono text-[10px]"
                    style={{ color: advances ? "#ffcd57" : "var(--cm-muted)" }}
                  >
                    {i + 1}
                  </td>

                  {/* Flag + code */}
                  <td className="py-1.5">
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="text-sm leading-none shrink-0">{s.team.flagEmoji}</span>
                      <span
                        className="truncate font-medium"
                        style={{ color: advances ? "var(--cm-foreground)" : "var(--cm-muted)" }}
                      >
                        {s.team.code}
                      </span>
                    </span>
                  </td>

                  {/* P */}
                  <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--cm-muted)" }}>
                    {s.played}
                  </td>

                  {/* W */}
                  <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: "var(--cm-foreground)" }}>
                    {s.won}
                  </td>

                  {/* D */}
                  <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--cm-muted)" }}>
                    {s.drawn}
                  </td>

                  {/* L */}
                  <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--cm-muted)" }}>
                    {s.lost}
                  </td>

                  {/* GD */}
                  <td
                    className="py-1.5 text-right tabular-nums font-medium"
                    style={{
                      color:
                        s.goalDiff > 0
                          ? "rgb(134 239 172)"
                          : s.goalDiff < 0
                          ? "rgb(252 165 165)"
                          : "var(--cm-muted)",
                    }}
                  >
                    {s.goalDiff > 0 ? "+" : ""}{s.goalDiff}
                  </td>

                  {/* Pts */}
                  <td
                    className="py-1.5 text-right tabular-nums font-bold"
                    style={{ color: advances ? "#ffcd57" : "var(--cm-foreground)" }}
                  >
                    {s.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="border-t -mx-4" style={{ borderColor: "var(--cm-border)" }} />

        {/* ── Matchday section ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Matchday nav */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--cm-muted)" }}
            >
              Matchday
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setDayIdx((d) => Math.max(0, d - 1))}
                disabled={dayIdx === 0}
                className="w-8 h-8 flex items-center justify-center rounded text-xl leading-none transition-opacity disabled:opacity-25"
                style={{ color: "#c10fff" }}
                aria-label="Previous matchday"
              >
                ‹
              </button>
              <span
                className="text-xs font-bold tabular-nums w-8 text-center"
                style={{ color: "#ffcd57" }}
              >
                {dayIdx + 1}/{matchdays.length || 3}
              </span>
              <button
                onClick={() => setDayIdx((d) => Math.min(matchdays.length - 1, d + 1))}
                disabled={dayIdx >= matchdays.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded text-xl leading-none transition-opacity disabled:opacity-25"
                style={{ color: "#c10fff" }}
                aria-label="Next matchday"
              >
                ›
              </button>
            </div>
          </div>

          {/* Two match cards side by side — always grid-cols-2 */}
          <div className="grid grid-cols-2 gap-2">
            {currentDay.map((m) => {
              const played = m.homeScore !== null && m.awayScore !== null;
              const live =
                !played &&
                m.liveStatus === "live" &&
                m.liveHomeScore !== null && m.liveHomeScore !== undefined &&
                m.liveAwayScore !== null && m.liveAwayScore !== undefined;
              const homeWon = played && m.homeScore! > m.awayScore!;
              const awayWon = played && m.awayScore! > m.homeScore!;

              return (
                <div
                  key={m.id}
                  className="rounded-lg border p-2.5 space-y-1.5"
                  style={{
                    background: "var(--cm-card-deep)",
                    borderColor: "var(--cm-border-faint)",
                  }}
                >
                  {/* Date + time (or LIVE indicator) */}
                  {live ? (
                    <p className="text-[10px] font-bold uppercase tracking-wider leading-tight text-red-400 animate-pulse">
                      ● Live now
                    </p>
                  ) : (
                    <p className="text-[10px] tabular-nums leading-tight" style={{ color: "var(--cm-muted)" }}>
                      {formatKickoffDate(m.date)}
                      <br />
                      {formatKickoffTime(m.date)} AEST
                    </p>
                  )}

                  {/* Home team */}
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span
                      className="flex items-center gap-1 min-w-0 flex-1"
                      style={{ color: homeWon ? "var(--cm-foreground)" : "var(--cm-muted)" }}
                    >
                      <span className="text-sm leading-none shrink-0">{m.homeTeam?.flagEmoji ?? "❓"}</span>
                      <span className={`text-[11px] truncate ${homeWon ? "font-semibold" : ""}`}>
                        {m.homeTeam?.code ?? "TBD"}
                      </span>
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums shrink-0"
                      style={{ color: played ? "#ffcd57" : live ? "#fff" : "var(--cm-muted)", minWidth: "1rem", textAlign: "right" }}
                    >
                      {played ? m.homeScore : live ? m.liveHomeScore : "–"}
                    </span>
                  </div>

                  {/* Away team */}
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span
                      className="flex items-center gap-1 min-w-0 flex-1"
                      style={{ color: awayWon ? "var(--cm-foreground)" : "var(--cm-muted)" }}
                    >
                      <span className="text-sm leading-none shrink-0">{m.awayTeam?.flagEmoji ?? "❓"}</span>
                      <span className={`text-[11px] truncate ${awayWon ? "font-semibold" : ""}`}>
                        {m.awayTeam?.code ?? "TBD"}
                      </span>
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums shrink-0"
                      style={{ color: played ? "#ffcd57" : live ? "#fff" : "var(--cm-muted)", minWidth: "1rem", textAlign: "right" }}
                    >
                      {played ? m.awayScore : live ? m.liveAwayScore : "–"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Venue footer ─────────────────────────────────────────────── */}
        {venues && (venues.countries.length > 0 || venues.cityCount > 0) && (
          <div
            className="border-t -mx-4 px-4 pt-3 flex items-center justify-between gap-2 text-[11px] mt-auto"
            style={{ borderColor: "var(--cm-border)", color: "var(--cm-muted)" }}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-sm leading-none">
                {venues.countries.map((c) => hostCountryFlag(c)).filter(Boolean).join("")}
              </span>
              <span className="truncate">
                {venues.countries.length === 1 ? venues.countries[0] : venues.countries.join(" · ")}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              {venues.cityCount} cit{venues.cityCount === 1 ? "y" : "ies"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
