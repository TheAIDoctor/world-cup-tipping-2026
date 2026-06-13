export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hostCountryFlag } from "@/lib/format";
import { GroupCard } from "@/components/group-card";
import { getLeaderboard } from "@/lib/scoring";
import { computeGroupStandings } from "@/lib/groups";
import Image from "next/image";
import { BanterBoard } from "@/components/banter-board";
import { NewsTicker } from "@/components/news-ticker";
import { LiveScoresPoller } from "@/components/live-scores-poller";

export default async function HomePage() {
  const session = await auth();

  // ── Parallel top-level fetches ─────────────────────────────────────────────
  const [totalParticipants, totalTips, allTeams, groupMatches, leaderboard, recentComments] =
    await Promise.all([
      prisma.user.count(),
      prisma.matchTip.count(),
      prisma.team.findMany({
        select: { id: true, name: true, code: true, flagEmoji: true, group: true },
        orderBy: [{ group: "asc" }, { name: "asc" }],
      }),
      prisma.match.findMany({
        where: { stage: "group" },
        select: {
          id: true,
          matchNumber: true,
          date: true,
          stage: true,
          homeScore: true,
          awayScore: true,
          liveHomeScore: true,
          liveAwayScore: true,
          liveStatus: true,
          homeTeamId: true,
          awayTeamId: true,
          city: true,
          country: true,
          homeTeam: { select: { id: true, name: true, code: true, flagEmoji: true, group: true } },
          awayTeam: { select: { id: true, name: true, code: true, flagEmoji: true, group: true } },
        },
        orderBy: [{ matchNumber: "asc" }],
      }),
      getLeaderboard(),
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { name: true, email: true, isBot: true } },
        },
      }),
    ]);

  // ── Group data structures ──────────────────────────────────────────────────
  const teamsByGroup: Record<string, typeof allTeams> = {};
  for (const t of allTeams) (teamsByGroup[t.group] ??= []).push(t);

  const matchesByGroup: Record<string, typeof groupMatches> = {};
  for (const m of groupMatches) {
    const g = m.homeTeam?.group ?? m.awayTeam?.group ?? "?";
    (matchesByGroup[g] ??= []).push(m);
  }

  const groupLetters = Object.keys(teamsByGroup).sort();

  const standingsByGroup: Record<string, ReturnType<typeof computeGroupStandings>> = {};
  for (const g of groupLetters) {
    standingsByGroup[g] = computeGroupStandings(
      teamsByGroup[g] ?? [],
      matchesByGroup[g] ?? []
    );
  }

  const venuesByGroup: Record<string, { countries: string[]; cityCount: number }> = {};
  for (const g of groupLetters) {
    const countries = new Set<string>();
    const cities = new Set<string>();
    for (const m of matchesByGroup[g] ?? []) {
      if (m.country) countries.add(m.country);
      if (m.city) cities.add(m.city);
    }
    venuesByGroup[g] = { countries: Array.from(countries).sort(), cityCount: cities.size };
  }

  // ── Tournament countdown ───────────────────────────────────────────────────
  const tournamentStart = new Date("2026-06-11T00:00:00Z");
  const tournamentEnd = new Date("2026-07-19T00:00:00Z");
  const now = new Date();
  let timeInfo: { label: string; value: number | string };
  if (now < tournamentStart) {
    const daysUntil = Math.ceil((tournamentStart.getTime() - now.getTime()) / 86_400_000);
    timeInfo = { label: "Days to Kick-off", value: daysUntil };
  } else if (now < tournamentEnd) {
    const daysRemaining = Math.ceil((tournamentEnd.getTime() - now.getTime()) / 86_400_000);
    timeInfo = { label: "Days Remaining", value: daysRemaining };
  } else {
    timeInfo = { label: "Tournament", value: "Finished" };
  }

  const top5 = leaderboard.slice(0, 5);
  const displayName = session?.user?.name || session?.user?.email?.split("@")[0];

  const kickoffTimes = groupMatches.map((m) => new Date(m.date).getTime());

  return (
    <div className="space-y-8">
      <LiveScoresPoller kickoffTimes={kickoffTimes} />
      {/* ── News Ticker ───────────────────────────────────────────────────── */}
      <NewsTicker />
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative text-center space-y-4 py-6 sm:py-10 overflow-hidden">
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
          <g fill="none" stroke="#c10fff" strokeOpacity="0.18" strokeWidth="1.5">
            <line x1="400" y1="0" x2="400" y2="360" />
            <circle cx="400" cy="180" r="86" />
            <circle cx="400" cy="180" r="2.5" fill="#c10fff" fillOpacity="0.35" />
            <path d="M0,0 A30,30 0 0 1 30,30" />
            <path d="M800,0 A30,30 0 0 0 770,30" />
            <path d="M0,360 A30,30 0 0 0 30,330" />
            <path d="M800,360 A30,30 0 0 1 770,330" />
          </g>

          {/* ── Fireworks ── */}
          {/* Burst 1 — left, purple */}
          <g transform="translate(130, 75)">
            <circle r="55" fill="none" stroke="#c10fff" strokeWidth="2.5" className="fw-ring" style={{ animationDelay: "0s" }} />
            <circle r="35" fill="none" stroke="#c10fff" strokeWidth="1.5" className="fw-ring" style={{ animationDelay: "0.25s" }} />
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <circle key={i} r="3.5" fill="#c10fff"
                cx={Math.round(Math.cos(deg * Math.PI / 180) * 52)}
                cy={Math.round(Math.sin(deg * Math.PI / 180) * 52)}
                className="fw-spark" style={{ animationDelay: `${0.1 * i}s` }} />
            ))}
          </g>

          {/* Burst 2 — top-center, gold */}
          <g transform="translate(400, 32)">
            <circle r="48" fill="none" stroke="#ffcd57" strokeWidth="2.5" className="fw-ring" style={{ animationDelay: "1.3s" }} />
            <circle r="28" fill="none" stroke="#ffcd57" strokeWidth="1.5" className="fw-ring" style={{ animationDelay: "1.55s" }} />
            {[22,67,112,157,202,247,292,337].map((deg, i) => (
              <circle key={i} r="3" fill="#ffcd57"
                cx={Math.round(Math.cos(deg * Math.PI / 180) * 46)}
                cy={Math.round(Math.sin(deg * Math.PI / 180) * 46)}
                className="fw-spark" style={{ animationDelay: `${1.3 + 0.1 * i}s` }} />
            ))}
          </g>

          {/* Burst 3 — right, cyan-white */}
          <g transform="translate(680, 85)">
            <circle r="52" fill="none" stroke="#a8edff" strokeWidth="2.5" className="fw-ring" style={{ animationDelay: "2.6s" }} />
            <circle r="32" fill="none" stroke="#a8edff" strokeWidth="1.5" className="fw-ring" style={{ animationDelay: "2.85s" }} />
            {[15,60,105,150,195,240,285,330].map((deg, i) => (
              <circle key={i} r="3" fill="#a8edff"
                cx={Math.round(Math.cos(deg * Math.PI / 180) * 50)}
                cy={Math.round(Math.sin(deg * Math.PI / 180) * 50)}
                className="fw-spark" style={{ animationDelay: `${2.6 + 0.1 * i}s` }} />
            ))}
          </g>

          {/* Burst 4 — upper-left, gold small */}
          <g transform="translate(255, 48)">
            <circle r="38" fill="none" stroke="#ffcd57" strokeWidth="2" className="fw-ring" style={{ animationDelay: "3.9s" }} />
            {[30,90,150,210,270,330].map((deg, i) => (
              <circle key={i} r="2.5" fill="#ffcd57"
                cx={Math.round(Math.cos(deg * Math.PI / 180) * 36)}
                cy={Math.round(Math.sin(deg * Math.PI / 180) * 36)}
                className="fw-spark" style={{ animationDelay: `${3.9 + 0.12 * i}s` }} />
            ))}
          </g>

          {/* Burst 5 — upper-right, purple small */}
          <g transform="translate(560, 42)">
            <circle r="40" fill="none" stroke="#c10fff" strokeWidth="2" className="fw-ring" style={{ animationDelay: "5.2s" }} />
            {[30,90,150,210,270,330].map((deg, i) => (
              <circle key={i} r="2.5" fill="#c10fff"
                cx={Math.round(Math.cos(deg * Math.PI / 180) * 38)}
                cy={Math.round(Math.sin(deg * Math.PI / 180) * 38)}
                className="fw-spark" style={{ animationDelay: `${5.2 + 0.12 * i}s` }} />
            ))}
          </g>
        </svg>

        {/* Three-column layout on large screens: trophy | text | badge */}
        <div className="relative flex items-center justify-center gap-6 lg:gap-10">

          {/* Player Collage — visible lg+ */}
          <div
            className="hidden lg:block relative flex-shrink-0 self-end"
            style={{
              width: "270px",
              height: "235px",
              maskImage: "linear-gradient(to top, transparent 0%, black 18%)",
              WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 18%)",
            }}
          >
            {/* Messi — far left, back */}
            <img
              src="/players/messi.png"
              alt="Lionel Messi"
              className="absolute bottom-0 select-none pointer-events-none"
              style={{ left: "0px", height: "155px", width: "auto", zIndex: 1, filter: "drop-shadow(3px 0 8px rgba(0,0,0,0.6))" }}
            />
            {/* Vinicius Jr — left-center */}
            <img
              src="/players/vinicius.png"
              alt="Vinícius Júnior"
              className="absolute bottom-0 select-none pointer-events-none"
              style={{ left: "35px", height: "178px", width: "auto", zIndex: 3, filter: "drop-shadow(2px 0 8px rgba(255,205,87,0.2)) drop-shadow(0 4px 8px rgba(0,0,0,0.7))" }}
            />
            {/* Mbappé — centre, tallest */}
            <img
              src="/players/mbappe.png"
              alt="Kylian Mbappé"
              className="absolute bottom-0 select-none pointer-events-none"
              style={{ left: "83px", height: "215px", width: "auto", zIndex: 4, filter: "drop-shadow(0 0 14px rgba(193,15,255,0.25)) drop-shadow(0 4px 10px rgba(0,0,0,0.8))" }}
            />
            {/* Yamal — right */}
            <img
              src="/players/yamal.png"
              alt="Lamine Yamal"
              className="absolute bottom-0 select-none pointer-events-none"
              style={{ right: "0px", height: "155px", width: "auto", zIndex: 2, filter: "drop-shadow(-3px 0 8px rgba(0,0,0,0.6))" }}
            />
          </div>

          {/* Centre text */}
          <div className="flex-1 min-w-0 max-w-lg">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 max-w-[90vw]"
              style={{ background: "rgba(193,15,255,0.15)", color: "#c10fff", border: "1px solid rgba(193,15,255,0.3)" }}
            >
              🌎 USA · Mexico · Canada — Jun 11 to Jul 19, 2026
            </div>

            {/* World Cup started announcement */}
            <div
              className="wc-started text-xs sm:text-sm font-bold tracking-widest uppercase mb-1"
              style={{ color: "#ffcd57" }}
            >
              🎆 The Tournament is officially underway! 🎆
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              <span className="cm-text-gradient">CloudMarc</span>
              <br />
              <span className="text-white">World Cup 2026</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto mt-4 px-4">
              Predict scores, pick your champion, and battle your teammates on the leaderboard.
            </p>
            {!session ? (
              <div className="pt-4">
                <Link href="/signin">
                  <Button
                    size="lg"
                    className="text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
                    style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
                  >
                    Join the Competition →
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-slate-400 text-sm mt-4">
                Welcome back, {displayName} 👋
              </p>
            )}
          </div>

          {/* FIFA WC 2026 Logo — visible md+ */}
          <div className="hidden md:flex flex-col items-center flex-shrink-0 self-center">
            <Image
              src="/fifa-wc-2026-logo.png"
              alt="FIFA World Cup 2026"
              width={160}
              height={160}
              className="w-28 lg:w-44 select-none"
              style={{ mixBlendMode: "screen" }}
              priority
            />
          </div>

        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Participants", value: totalParticipants, icon: "👥" },
          { label: "Tips Submitted", value: totalTips, icon: "📋" },
          { label: timeInfo.label, value: timeInfo.value, icon: "⏱️" },
        ].map((stat) => (
          <Card key={stat.label} className="border cm-glow" style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
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

      {/* ── Top 5 leaderboard preview ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Tippers</CardTitle>
        </CardHeader>
        <CardContent>
          {top5.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tips submitted yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {top5.map((player, i) => {
                const isLeader = i === 0;
                const medal = ["🥇", "🥈", "🥉"][i] ?? null;
                return (
                  <div
                    key={player.id}
                    className={"flex items-center justify-between py-2 px-3 rounded-md " + (isLeader ? "border" : "border-b border-border last:border-0")}
                    style={isLeader ? { background: "linear-gradient(90deg, rgba(193,15,255,0.18), rgba(255,205,87,0.06) 70%, transparent)", borderColor: "rgba(255,205,87,0.4)" } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className={medal ? "text-lg w-7 text-center" : "text-muted-foreground font-mono text-sm w-7 text-center"}>
                        {medal ?? i + 1}
                      </span>
                      <span className={isLeader ? "font-semibold" : "font-medium"}>{player.name}</span>
                    </div>
                    <span className="font-extrabold tabular-nums" style={{ color: isLeader ? "#ffcd57" : undefined, fontSize: isLeader ? "1.25rem" : "0.95rem" }}>
                      {player.total}
                      <span className="text-xs font-medium text-slate-500 ml-1">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4">
            <Link href="/leaderboard">
              <Button variant="outline" size="sm">View Full Leaderboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── Groups & Fixtures ─────────────────────────────────────────────── */}
      {/* ── Banter Board ─────────────────────────────────────────────────── */}
      <BanterBoard
        initialComments={recentComments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        }))}
        currentUserId={session?.user?.id ?? null}
        currentUserName={session?.user?.name ?? null}
        isAdmin={(session?.user as { role?: string })?.role === "admin"}
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">🌐 Groups & Fixtures</h2>
            <p className="text-sm text-slate-400 mt-1">48 teams · 12 groups · 72 group-stage matches</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255,205,87,0.4)" }} />
              Top 2 advance directly · best 8 third-placed teams complete the R32
            </p>
          </div>
          <Link href="/schedule">
            <Button variant="outline" size="sm">View full schedule →</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {groupLetters.map((g) => {
            const venues = venuesByGroup[g];
            const serialisedMatches = (matchesByGroup[g] ?? []).map((m) => ({
              id: m.id,
              matchNumber: m.matchNumber,
              date: m.date.toISOString(),
              homeTeam: m.homeTeam ? { name: m.homeTeam.name, code: m.homeTeam.code, flagEmoji: m.homeTeam.flagEmoji } : null,
              awayTeam: m.awayTeam ? { name: m.awayTeam.name, code: m.awayTeam.code, flagEmoji: m.awayTeam.flagEmoji } : null,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              liveHomeScore: m.liveHomeScore,
              liveAwayScore: m.liveAwayScore,
              liveStatus: m.liveStatus,
            }));
            return (
              <GroupCard
                key={g}
                group={g}
                standings={standingsByGroup[g] ?? []}
                matches={serialisedMatches}
                venues={venues ?? { countries: [], cityCount: 0 }}
              />
            );
          })}
        </div>
      </section>

      {/* ── Quick links (signed-in only) ──────────────────────────────────── */}
      {session && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/tips", icon: "📋", title: "Match Tips", desc: "Predict scores for all 72 group-stage matches. 5 pts for exact score!" },
            { href: "/predict", icon: "🔮", title: "Tournament Predictions", desc: "Pick champion, finalists & top 3 scorers before June 11." },
            { href: "/leaderboard", icon: "🏆", title: "Leaderboard", desc: "See where you stand against your CloudMarc colleagues." },
          ].map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full cursor-pointer cm-card-hover" style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
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
