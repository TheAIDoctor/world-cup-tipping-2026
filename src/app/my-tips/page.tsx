export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLeaderboard } from "@/lib/scoring";
import { STAGE_ORDER } from "@/lib/constants";
import { MyTipsList } from "@/components/my-tips-list";

export default async function MyTipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/my-tips");

  const userId = session.user.id;

  // Fetch this user's tips (with match details) and global leaderboard in parallel.
  const [tips, tournamentPrediction, topScorerPrediction, leaderboard] = await Promise.all([
    prisma.matchTip.findMany({
      where: { userId },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        points: true,
        match: {
          select: {
            id: true,
            stage: true,
            date: true,
            homeScore: true,
            awayScore: true,
            homeTeam: { select: { code: true, name: true, flagEmoji: true, group: true } },
            awayTeam: { select: { code: true, name: true, flagEmoji: true, group: true } },
          },
        },
      },
      orderBy: { match: { date: "asc" } },
    }),
    prisma.tournamentPrediction.findUnique({ where: { userId } }),
    prisma.topScorerPrediction.findUnique({ where: { userId } }),
    getLeaderboard(),
  ]);

  const rank = leaderboard.findIndex((p) => p.id === userId) + 1;
  const myScore = leaderboard.find((p) => p.id === userId);
  const totalPoints = myScore?.total ?? 0;

  // Group tips by stage for display.
  const byStage = new Map<string, typeof tips>();
  for (const t of tips) {
    const stage = t.match.stage;
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage)!.push(t);
  }
  const stagesWithTips = STAGE_ORDER.filter((s) => byStage.has(s));

  const exactScores = tips.filter((t) => t.points === 5).length;
  const correctResults = tips.filter((t) => t.points !== null && t.points >= 3).length;

  const displayName = session.user.name || session.user.email?.split("@")[0] || "You";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative text-center py-6 sm:py-10 overflow-hidden">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="myTipsGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffcd57" stopOpacity="0.15" />
              <stop offset="60%" stopColor="#c10fff" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#07003a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="200" fill="url(#myTipsGlow)" />
        </svg>
        <div className="relative">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-3" style={{ background: "rgba(255,205,87,0.12)", color: "#ffcd57", border: "1px solid rgba(255,205,87,0.3)" }}>
            👤 {displayName}
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            <span className="cm-text-gradient">My Tips</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Your predictions, scores &amp; points</p>
        </div>
      </header>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Points", value: totalPoints, icon: "⭐", highlight: true },
          { label: `Rank of ${leaderboard.length}`, value: rank > 0 ? `#${rank}` : "–", icon: "🏅", highlight: false },
          { label: "Exact Scores", value: exactScores, icon: "🎯", highlight: false },
          { label: "Correct Results", value: correctResults, icon: "✅", highlight: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{
              background: stat.highlight
                ? "linear-gradient(135deg, rgba(193,15,255,0.15), rgba(255,205,87,0.08))"
                : "var(--cm-card-bg)",
              borderColor: stat.highlight ? "rgba(255,205,87,0.35)" : "var(--cm-border)",
            }}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-extrabold tabular-nums" style={{ color: stat.highlight ? "#ffcd57" : "var(--cm-foreground)" }}>
              {stat.value}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: "var(--cm-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <MyTipsList
        tips={tips.map((t) => ({
          id: t.id,
          homeScore: t.homeScore,
          awayScore: t.awayScore,
          points: t.points,
          match: {
            id: t.match.id,
            stage: t.match.stage,
            date: t.match.date.toISOString(),
            homeScore: t.match.homeScore,
            awayScore: t.match.awayScore,
            homeTeam: t.match.homeTeam ?? null,
            awayTeam: t.match.awayTeam ?? null,
          },
        }))}
        tournamentPrediction={tournamentPrediction ? {
          champion: tournamentPrediction.champion,
          runnerUp: tournamentPrediction.runnerUp,
          third: tournamentPrediction.third,
          fourth: tournamentPrediction.fourth,
        } : null}
        topScorerPrediction={topScorerPrediction ? {
          scorer1: topScorerPrediction.scorer1,
          scorer2: topScorerPrediction.scorer2,
          scorer3: topScorerPrediction.scorer3,
        } : null}
        myScore={myScore}
      />
    </div>
  );
}
