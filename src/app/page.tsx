import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  formatKickoffDate,
  formatKickoffTime,
  hostCountryFlag,
  KICKOFF_TIME_ZONE_LABEL,
} from "@/lib/format";

export default async function HomePage() {
  const session = await auth();

  // Stats
  const [totalParticipants, totalTips] = await Promise.all([
    prisma.user.count(),
    prisma.matchTip.count(),
  ]);

  // Group-stage data: 48 teams across 12 groups + their 6 matches each.
  const [allTeams, groupMatches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.match.findMany({
      where: { stage: "group" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ matchNumber: "asc" }],
    }),
  ]);
  const teamsByGroup: Record<string, typeof allTeams> = {};
  for (const t of allTeams) {
    (teamsByGroup[t.group] ??= []).push(t);
  }
  const matchesByGroup: Record<string, typeof groupMatches> = {};
  for (const m of groupMatches) {
    const g = m.homeTeam?.group ?? m.awayTeam?.group ?? "?";
    (matchesByGroup[g] ??= []).push(m);
  }
  const groupLetters = Object.keys(teamsByGroup).sort();

  const tournamentStart = new Date("2026-06-11T00:00:00Z");
  const tournamentEnd = new Date("2026-07-19T00:00:00Z");
  const now = new Date();

  let timeInfo: { label: string; value: number | string };
  if (now < tournamentStart) {
    const daysUntil = Math.ceil(
      (tournamentStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    timeInfo = { label: "Days to Kick-off", value: daysUntil };
  } else if (now < tournamentEnd) {
    const daysRemaining = Math.ceil(
      (tournamentEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    timeInfo = { label: "Days Remaining", value: daysRemaining };
  } else {
    timeInfo = { label: "Tournament", value: "Finished" };
  }

  // Top 5 leaderboard
  const users = await prisma.user.findMany({
    include: {
      matchTips: { select: { points: true } },
    },
    take: 100,
  });

  const leaderboard = users
    .map((user) => ({
      id: user.id,
      name: user.name || user.email || "Unknown",
      points: user.matchTips.reduce((sum, t) => sum + (t.points ?? 0), 0),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero — stylised pitch SVG sits behind the title as a license-safe
          visual anchor (center circle + halfway line + corner arcs). */}
      <div className="relative text-center space-y-4 py-12 overflow-hidden">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 800 360"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="cmHeroGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c10fff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#060097" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#07003a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="360" fill="url(#cmHeroGlow)" />
          <g
            fill="none"
            stroke="#c10fff"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          >
            {/* halfway line */}
            <line x1="400" y1="0" x2="400" y2="360" />
            {/* centre circle + spot */}
            <circle cx="400" cy="180" r="86" />
            <circle cx="400" cy="180" r="2.5" fill="#c10fff" fillOpacity="0.35" />
            {/* corner arcs */}
            <path d="M0,0 A30,30 0 0 1 30,30" />
            <path d="M800,0 A30,30 0 0 0 770,30" />
            <path d="M0,360 A30,30 0 0 0 30,330" />
            <path d="M800,360 A30,30 0 0 1 770,330" />
          </g>
        </svg>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
            style={{ background: "rgba(193,15,255,0.15)", color: "#c10fff", border: "1px solid rgba(193,15,255,0.3)" }}>
            🌎 USA · Mexico · Canada — June 11 to July 19, 2026
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            <span className="cm-text-gradient">CloudMarc</span>
            <br />
            <span className="text-white">World Cup 2026</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto mt-4">
            Predict scores, pick your champion, and battle your teammates on the leaderboard.
          </p>
          {!session ? (
            <div className="pt-4">
              <Link href="/api/auth/signin">
                <Button size="lg" className="text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
                  style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}>
                  Join the Competition →
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-slate-400 text-sm mt-4">Welcome back, {session.user?.email?.split("@")[0]} 👋</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Participants", value: totalParticipants, icon: "👥" },
          { label: "Tips Submitted", value: totalTips, icon: "📋" },
          { label: timeInfo.label, value: timeInfo.value, icon: "⏱️" },
        ].map((stat) => (
          <Card key={stat.label} className="border cm-glow" style={{ background: "rgba(13,0,96,0.5)", borderColor: "rgba(193,15,255,0.2)" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-4xl font-extrabold mt-1" style={{ color: "#ffcd57" }}>{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top 5 Leaderboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Tippers</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tips submitted yet. Be the first!
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, i) => {
                const isLeader = i === 0;
                const medal = ["🥇", "🥈", "🥉"][i] ?? null;
                return (
                  <div
                    key={player.id}
                    className={
                      "flex items-center justify-between py-2 px-3 rounded-md " +
                      (isLeader
                        ? "border"
                        : "border-b border-border last:border-0")
                    }
                    style={
                      isLeader
                        ? {
                            background:
                              "linear-gradient(90deg, rgba(193,15,255,0.18), rgba(255,205,87,0.06) 70%, transparent)",
                            borderColor: "rgba(255,205,87,0.4)",
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          medal
                            ? "text-lg w-7 text-center"
                            : "text-muted-foreground font-mono text-sm w-7 text-center"
                        }
                      >
                        {medal ?? i + 1}
                      </span>
                      <span
                        className={
                          isLeader ? "font-semibold" : "font-medium"
                        }
                      >
                        {player.name}
                      </span>
                    </div>
                    <span
                      className="font-extrabold tabular-nums"
                      style={{
                        color: isLeader ? "#ffcd57" : undefined,
                        fontSize: isLeader ? "1.25rem" : "0.95rem",
                      }}
                    >
                      {player.points}
                      <span className="text-xs font-medium text-slate-500 ml-1">
                        pts
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4">
            <Link href="/leaderboard">
              <Button variant="outline" size="sm">
                View Full Leaderboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Groups & Fixtures */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">🌐 Groups & Fixtures</h2>
            <p className="text-sm text-slate-400 mt-1">
              48 teams · 12 groups · 72 group-stage matches
            </p>
          </div>
          <Link href="/tips">
            <Button variant="outline" size="sm">
              Tip these matches →
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupLetters.map((g) => {
            const teams = teamsByGroup[g] ?? [];
            const matches = matchesByGroup[g] ?? [];
            return (
              <Card
                key={g}
                className="border"
                style={{
                  background: "rgba(13,0,96,0.5)",
                  borderColor: "rgba(193,15,255,0.2)",
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-sm"
                      style={{
                        background: "linear-gradient(135deg, #060097, #c10fff)",
                        color: "#fff",
                      }}
                    >
                      {g}
                    </span>
                    <span>Group {g}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1">
                    {teams.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-lg leading-none">
                          {t.flagEmoji}
                        </span>
                        <span className="text-slate-200">{t.name}</span>
                        <span className="ml-auto text-[10px] font-mono text-slate-500">
                          {t.code}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className="pt-2 border-t"
                    style={{ borderColor: "rgba(193,15,255,0.15)" }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Fixtures
                    </p>
                    <ul className="space-y-2">
                      {matches.map((m) => {
                        const played =
                          m.homeScore !== null && m.awayScore !== null;
                        const dateLabel = formatKickoffDate(m.date);
                        const timeLabel = formatKickoffTime(m.date);
                        return (
                          <li key={m.id}>
                            <div
                              className="rounded-md border px-2 py-1.5"
                              style={{
                                background: "rgba(7,0,58,0.6)",
                                borderColor: "rgba(193,15,255,0.12)",
                              }}
                            >
                              <p className="text-center text-[10px] font-mono text-slate-500 leading-tight">
                                {dateLabel} · {timeLabel} {KICKOFF_TIME_ZONE_LABEL}
                              </p>
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs mt-0.5">
                                <span className="flex items-center gap-1 justify-end min-w-0">
                                  <span className="text-slate-300 truncate">
                                    {m.homeTeam?.code}
                                  </span>
                                  <span className="text-base leading-none shrink-0">
                                    {m.homeTeam?.flagEmoji}
                                  </span>
                                </span>
                                <span
                                  className={
                                    played
                                      ? "font-extrabold text-lg tabular-nums leading-none px-2"
                                      : "text-slate-500 text-sm px-2"
                                  }
                                  style={
                                    played
                                      ? {
                                          color: "#ffcd57",
                                          textShadow:
                                            "0 0 12px rgba(255,205,87,0.35)",
                                        }
                                      : undefined
                                  }
                                >
                                  {played
                                    ? `${m.homeScore}–${m.awayScore}`
                                    : "v"}
                                </span>
                                <span className="flex items-center gap-1 justify-start min-w-0">
                                  <span className="text-base leading-none shrink-0">
                                    {m.awayTeam?.flagEmoji}
                                  </span>
                                  <span className="text-slate-300 truncate">
                                    {m.awayTeam?.code}
                                  </span>
                                </span>
                              </div>
                              {(m.city || m.venue) && (
                                <p className="text-center text-[10px] text-slate-500 mt-1 truncate">
                                  {m.venue}
                                  {m.venue && m.city ? " · " : ""}
                                  {m.city}
                                  {m.country && (
                                    <span
                                      className="ml-1"
                                      title={m.country}
                                    >
                                      {hostCountryFlag(m.country)}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      {session && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/tips", icon: "📋", title: "Match Tips", desc: "Predict scores for all 72 group stage matches. 5 pts for exact score!" },
            { href: "/predict", icon: "🔮", title: "Tournament Predictions", desc: "Pick champion, finalists & top 3 scorers before June 11." },
            { href: "/leaderboard", icon: "🏆", title: "Leaderboard", desc: "See where you stand against your CloudMarc colleagues." },
          ].map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full cursor-pointer cm-card-hover"
                style={{ background: "rgba(13,0,96,0.5)", borderColor: "rgba(193,15,255,0.2)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{card.icon}</span>
                    <span>{card.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">{card.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
