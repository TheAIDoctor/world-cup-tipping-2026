import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatKickoffDate, formatKickoffTime } from "@/lib/format";

const STAGE_LABEL: Record<string, string> = {
  group: "Group Stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-Final",
  SF: "Semi-Final",
  "3P": "3rd Place",
  F: "Final",
};

const STAGE_ORDER = ["group", "R32", "R16", "QF", "SF", "3P", "F"];

export default async function MyTipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/my-tips");

  const userId = session.user.id;

  // Fetch all tips for this user, with match + team data
  const tips = await prisma.matchTip.findMany({
    where: { userId },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
    orderBy: { match: { date: "asc" } },
  });

  // Also fetch tournament prediction + top scorers
  const [tournamentPrediction, topScorerPrediction] = await Promise.all([
    prisma.tournamentPrediction.findUnique({ where: { userId } }),
    prisma.topScorerPrediction.findUnique({ where: { userId } }),
  ]);

  // Leaderboard rank
  const allUsers = await prisma.user.findMany({
    include: { matchTips: { select: { points: true } } },
  });
  const ranked = allUsers
    .map((u) => ({
      id: u.id,
      points: u.matchTips.reduce((s, t) => s + (t.points ?? 0), 0),
    }))
    .sort((a, b) => b.points - a.points);
  const rank = ranked.findIndex((u) => u.id === userId) + 1;
  const totalPoints = ranked.find((u) => u.id === userId)?.points ?? 0;

  // Group tips by stage
  const byStage = new Map<string, typeof tips>();
  for (const t of tips) {
    const stage = t.match.stage;
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage)!.push(t);
  }

  const stagesWithTips = STAGE_ORDER.filter((s) => byStage.has(s));
  const tipsSubmitted = tips.length;
  const tipsScored = tips.filter((t) => t.points !== null).length;
  const exactScores = tips.filter((t) => t.points === 5).length;
  const correctResults = tips.filter(
    (t) => t.points !== null && t.points >= 3
  ).length;

  const displayName =
    session.user.name || session.user.email?.split("@")[0] || "You";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <header className="relative text-center py-6 sm:py-10 overflow-hidden">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid slice"
        >
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
          <p
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-3"
            style={{
              background: "rgba(255,205,87,0.12)",
              color: "#ffcd57",
              border: "1px solid rgba(255,205,87,0.3)",
            }}
          >
            👤 {displayName}
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            <span className="cm-text-gradient">My Tips</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Your predictions, scores &amp; points
          </p>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Points",
            value: totalPoints,
            icon: "⭐",
            highlight: true,
          },
          {
            label: `Rank of ${ranked.length}`,
            value: rank > 0 ? `#${rank}` : "–",
            icon: "🏅",
            highlight: false,
          },
          {
            label: "Exact Scores",
            value: exactScores,
            icon: "🎯",
            highlight: false,
          },
          {
            label: "Correct Results",
            value: correctResults,
            icon: "✅",
            highlight: false,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{
              background: stat.highlight
                ? "linear-gradient(135deg, rgba(193,15,255,0.15), rgba(255,205,87,0.08))"
                : "var(--cm-card-bg)",
              borderColor: stat.highlight
                ? "rgba(255,205,87,0.35)"
                : "var(--cm-border)",
            }}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div
              className="text-2xl font-extrabold tabular-nums"
              style={{ color: stat.highlight ? "#ffcd57" : "var(--cm-foreground)" }}
            >
              {stat.value}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: "var(--cm-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* No tips yet */}
      {tipsSubmitted === 0 && (
        <div
          className="rounded-xl border p-8 text-center space-y-3"
          style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
        >
          <p className="text-4xl">📋</p>
          <p className="font-semibold text-lg">No tips submitted yet</p>
          <p className="text-sm" style={{ color: "var(--cm-muted)" }}>
            Head to the Tips page to predict match scores and start earning points.
          </p>
          <Link
            href="/tips"
            className="inline-block mt-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
          >
            Submit Tips →
          </Link>
        </div>
      )}

      {/* Tips by stage */}
      {stagesWithTips.map((stage) => {
        const stageTips = byStage.get(stage)!;
        const stagePoints = stageTips.reduce(
          (s, t) => s + (t.points ?? 0),
          0
        );
        const stageScored = stageTips.filter((t) => t.points !== null).length;

        return (
          <section key={stage} className="space-y-2">
            {/* Stage header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{STAGE_LABEL[stage] ?? stage}</h2>
              <span className="text-xs tabular-nums" style={{ color: "var(--cm-muted)" }}>
                {stageScored > 0
                  ? `${stagePoints} pts from ${stageScored} scored`
                  : `${stageTips.length} tips · not yet scored`}
              </span>
            </div>

            <div className="space-y-2">
              {stageTips.map((tip) => {
                const m = tip.match;
                const played =
                  m.homeScore !== null && m.awayScore !== null;
                const scored = tip.points !== null;

                // Determine result
                let resultLabel = "";
                let resultColor = "var(--cm-muted)";
                if (scored) {
                  if (tip.points === 5) {
                    resultLabel = "Exact score";
                    resultColor = "#ffcd57";
                  } else if (tip.points === 3) {
                    resultLabel = "Correct result";
                    resultColor = "rgb(134 239 172)";
                  } else {
                    resultLabel = "Wrong result";
                    resultColor = "rgb(252 165 165)";
                  }
                }

                return (
                  <div
                    key={tip.id}
                    className="rounded-lg border px-4 py-3"
                    style={{
                      background: "var(--cm-card-bg)",
                      borderColor:
                        tip.points === 5
                          ? "rgba(255,205,87,0.35)"
                          : tip.points === 3
                          ? "rgba(134,239,172,0.25)"
                          : scored && tip.points === 0
                          ? "rgba(252,165,165,0.2)"
                          : "var(--cm-border)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Teams + scores */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-[11px]" style={{ color: "var(--cm-muted)" }}>
                          {formatKickoffDate(m.date)} · {formatKickoffTime(m.date)}
                          {m.homeTeam?.group && stage === "group"
                            ? ` · Group ${m.homeTeam.group}`
                            : ""}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span>
                            {m.homeTeam?.flagEmoji ?? "❓"} {m.homeTeam?.code ?? "TBD"}
                          </span>
                          <span
                            className="tabular-nums font-extrabold text-base"
                            style={{ color: "#ffcd57" }}
                          >
                            {tip.homeScore}–{tip.awayScore}
                          </span>
                          <span>
                            {m.awayTeam?.code ?? "TBD"} {m.awayTeam?.flagEmoji ?? "❓"}
                          </span>
                        </div>
                        {played && (
                          <div
                            className="text-xs"
                            style={{ color: "var(--cm-muted)" }}
                          >
                            Result:{" "}
                            <span className="font-semibold" style={{ color: "var(--cm-foreground)" }}>
                              {m.homeScore}–{m.awayScore}
                            </span>
                          </div>
                        )}
                        {!played && (
                          <div
                            className="text-[11px] italic"
                            style={{ color: "var(--cm-muted)" }}
                          >
                            Not played yet
                          </div>
                        )}
                      </div>

                      {/* Points badge */}
                      <div className="shrink-0 text-right">
                        {scored ? (
                          <div>
                            <div
                              className="text-2xl font-extrabold tabular-nums leading-none"
                              style={{ color: resultColor }}
                            >
                              {tip.points}
                            </div>
                            <div
                              className="text-[10px] font-semibold mt-0.5"
                              style={{ color: resultColor }}
                            >
                              {resultLabel}
                            </div>
                          </div>
                        ) : played ? (
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: "var(--cm-muted)" }}
                          >
                            Pending
                          </span>
                        ) : (
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--cm-muted)" }}
                          >
                            –
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Tournament Prediction summary */}
      {(tournamentPrediction || topScorerPrediction) && (
        <section className="space-y-2">
          <h2 className="text-base font-bold">Tournament Predictions</h2>
          <div
            className="rounded-lg border px-4 py-4 space-y-3"
            style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
          >
            {tournamentPrediction && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: "🏆 Champion", value: tournamentPrediction.champion },
                  { label: "🥈 Runner-up", value: tournamentPrediction.runnerUp },
                  { label: "🥉 3rd Place", value: tournamentPrediction.third },
                  { label: "4️⃣ 4th Place", value: tournamentPrediction.fourth },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--cm-muted)" }}
                    >
                      {item.label}
                    </div>
                    <div className="font-semibold mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
            {topScorerPrediction && (
              <div>
                <div
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--cm-muted)" }}
                >
                  ⚽ Top Scorers
                </div>
                <div className="text-sm space-y-0.5">
                  <div>{topScorerPrediction.scorer1}</div>
                  <div>{topScorerPrediction.scorer2}</div>
                  <div>{topScorerPrediction.scorer3}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-4">
        <Link
          href="/tips"
          className="px-4 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
        >
          {tipsSubmitted > 0 ? "Update Tips →" : "Submit Tips →"}
        </Link>
        <Link
          href="/leaderboard"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
          style={{
            borderColor: "var(--cm-border)",
            color: "var(--cm-foreground)",
          }}
        >
          View Leaderboard
        </Link>
      </div>
    </div>
  );
}
