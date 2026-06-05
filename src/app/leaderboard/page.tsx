import { getLeaderboard } from "@/lib/scoring";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Public page — revalidate every 30 seconds so results land quickly
// without hitting the DB on every concurrent request.
export const revalidate = 30;

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-8">
      <header className="relative text-center py-4 sm:py-8 overflow-hidden">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="lbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffcd57" stopOpacity="0.18" />
              <stop offset="55%" stopColor="#c10fff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#07003a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="200" fill="url(#lbGlow)" />
          <g fill="none" stroke="#c10fff" strokeOpacity="0.18" strokeWidth="1.5">
            <line x1="400" y1="0" x2="400" y2="200" />
            <circle cx="400" cy="100" r="48" />
          </g>
        </svg>
        <div className="relative">
          <p
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(255,205,87,0.15)",
              color: "#ffcd57",
              border: "1px solid rgba(255,205,87,0.3)",
            }}
          >
            🏆 Standings
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-3">
            <span className="cm-text-gradient">Leaderboard</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Match tips + tournament predictions + top scorer picks.
          </p>
        </div>
      </header>

      {/* Podium cards */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((p, i) => {
            const isLeader = i === 0;
            return (
              <Card
                key={p.id}
                className="border cm-glow"
                style={{
                  background: isLeader
                    ? "linear-gradient(135deg, rgba(193,15,255,0.25), rgba(255,205,87,0.12))"
                    : "rgba(13,0,96,0.5)",
                  borderColor: isLeader ? "rgba(255,205,87,0.45)" : "rgba(193,15,255,0.25)",
                }}
              >
                <CardContent className="py-5 text-center">
                  <div className="text-4xl leading-none mb-2">{MEDALS[i]}</div>
                  <p className={"text-sm truncate " + (isLeader ? "font-bold text-white" : "font-medium text-slate-200")}>
                    {p.name}
                  </p>
                  <p
                    className="font-extrabold tabular-nums mt-1"
                    style={{
                      color: "#ffcd57",
                      fontSize: isLeader ? "2.5rem" : "2rem",
                      lineHeight: 1,
                      textShadow: isLeader ? "0 0 18px rgba(255,205,87,0.35)" : undefined,
                    }}
                  >
                    {p.total}
                    <span className="text-xs font-medium text-slate-500 ml-1">pts</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <Card>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No participants yet — be the first to drop a tip.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(193,15,255,0.1)" }}>
              {/* Header row */}
              <div className="grid grid-cols-[2.5rem_1fr_5rem] md:grid-cols-[3rem_1fr_4.5rem_5rem_4.5rem_5.5rem] gap-2 items-center px-3 sm:px-4 py-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <span>Rank</span>
                <span>Player</span>
                <span className="text-right hidden md:block">Tips</span>
                <span className="text-right hidden md:block">Tournament</span>
                <span className="text-right hidden md:block">Scorers</span>
                <span className="text-right">Total</span>
              </div>

              {leaderboard.map((player, idx) => {
                const isLeader = idx === 0;
                const isPodium = idx < 3;
                const medal = MEDALS[idx] ?? null;
                return (
                  <div
                    key={player.id}
                    className="grid grid-cols-[2.5rem_1fr_5rem] md:grid-cols-[3rem_1fr_4.5rem_5rem_4.5rem_5.5rem] gap-2 items-center px-3 sm:px-4 py-3"
                    style={
                      isLeader
                        ? {
                            background:
                              "linear-gradient(90deg, rgba(193,15,255,0.18), rgba(255,205,87,0.08) 70%, transparent)",
                            borderLeft: "3px solid #ffcd57",
                          }
                        : isPodium
                        ? { background: "linear-gradient(90deg, rgba(193,15,255,0.08), transparent)" }
                        : undefined
                    }
                  >
                    <span className={medal ? "text-xl" : "font-mono text-sm text-muted-foreground"}>
                      {medal ?? idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={"truncate flex items-center gap-1.5 " + (isLeader ? "font-bold text-white" : "font-medium")}>
                        {player.name}
                        {player.isBot && (
                          <span
                            className="shrink-0 text-xs px-1.5 py-0 rounded-full font-bold"
                            style={{ background: "rgba(0,180,216,0.2)", color: "#00b4d8", fontSize: "10px" }}
                          >
                            AI
                          </span>
                        )}
                      </p>
                      {player.email !== player.name && (
                        <p className="text-xs text-muted-foreground truncate">{player.email}</p>
                      )}
                    </div>
                    <span className="text-right tabular-nums text-sm text-slate-300 hidden md:block">
                      {player.matchPts}
                    </span>
                    <span className="text-right tabular-nums text-sm text-slate-300 hidden md:block">
                      {player.tournamentPts}
                    </span>
                    <span className="text-right tabular-nums text-sm text-slate-300 hidden md:block">
                      {player.topScorerPts}
                    </span>
                    <span
                      className="text-right font-extrabold tabular-nums"
                      style={{
                        color: isLeader ? "#ffcd57" : isPodium ? "#ffe6a3" : "var(--cm-foreground)",
                        fontSize: isLeader ? "1.5rem" : "1.05rem",
                        lineHeight: 1,
                        textShadow: isLeader ? "0 0 14px rgba(255,205,87,0.35)" : undefined,
                      }}
                    >
                      {player.total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring key */}
      <div className="flex justify-center gap-4 text-xs text-slate-400 flex-wrap">
        {[
          { label: "Exact score", pts: "5" },
          { label: "Correct result", pts: "3" },
          { label: "Tournament positions", pts: "15/10/5/3" },
          { label: "Each correct top scorer", pts: "5" },
        ].map(({ label, pts }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Badge variant="outline" style={{ color: "#ffcd57", borderColor: "rgba(255,205,87,0.4)" }}>
              {pts}
            </Badge>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
