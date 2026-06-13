export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatKickoffLongDate, kickoffDateKey, KICKOFF_TIME_ZONE_LABEL } from "@/lib/format";
import { ScheduleMatchRow } from "@/components/schedule-match-row";
import { LiveScoresPoller } from "@/components/live-scores-poller";

export default async function SchedulePage() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ date: "asc" }, { matchNumber: "asc" }],
  });

  // Group by Melbourne-local calendar date. The key is YYYY-MM-DD so the
  // outer Map iteration order matches chronological order (matches were
  // already date-asc from Prisma).
  const byDate = new Map<string, typeof matches>();
  for (const m of matches) {
    const key = kickoffDateKey(m.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  // Find the date key for "today" (Melbourne) so we can anchor a jump link
  // and highlight that section. If the tournament hasn't started, anchor
  // the nearest upcoming date instead.
  const todayKey = kickoffDateKey(new Date());
  const dateKeys = Array.from(byDate.keys());
  const upcomingKey =
    dateKeys.find((k) => k >= todayKey) ?? dateKeys[dateKeys.length - 1];

  const kickoffTimes = matches.map((m) => new Date(m.date).getTime());

  return (
    <div className="space-y-6">
      <LiveScoresPoller kickoffTimes={kickoffTimes} />
      <header className="relative text-center py-6 sm:py-10 overflow-hidden">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="schedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c10fff" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#060097" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#07003a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="200" fill="url(#schedGlow)" />
        </svg>
        <div className="relative">
          <p
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold"
            style={{
              background: "rgba(193,15,255,0.15)",
              color: "#c10fff",
              border: "1px solid rgba(193,15,255,0.3)",
            }}
          >
            📅 Full schedule · All 104 matches
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3">
            <span className="cm-text-gradient">Match Schedule</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto px-4">
            Chronological order · Kickoffs in Melbourne time ({KICKOFF_TIME_ZONE_LABEL})
          </p>
          {upcomingKey && (
            <div className="mt-4 flex justify-center">
              <a
                href={`#date-${upcomingKey}`}
                className="text-xs font-semibold px-3 py-2 rounded-full border transition-colors"
                style={{
                  background: "rgba(255,205,87,0.12)",
                  color: "#ffcd57",
                  borderColor: "rgba(255,205,87,0.35)",
                }}
              >
                {upcomingKey === todayKey
                  ? "Jump to today ↓"
                  : "Jump to next matchday ↓"}
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-6">
        {Array.from(byDate.entries()).map(([dateKey, dayMatches]) => {
          const isToday = dateKey === todayKey;
          const isPast = dateKey < todayKey;
          const sampleDate = dayMatches[0].date;
          return (
            <section key={dateKey} id={`date-${dateKey}`}>
              <div
                className="sticky top-16 z-30 -mx-4 px-4 py-2 backdrop-blur-md border-b mb-2"
                style={{
                  background: "var(--cm-sticky-bg)",
                  borderColor: isToday
                    ? "rgba(255,205,87,0.45)"
                    : "rgba(193,15,255,0.18)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="text-sm sm:text-base font-bold tracking-wide"
                    style={{
                      color: isToday
                        ? "#ffcd57"
                        : isPast
                        ? "rgb(148 163 184)"
                        : "#fff",
                    }}
                  >
                    {isToday && (
                      <span
                        className="mr-2 text-[11px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(255,205,87,0.2)",
                          color: "#ffcd57",
                        }}
                      >
                        Today
                      </span>
                    )}
                    {formatKickoffLongDate(sampleDate)}
                  </h2>
                  <span className="text-xs text-slate-500 tabular-nums shrink-0">
                    {dayMatches.length} match
                    {dayMatches.length === 1 ? "" : "es"}
                  </span>
                </div>
              </div>

              <ul className="space-y-2">
                {dayMatches.map((m) => (
                  <li key={m.id}>
                    <ScheduleMatchRow match={{
                      id: m.id,
                      matchNumber: m.matchNumber,
                      date: m.date.toISOString(),
                      stage: m.stage,
                      homeScore: m.homeScore,
                      awayScore: m.awayScore,
                      liveHomeScore: m.liveHomeScore,
                      liveAwayScore: m.liveAwayScore,
                      liveStatus: m.liveStatus,
                      venue: m.venue,
                      city: m.city,
                      country: m.country,
                      homeTeam: m.homeTeam ? { name: m.homeTeam.name, code: m.homeTeam.code, flagEmoji: m.homeTeam.flagEmoji, group: m.homeTeam.group } : null,
                      awayTeam: m.awayTeam ? { name: m.awayTeam.name, code: m.awayTeam.code, flagEmoji: m.awayTeam.flagEmoji, group: m.awayTeam.group } : null,
                    }} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

