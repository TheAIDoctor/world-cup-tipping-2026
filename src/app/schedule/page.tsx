import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  formatKickoffTime,
  formatKickoffLongDate,
  kickoffDateKey,
  hostCountryFlag,
  KICKOFF_TIME_ZONE_LABEL,
} from "@/lib/format";

const STAGE_LABEL: Record<string, string> = {
  group: "Group",
  R32: "R32",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3P": "3rd",
  F: "Final",
};

const STAGE_COLOR: Record<string, string> = {
  group: "rgba(193,15,255,0.3)",
  R32: "rgba(96,165,250,0.45)",
  R16: "rgba(96,165,250,0.5)",
  QF: "rgba(167,139,250,0.55)",
  SF: "rgba(244,114,182,0.55)",
  "3P": "rgba(148,163,184,0.45)",
  F: "rgba(255,205,87,0.55)",
};

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

  return (
    <div className="space-y-6">
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
                    <ScheduleRow match={m} />
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

type Match = Awaited<ReturnType<typeof prisma.match.findMany>>[number] & {
  homeTeam: { name: string; code: string; flagEmoji: string; group: string } | null;
  awayTeam: { name: string; code: string; flagEmoji: string; group: string } | null;
};

function ScheduleRow({ match }: { match: Match }) {
  const played = match.homeScore !== null && match.awayScore !== null;
  const homeWon = played && match.homeScore! > match.awayScore!;
  const awayWon = played && match.awayScore! > match.homeScore!;
  const time = formatKickoffTime(match.date);
  const stageLabel =
    match.stage === "group" && match.homeTeam?.group
      ? `Group ${match.homeTeam.group}`
      : STAGE_LABEL[match.stage] ?? match.stage;
  const stageColor = STAGE_COLOR[match.stage] ?? "rgba(193,15,255,0.3)";
  const stageBorder = stageColor;
  const stageText = stageColor.replace(/[\d.]+\)$/, "0.95)");

  const teamClass = (won: boolean) =>
    "text-sm sm:text-[15px] font-semibold truncate " +
    (won
      ? "text-white"
      : played
      ? "text-slate-400"
      : "text-slate-200");

  return (
    <Link
      href={`/tips#match-${match.matchNumber}`}
      className="block rounded-lg border transition-colors hover:bg-purple-900/30"
      style={{
        background: "var(--cm-card-deep)",
        borderColor: "var(--cm-border)",
      }}
    >
      {/* ─── Desktop / tablet (sm+): one wide row, ESPN-style ──────────── */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-2.5">
        {/* Time + stage */}
        <div className="w-20 shrink-0 flex flex-col items-start gap-0.5">
          <span className="text-lg font-bold tabular-nums leading-none text-white">
            {time}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold px-1.5 py-0 leading-tight"
            style={{ borderColor: stageBorder, color: stageText }}
          >
            {stageLabel}
          </Badge>
        </div>

        {/* Home: name → flag, right-aligned with flag near the score */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className={teamClass(homeWon) + " text-right"}>
            {match.homeTeam?.name ?? "TBD"}
          </span>
          <span className="text-lg leading-none shrink-0">
            {match.homeTeam?.flagEmoji ?? "❓"}
          </span>
        </div>

        {/* Score / "v" */}
        <div className="shrink-0 w-16 text-center">
          {played ? (
            <span
              className="font-extrabold text-base tabular-nums whitespace-nowrap"
              style={{
                color: "#ffcd57",
                textShadow: "0 0 10px rgba(255,205,87,0.3)",
              }}
            >
              {match.homeScore}<span className="px-0.5 text-slate-500">–</span>{match.awayScore}
            </span>
          ) : (
            <span className="text-slate-500 italic text-sm">v</span>
          )}
        </div>

        {/* Away: flag → name, left-aligned with flag near the score */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none shrink-0">
            {match.awayTeam?.flagEmoji ?? "❓"}
          </span>
          <span className={teamClass(awayWon) + " text-left"}>
            {match.awayTeam?.name ?? "TBD"}
          </span>
        </div>

        {/* Venue (fixed-width right column keeps the score grid stable) */}
        <div className="w-52 shrink-0 text-right text-slate-400">
          {match.venue && (
            <p className="text-[12px] truncate" style={{ color: "rgb(203 213 225 / 0.85)" }}>
              {match.venue}
            </p>
          )}
          {match.city && (
            <p className="text-[11px] text-slate-500 truncate">
              {match.city}
              {match.country && (
                <>
                  , {match.country}{" "}
                  <span>{hostCountryFlag(match.country)}</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ─── Mobile: two compact rows ──────────────────────────────────── */}
      <div className="sm:hidden px-3 py-3 space-y-2">
        {/* Header strip: time + stage on left, venue summary on right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold tabular-nums leading-none text-white shrink-0">
              {time}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ border: `1px solid ${stageBorder}`, color: stageText }}
            >
              {stageLabel}
            </span>
          </div>
          {match.city && (
            <span className="text-xs text-slate-400 truncate text-right">
              {match.city}
              {match.country && <> {hostCountryFlag(match.country)}</>}
            </span>
          )}
        </div>

        {/* Teams row: name + flag | score | flag + name */}
        <div className="flex items-center gap-2">
          <span className={teamClass(homeWon) + " flex-1 text-right"}>
            {match.homeTeam?.name ?? "TBD"}
          </span>
          <span className="text-base leading-none shrink-0">
            {match.homeTeam?.flagEmoji ?? "❓"}
          </span>
          <span className="shrink-0 w-12 text-center">
            {played ? (
              <span
                className="font-extrabold text-sm tabular-nums whitespace-nowrap"
                style={{
                  color: "#ffcd57",
                  textShadow: "0 0 10px rgba(255,205,87,0.3)",
                }}
              >
                {match.homeScore}<span className="px-0.5 text-slate-500">–</span>{match.awayScore}
              </span>
            ) : (
              <span className="text-slate-500 italic text-xs">v</span>
            )}
          </span>
          <span className="text-base leading-none shrink-0">
            {match.awayTeam?.flagEmoji ?? "❓"}
          </span>
          <span className={teamClass(awayWon) + " flex-1 text-left"}>
            {match.awayTeam?.name ?? "TBD"}
          </span>
        </div>
      </div>
    </Link>
  );
}
