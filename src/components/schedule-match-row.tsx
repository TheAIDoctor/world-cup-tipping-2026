"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatKickoffTime, hostCountryFlag } from "@/lib/format";
import { TeamModal } from "@/components/team-modal";

const STAGE_LABEL: Record<string, string> = {
  group: "Group",
  R32: "R32",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3P": "3rd",
  F: "Final",
};

const STAGE_COLOR: Record<string, string> = {
  group: "rgba(193,15,255,0.3)",
  R32: "rgba(96,165,250,0.45)",
  R16: "rgba(96,165,250,0.5)",
  QF: "rgba(167,139,250,0.55)",
  SF: "rgba(244,114,182,0.55)",
  "3P": "rgba(148,163,184,0.45)",
  F: "rgba(255,205,87,0.55)",
};

type Team = { name: string; code: string; flagEmoji: string; group: string };

export type ScheduleMatchData = {
  id: string;
  matchNumber: number;
  date: string;
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

export function ScheduleMatchRow({ match }: { match: ScheduleMatchData }) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const router = useRouter();

  const played = match.homeScore !== null && match.awayScore !== null;
  const homeWon = played && match.homeScore! > match.awayScore!;
  const awayWon = played && match.awayScore! > match.homeScore!;
  const time = formatKickoffTime(match.date);
  const stageLabel =
    match.stage === "group" && match.homeTeam?.group
      ? `Group ${match.homeTeam.group}`
      : STAGE_LABEL[match.stage] ?? match.stage;
  const stageColor = STAGE_COLOR[match.stage] ?? "rgba(193,15,255,0.3)";
  const stageBorder = stageColor;
  const stageText = stageColor.replace(/[\d.]+\)$/, "0.95)");

  const teamClass = (won: boolean) =>
    "text-sm sm:text-[15px] font-semibold truncate " +
    (won ? "text-white" : played ? "text-slate-400" : "text-slate-200");

  const openTeam = (team: Team | null, e: React.MouseEvent) => {
    if (!team) return;
    e.stopPropagation();
    setSelectedTeam(team);
  };

  return (
    <>
      <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      <div
        role="link"
        tabIndex={0}
        onClick={() => router.push(`/tips#match-${match.matchNumber}`)}
        onKeyDown={(e) => { if (e.key === "Enter") router.push(`/tips#match-${match.matchNumber}`); }}
        className="block rounded-lg border transition-colors hover:bg-purple-900/30 cursor-pointer"
        style={{ background: "var(--cm-card-deep)", borderColor: "var(--cm-border)" }}
      >
        {/* ─── Desktop / tablet ───────────────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5">
          {/* Time + stage */}
          <div className="w-20 shrink-0 flex flex-col items-start gap-0.5">
            <span className="text-lg font-bold tabular-nums leading-none text-white">{time}</span>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold px-1.5 py-0 leading-tight"
              style={{ borderColor: stageBorder, color: stageText }}
            >
              {stageLabel}
            </Badge>
          </div>

          {/* Home: name → flag */}
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <button
              onClick={(e) => openTeam(match.homeTeam, e)}
              className={teamClass(homeWon) + " text-right hover:opacity-75 transition-opacity bg-transparent border-0 p-0"}
            >
              {match.homeTeam?.name ?? "TBD"}
            </button>
            <button
              onClick={(e) => openTeam(match.homeTeam, e)}
              className="text-lg leading-none shrink-0 hover:opacity-75 transition-opacity bg-transparent border-0 p-0"
              aria-label={`View ${match.homeTeam?.name ?? "TBD"} profile`}
            >
              {match.homeTeam?.flagEmoji ?? "❓"}
            </button>
          </div>

          {/* Score / "v" */}
          <div className="shrink-0 w-16 text-center">
            {played ? (
              <span
                className="font-extrabold text-base tabular-nums whitespace-nowrap"
                style={{ color: "#ffcd57", textShadow: "0 0 10px rgba(255,205,87,0.3)" }}
              >
                {match.homeScore}<span className="px-0.5 text-slate-500">–</span>{match.awayScore}
              </span>
            ) : (
              <span className="text-slate-500 italic text-sm">v</span>
            )}
          </div>

          {/* Away: flag → name */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <button
              onClick={(e) => openTeam(match.awayTeam, e)}
              className="text-lg leading-none shrink-0 hover:opacity-75 transition-opacity bg-transparent border-0 p-0"
              aria-label={`View ${match.awayTeam?.name ?? "TBD"} profile`}
            >
              {match.awayTeam?.flagEmoji ?? "❓"}
            </button>
            <button
              onClick={(e) => openTeam(match.awayTeam, e)}
              className={teamClass(awayWon) + " text-left hover:opacity-75 transition-opacity bg-transparent border-0 p-0"}
            >
              {match.awayTeam?.name ?? "TBD"}
            </button>
          </div>

          {/* Venue */}
          <div className="w-52 shrink-0 text-right text-slate-400">
            {match.venue && (
              <p className="text-[12px] truncate" style={{ color: "rgb(203 213 225 / 0.85)" }}>
                {match.venue}
              </p>
            )}
            {match.city && (
              <p className="text-[11px] text-slate-500 truncate">
                {match.city}
                {match.country && (
                  <>, {match.country} <span>{hostCountryFlag(match.country)}</span></>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ─── Mobile ─────────────────────────────────────────────────── */}
        <div className="sm:hidden px-3 py-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold tabular-nums leading-none text-white shrink-0">{time}</span>
              <span
                className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                style={{ border: `1px solid ${stageBorder}`, color: stageText }}
              >
                {stageLabel}
              </span>
            </div>
            {match.city && (
              <span className="text-xs text-slate-400 truncate text-right">
                {match.city}
                {match.country && <> {hostCountryFlag(match.country)}</>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => openTeam(match.homeTeam, e)}
              className={teamClass(homeWon) + " flex-1 text-right hover:opacity-75 transition-opacity bg-transparent border-0 p-0"}
            >
              {match.homeTeam?.name ?? "TBD"}
            </button>
            <button
              onClick={(e) => openTeam(match.homeTeam, e)}
              className="text-base leading-none shrink-0 hover:opacity-75 transition-opacity bg-transparent border-0 p-0"
              aria-label={`View ${match.homeTeam?.name ?? "TBD"} profile`}
            >
              {match.homeTeam?.flagEmoji ?? "❓"}
            </button>
            <span className="shrink-0 w-12 text-center">
              {played ? (
                <span
                  className="font-extrabold text-sm tabular-nums whitespace-nowrap"
                  style={{ color: "#ffcd57", textShadow: "0 0 10px rgba(255,205,87,0.3)" }}
                >
                  {match.homeScore}<span className="px-0.5 text-slate-500">–</span>{match.awayScore}
                </span>
              ) : (
                <span className="text-slate-500 italic text-xs">v</span>
              )}
            </span>
            <button
              onClick={(e) => openTeam(match.awayTeam, e)}
              className="text-base leading-none shrink-0 hover:opacity-75 transition-opacity bg-transparent border-0 p-0"
              aria-label={`View ${match.awayTeam?.name ?? "TBD"} profile`}
            >
              {match.awayTeam?.flagEmoji ?? "❓"}
            </button>
            <button
              onClick={(e) => openTeam(match.awayTeam, e)}
              className={teamClass(awayWon) + " flex-1 text-left hover:opacity-75 transition-opacity bg-transparent border-0 p-0"}
            >
              {match.awayTeam?.name ?? "TBD"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
