/**
 * Cloudy's human-like schedule rules.
 *
 * All times are in AEST (UTC+10, Melbourne winter).
 *
 * Sleeping  : 22:00 – 08:00  → no posts at all
 * Work      : 08:00 – 17:00  → busy; longer gap + random skip
 * Evening   : 17:00 – 22:00  → relaxed; normal gap, capped at 2 posts
 * Match live: any awake hour → excited; short gap, no evening cap
 */

import type { PrismaClient } from "@prisma/client";

const AEST_OFFSET = 10; // UTC+10 (Melbourne, no daylight saving in Jun–Jul)

export type TimeContext = "sleeping" | "work" | "evening";

export function getAESTHour(now: Date): number {
  return (now.getUTCHours() + AEST_OFFSET) % 24;
}

export function getCloudyTimeContext(now: Date): TimeContext {
  const h = getAESTHour(now);
  if (h < 8 || h >= 22) return "sleeping";
  if (h >= 8 && h < 17) return "work";
  return "evening";
}

/**
 * A match is "live" if any confirmed fixture kicked off in the last 105 min
 * (covers 90' + generous stoppage) or is about to kick off within 30 min.
 */
export async function isMatchCurrentlyLive(
  prisma: PrismaClient,
  now: Date
): Promise<boolean> {
  const from = new Date(now.getTime() - 105 * 60 * 1000);
  const to   = new Date(now.getTime() +  30 * 60 * 1000);
  const match = await prisma.match.findFirst({
    where: {
      date: { gte: from, lte: to },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
  });
  return !!match;
}

/**
 * Returns the min-gap (ms) Cloudy should observe between posts,
 * and whether he should skip this check entirely.
 *
 * During work hours there is also a 50% random skip to simulate Cloudy
 * being busy and not glued to the banter board.
 */
export function getCloudyGapPolicy(
  ctx: TimeContext,
  matchLive: boolean
): { minGapMs: number; shouldSkip: boolean } {
  if (ctx === "sleeping") return { minGapMs: 0, shouldSkip: true };

  if (matchLive) {
    // Watching the game — reply fast, no evening cap applies
    return { minGapMs: 20 * 60 * 1000, shouldSkip: false };
  }

  if (ctx === "work") {
    // Busy — longer gap and only checks the board ~50% of the time
    const randomSkip = Math.random() < 0.5;
    return { minGapMs: 3 * 60 * 60 * 1000, shouldSkip: randomSkip };
  }

  // Evening — normal gap
  return { minGapMs: 2 * 60 * 60 * 1000, shouldSkip: false };
}
