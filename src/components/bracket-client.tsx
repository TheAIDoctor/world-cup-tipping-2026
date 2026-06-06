"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatKickoffDate, formatKickoffTime, hostCountryFlag, KICKOFF_TIME_ZONE_LABEL } from "@/lib/format";
import { TeamModal } from "@/components/team-modal";

type Team = { name: string; code: string; flagEmoji: string };

export type BracketMatchData = {
  id: string;
  matchNumber: number;
  stage: string;
  date: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

// ── Single team row inside a bracket cell ──────────────────────────────────
function BracketTeamRow({
  team,
  score,
  penaltyScore,
  played,
  isWinner,
  bottom = false,
  onTeamClick,
}: {
  team: Team | null;
  score: number | null;
  penaltyScore: number | null;
  played: boolean;
  isWinner: boolean;
  bottom?: boolean;
  onTeamClick: (team: Team) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5"
      style={{
        borderTop: bottom ? "1px solid rgba(193,15,255,0.08)" : undefined,
        background: isWinner
          ? "linear-gradient(90deg, rgba(255,205,87,0.18), rgba(255,205,87,0.04) 60%, transparent)"
          : undefined,
      }}
    >
      <button
        onClick={() => team && onTeamClick(team)}
        disabled={!team}
        className="flex items-center gap-2 flex-1 min-w-0 text-left bg-transparent border-0 p-0 hover:opacity-75 transition-opacity disabled:cursor-default disabled:hover:opacity-100"
        aria-label={team ? `View ${team.name} profile` : undefined}
      >
        <span className="text-base leading-none shrink-0">{team?.flagEmoji ?? "❓"}</span>
        <span
          className={
            "text-xs flex-1 truncate " +
            (team
              ? isWinner
                ? "font-bold text-white"
                : "text-slate-300"
              : "text-slate-500 italic")
          }
        >
          {team?.code ?? "TBD"}
        </span>
      </button>
      {played && score !== null && (
        <Badge
          variant="outline"
          className="text-xs font-extrabold tabular-nums"
          style={{
            color: isWinner ? "#ffcd57" : "#8f9fa3",
            borderColor: isWinner ? "rgba(255,205,87,0.5)" : "rgba(193,15,255,0.2)",
            minWidth: "1.75rem",
            justifyContent: "center",
            padding: "0.05rem 0.4rem",
          }}
        >
          {score}
          {penaltyScore !== null && (
            <span className="text-[10px] font-mono ml-1 opacity-70">({penaltyScore})</span>
          )}
        </Badge>
      )}
    </div>
  );
}

// ── Single bracket match card ──────────────────────────────────────────────
function BracketCell({
  match,
  accent = false,
  trophy = false,
  onTeamClick,
}: {
  match: BracketMatchData;
  accent?: boolean;
  trophy?: boolean;
  onTeamClick: (team: Team) => void;
}) {
  const played = match.homeScore !== null && match.awayScore !== null;
  const decided =
    played &&
    (match.homeScore !== match.awayScore ||
      (match.penaltyHomeScore !== null &&
        match.penaltyAwayScore !== null &&
        match.penaltyHomeScore !== match.penaltyAwayScore));

  let winnerId: string | null = null;
  if (decided && match.homeScore !== null && match.awayScore !== null) {
    if (match.homeScore > match.awayScore) winnerId = match.homeTeamId;
    else if (match.awayScore > match.homeScore) winnerId = match.awayTeamId;
    else if (match.penaltyHomeScore !== null && match.penaltyAwayScore !== null) {
      winnerId =
        match.penaltyHomeScore > match.penaltyAwayScore
          ? match.homeTeamId
          : match.awayTeamId;
    }
  }

  return (
    <div
      className="rounded-md border"
      style={{
        background: accent ? "rgba(13,0,96,0.7)" : "rgba(7,0,58,0.7)",
        borderColor: accent ? "rgba(255,205,87,0.35)" : "rgba(193,15,255,0.2)",
        boxShadow: trophy
          ? "0 12px 36px -16px rgba(255,205,87,0.5), 0 4px 18px -8px rgba(193,15,255,0.55)"
          : accent
          ? "0 6px 22px -12px rgba(193,15,255,0.45)"
          : undefined,
      }}
    >
      <div
        className="px-2 py-1 text-[10px] uppercase tracking-wider font-mono flex items-center justify-between"
        style={{ color: trophy ? "#ffcd57" : "#8f9fa3", borderBottom: "1px solid rgba(193,15,255,0.08)" }}
      >
        <span>{trophy ? "🏆 Final · " : ""}#{match.matchNumber}</span>
        <span className="truncate ml-2">
          {formatKickoffDate(match.date)} {formatKickoffTime(match.date)} {KICKOFF_TIME_ZONE_LABEL}
        </span>
      </div>
      <BracketTeamRow
        team={match.homeTeam}
        score={match.homeScore}
        penaltyScore={match.penaltyHomeScore}
        played={played}
        isWinner={winnerId === match.homeTeamId}
        onTeamClick={onTeamClick}
      />
      <BracketTeamRow
        team={match.awayTeam}
        score={match.awayScore}
        penaltyScore={match.penaltyAwayScore}
        played={played}
        isWinner={winnerId === match.awayTeamId}
        bottom
        onTeamClick={onTeamClick}
      />
      {match.city && (
        <p
          className="text-[10px] text-slate-400 px-2 py-1 truncate"
          style={{ borderTop: "1px solid rgba(193,15,255,0.08)" }}
        >
          {match.venue} · {match.city}{" "}
          {match.country && <span title={match.country}>{hostCountryFlag(match.country)}</span>}
        </p>
      )}
    </div>
  );
}

// ── Full bracket client view — owns modal state ────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  F: "Final",
};

