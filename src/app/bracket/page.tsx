import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  formatKickoffDate,
  formatKickoffTime,
  hostCountryFlag,
  KICKOFF_TIME_ZONE_LABEL,
} from "@/lib/format";

type MatchRow = Awaited<ReturnType<typeof loadMatches>>[number];

async function loadMatches() {
  return prisma.match.findMany({
    where: { stage: { not: "group" } },
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });
}

const STAGE_LABELS: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  F: "Final",
};

export default async function BracketPage() {
  const matches = await loadMatches();
  const byStage: Record<string, MatchRow[]> = {};
  for (const m of matches) {
    (byStage[m.stage] ??= []).push(m);
  }
  const r32 = byStage.R32 ?? [];
  const r16 = byStage.R16 ?? [];
  const qf = byStage.QF ?? [];
  const sf = byStage.SF ?? [];
  const finalMatch = byStage.F?.[0];
  const thirdPlace = byStage["3P"]?.[0];

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <header className="relative text-center py-4 sm:py-8 overflow-hidden">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="bracketGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c10fff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#060097" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#07003a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="200" fill="url(#bracketGlow)" />
          <g
            fill="none"
            stroke="#c10fff"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          >
            <line x1="400" y1="0" x2="400" y2="200" />
            <circle cx="400" cy="100" r="48" />
          </g>
        </svg>
        <div className="relative">
          <p
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(193,15,255,0.15)",
              color: "#c10fff",
              border: "1px solid rgba(193,15,255,0.3)",
            }}
          >
            🏆 Knockout Stage
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-3">
            <span className="cm-text-gradient">2026 Bracket</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            R32 → Final. Teams fill in as the group stage concludes — winners
            advance automatically when results are entered.
          </p>
        </div>
      </header>

      {/* Bracket grid — horizontally scrollable on narrow viewports. The grid
          gives each round its own column; later-round cells span multiple
          base rows and use align-self: center to slot between their feeders,
          producing the classic tournament-bracket spatial alignment.
          Mobile: snap-x mandatory so swipes settle on one round at a time. */}
      <div className="overflow-x-auto -mx-4 px-4 pb-4 snap-x snap-mandatory scroll-smooth scroll-pl-4">
        <div
          className="grid gap-x-5 gap-y-2 min-w-[1100px]"
          style={{
            gridTemplateColumns:
              "minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr)",
            gridTemplateRows: "repeat(16, minmax(54px, auto))",
          }}
        >
          {/* Column headers — also act as horizontal snap targets. */}
          {(["R32", "R16", "QF", "SF", "F"] as const).map((s, idx) => (
            <div
              key={s}
              className="text-xs uppercase tracking-wider font-semibold text-slate-500 pb-1 border-b snap-start scroll-ml-4"
              style={{
                gridColumn: idx + 1,
                gridRow: "1 / 2",
                borderColor: "rgba(193,15,255,0.15)",
              }}
            >
              {STAGE_LABELS[s]}
            </div>
          ))}

          {/* R32: 16 cells, one per row */}
          {r32.map((m, i) => (
            <div
              key={m.id}
              style={{ gridColumn: 1, gridRow: `${i + 1} / span 1` }}
              className="self-center"
            >
              <BracketCell match={m} />
            </div>
          ))}

          {/* R16: 8 cells, each spanning 2 rows, centered on the gap */}
          {r16.map((m, i) => (
            <div
              key={m.id}
              style={{ gridColumn: 2, gridRow: `${i * 2 + 1} / span 2` }}
              className="self-center"
            >
              <BracketCell match={m} />
            </div>
          ))}

          {/* QF: 4 cells × 4-row span */}
          {qf.map((m, i) => (
            <div
              key={m.id}
              style={{ gridColumn: 3, gridRow: `${i * 4 + 1} / span 4` }}
              className="self-center"
            >
              <BracketCell match={m} />
            </div>
          ))}

          {/* SF: 2 cells × 8-row span */}
          {sf.map((m, i) => (
            <div
              key={m.id}
              style={{ gridColumn: 4, gridRow: `${i * 8 + 1} / span 8` }}
              className="self-center"
            >
              <BracketCell match={m} accent />
            </div>
          ))}

          {/* Final: spans the entire vertical extent of column 5 */}
          {finalMatch && (
            <div
              style={{ gridColumn: 5, gridRow: "1 / span 16" }}
              className="self-center"
            >
              <BracketCell match={finalMatch} accent trophy />
            </div>
          )}
        </div>
      </div>

      {/* 3rd-place playoff lives off to the side, smaller card. */}
      {thirdPlace && (
        <div className="max-w-md mx-auto">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 text-center">
            🥉 Third-place playoff
          </p>
          <BracketCell match={thirdPlace} />
        </div>
      )}
    </div>
  );
}

