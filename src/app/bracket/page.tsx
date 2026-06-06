import { prisma } from "@/lib/prisma";
import { BracketView } from "@/components/bracket-client";

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

export default async function BracketPage() {
  const matchesRaw = await loadMatches();
  const matches = matchesRaw.map((m) => ({
    id: m.id,
    matchNumber: m.matchNumber,
    stage: m.stage,
    date: m.date.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    penaltyHomeScore: m.penaltyHomeScore,
    penaltyAwayScore: m.penaltyAwayScore,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    venue: m.venue,
    city: m.city,
    country: m.country,
    homeTeam: m.homeTeam ? { name: m.homeTeam.name, code: m.homeTeam.code, flagEmoji: m.homeTeam.flagEmoji } : null,
    awayTeam: m.awayTeam ? { name: m.awayTeam.name, code: m.awayTeam.code, flagEmoji: m.awayTeam.flagEmoji } : null,
  }));

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

      <BracketView matches={matches} />
    </div>
  );
}