export function BracketView({ matches }: { matches: BracketMatchData[] }) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const byStage: Record<string, BracketMatchData[]> = {};
  for (const m of matches) {
    (byStage[m.stage] ??= []).push(m);
  }
  const r32 = byStage.R32 ?? [];
  const r16 = byStage.R16 ?? [];
  const qf = byStage.QF ?? [];
  const sf = byStage.SF ?? [];
  const finalMatch = byStage.F?.[0];
  const thirdPlace = byStage["3P"]?.[0];

  const handleTeamClick = (team: Team) => setSelectedTeam(team);

  return (
    <>
      <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />

      <div className="overflow-x-auto -mx-4 px-4 pb-4 snap-x snap-mandatory scroll-smooth scroll-pl-4">
        <div
          className="grid gap-x-5 gap-y-2 min-w-[1100px]"
          style={{
            gridTemplateColumns: "minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr)",
            gridTemplateRows: "repeat(16, minmax(54px, auto))",
          }}
        >
          {(["R32", "R16", "QF", "SF", "F"] as const).map((s, idx) => (
            <div
              key={s}
              className="text-xs uppercase tracking-wider font-semibold text-slate-500 pb-1 border-b snap-start scroll-ml-4"
              style={{ gridColumn: idx + 1, gridRow: "1 / 2", borderColor: "rgba(193,15,255,0.15)" }}
            >
              {STAGE_LABELS[s]}
            </div>
          ))}

          {r32.map((m, i) => (
            <div key={m.id} style={{ gridColumn: 1, gridRow: `${i + 1} / span 1` }} className="self-center">
              <BracketCell match={m} onTeamClick={handleTeamClick} />
            </div>
          ))}
          {r16.map((m, i) => (
            <div key={m.id} style={{ gridColumn: 2, gridRow: `${i * 2 + 1} / span 2` }} className="self-center">
              <BracketCell match={m} onTeamClick={handleTeamClick} />
            </div>
          ))}
          {qf.map((m, i) => (
            <div key={m.id} style={{ gridColumn: 3, gridRow: `${i * 4 + 1} / span 4` }} className="self-center">
              <BracketCell match={m} onTeamClick={handleTeamClick} />
            </div>
          ))}
          {sf.map((m, i) => (
            <div key={m.id} style={{ gridColumn: 4, gridRow: `${i * 8 + 1} / span 8` }} className="self-center">
              <BracketCell match={m} accent onTeamClick={handleTeamClick} />
            </div>
          ))}
          {finalMatch && (
            <div style={{ gridColumn: 5, gridRow: "1 / span 16" }} className="self-center">
              <BracketCell match={finalMatch} accent trophy onTeamClick={handleTeamClick} />
            </div>
          )}
        </div>
      </div>

      {thirdPlace && (
        <div className="max-w-md mx-auto">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 text-center">
            🥉 Third-place playoff
          </p>
          <BracketCell match={thirdPlace} onTeamClick={handleTeamClick} />
        </div>
      )}
    </>
  );
}