function BracketCell({
  match,
  accent = false,
  trophy = false,
}: {
  match: MatchRow;
  accent?: boolean;
  trophy?: boolean;
}) {
  const played = match.homeScore !== null && match.awayScore !== null;
  const decided =
    played &&
    (match.homeScore !== match.awayScore ||
      (match.penaltyHomeScore !== null &&
        match.penaltyAwayScore !== null &&
        match.penaltyHomeScore !== match.penaltyAwayScore));
  // Winner team id for visual highlighting.
  let winnerId: string | null = null;
  if (decided && match.homeScore !== null && match.awayScore !== null) {
    if (match.homeScore > match.awayScore) winnerId = match.homeTeamId;
    else if (match.awayScore > match.homeScore) winnerId = match.awayTeamId;
    else if (
      match.penaltyHomeScore !== null &&
      match.penaltyAwayScore !== null
    ) {
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
        borderColor: accent
          ? "rgba(255,205,87,0.35)"
          : "rgba(193,15,255,0.2)",
        boxShadow: trophy
          ? "0 12px 36px -16px rgba(255,205,87,0.5), 0 4px 18px -8px rgba(193,15,255,0.55)"
          : accent
          ? "0 6px 22px -12px rgba(193,15,255,0.45)"
          : undefined,
      }}
    >
      <div
        className="px-2 py-1 text-[10px] uppercase tracking-wider font-mono flex items-center justify-between"
        style={{
          color: trophy ? "#ffcd57" : "#8f9fa3",
          borderBottom: "1px solid rgba(193,15,255,0.08)",
        }}
      >
        <span>
          {trophy ? "🏆 Final · " : ""}#{match.matchNumber}
        </span>
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
      />
      <BracketTeamRow
        team={match.awayTeam}
        score={match.awayScore}
        penaltyScore={match.penaltyAwayScore}
        played={played}
        isWinner={winnerId === match.awayTeamId}
        bottom
      />
      {match.city && (
        <p
          className="text-[10px] text-slate-400 px-2 py-1 truncate"
          style={{ borderTop: "1px solid rgba(193,15,255,0.08)" }}
        >
          {match.venue} · {match.city}{" "}
          {match.country && (
            <span title={match.country}>{hostCountryFlag(match.country)}</span>
          )}
        </p>
      )}
    </div>
  );
}

function BracketTeamRow({
  team,
  score,
  penaltyScore,
  played,
  isWinner,
  bottom = false,
}: {
  team: { name: string; code: string; flagEmoji: string } | null;
  score: number | null;
  penaltyScore: number | null;
  played: boolean;
  isWinner: boolean;
  bottom?: boolean;
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
      <span className="text-base leading-none shrink-0">
        {team?.flagEmoji ?? "❓"}
      </span>
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
      {played && score !== null && (
        <Badge
          variant="outline"
          className="text-xs font-extrabold tabular-nums"
          style={{
            color: isWinner ? "#ffcd57" : "#8f9fa3",
            borderColor: isWinner
              ? "rgba(255,205,87,0.5)"
              : "rgba(193,15,255,0.2)",
            minWidth: "1.75rem",
            justifyContent: "center",
            padding: "0.05rem 0.4rem",
          }}
        >
          {score}
          {penaltyScore !== null && (
            <span className="text-[10px] font-mono ml-1 opacity-70">
              ({penaltyScore})
            </span>
          )}
        </Badge>
      )}
    </div>
  );
}
