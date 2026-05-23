import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hostCountryFlag } from "@/lib/format";
import { GroupCard } from "@/components/group-card";

type TeamRow = {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  group: string;
};
type MatchRow = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
};
type Standing = {
  team: TeamRow;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

function computeGroupStandings(
  teams: TeamRow[],
  matches: MatchRow[]
): Standing[] {
  const stats = new Map<string, Omit<Standing, "goalDiff" | "points">>(
    teams.map((t) => [
      t.id,
      {
        team: t,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    ])
  );
  for (const m of matches) {
    if (
      m.homeScore === null ||
      m.awayScore === null ||
      !m.homeTeamId ||
      !m.awayTeamId
    ) {
      continue;
    }
    const home = stats.get(m.homeTeamId);
    const away = stats.get(m.awayTeamId);
    if (!home || !away) continue;
    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) {
      home.won++;
      away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }
  return Array.from(stats.values())
    .map((s) => ({
      ...s,
      goalDiff: s.goalsFor - s.goalsAgainst,
      points: s.won * 3 + s.drawn,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name)
    );
}

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

  // Standings per group computed from any matches with a recorded 90' result.
  // Tiebreak chain: points → goal difference → goals for → name (alphabetical).
  // We omit head-to-head — uncommon to need it pre-final-matchday and adds
  // notable complexity. Knockout penalties are intentionally ignored: this
  // table reflects the group-stage 90' record only.
  const standingsByGroup: Record<string, Standing[]> = {};
  for (const g of groupLetters) {
    standingsByGroup[g] = computeGroupStandings(
      teamsByGroup[g] ?? [],
      matchesByGroup[g] ?? []
    );
  }

  // Venue footprint per group — which host countries and how many cities
  // the group's six matches are spread across. Surfaces "this whole group
  // plays in Mexico" vs "this group bounces across 4 US cities".
  const venuesByGroup: Record<
    string,
    { countries: string[]; cityCount: number }
  > = {};
  for (const g of groupLetters) {
    const countries = new Set<string>();
    const cities = new Set<string>();
    for (const m of matchesByGroup[g] ?? []) {
      if (m.country) countries.add(m.country);
      if (m.city) cities.add(m.city);
    }
    venuesByGroup[g] = {
      countries: Array.from(countries).sort(),
      cityCount: cities.size,
    };
  }

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
      <div className="relative text-center space-y-4 py-6 sm:py-12 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 max-w-[90vw]"
            style={{ background: "rgba(193,15,255,0.15)", color: "#c10fff", border: "1px solid rgba(193,15,255,0.3)" }}>
            🌎 USA · Mexico · Canada — Jun 11 to Jul 19, 2026
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
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: "rgba(255,205,87,0.4)" }}
              />
              Top 2 advance directly · best 8 third-placed teams complete the R32
            </p>
          </div>
          <Link href="/schedule">
            <Button variant="outline" size="sm">
              View full schedule →
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {groupLetters.map((g) => {
            const standings = standingsByGroup[g] ?? [];
            const venues = venuesByGroup[g];
            // Serialise Date → ISO string so the client component can cross
            // the RSC boundary without a "non-serialisable value" error.
            const serialisedMatches = (matchesByGroup[g] ?? []).map((m) => ({
              id: m.id,
              matchNumber: m.matchNumber,
              date: m.date.toISOString(),
              homeTeam: m.homeTeam
                ? { name: m.homeTeam.name, code: m.homeTeam.code, flagEmoji: m.homeTeam.flagEmoji }
                : null,
              awayTeam: m.awayTeam
                ? { name: m.awayTeam.name, code: m.awayTeam.code, flagEmoji: m.awayTeam.flagEmoji }
                : null,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
            }));
            return (
              <GroupCard
                key={g}
                group={g}
                standings={standings}
                matches={serialisedMatches}
                venues={venues ?? { countries: [], cityCount: 0 }}
              />
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
                style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
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
