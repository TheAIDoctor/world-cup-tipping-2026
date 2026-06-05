import { prisma } from "./prisma";
import { calcTournamentPoints, calcTopScorerPoints } from "./points";
import { TOURNAMENT_RESULT_ID } from "./constants";

export type PlayerScore = {
  id: string;
  name: string;
  email: string;
  isBot: boolean;
  matchPts: number;
  tournamentPts: number;
  topScorerPts: number;
  total: number;
};

/**
 * Fetches all users and computes their full point totals (match tips +
 * tournament predictions + top scorer picks) in two parallel DB queries.
 * Returns players sorted by total descending, then name ascending.
 *
 * Used by: leaderboard page, home page preview, my-tips rank calculation.
 */
export async function getLeaderboard(): Promise<PlayerScore[]> {
  const [users, result] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isBot: true,
        matchTips: { select: { points: true } },
        tournamentPrediction: {
          select: { champion: true, runnerUp: true, third: true, fourth: true },
        },
        topScorerPrediction: {
          select: { scorer1: true, scorer2: true, scorer3: true },
        },
      },
    }),
    prisma.tournamentResult.findUnique({ where: { id: TOURNAMENT_RESULT_ID } }),
  ]);

  return users
    .map((u) => {
      const matchPts = u.matchTips.reduce((sum, t) => sum + (t.points ?? 0), 0);
      const tournamentPts =
        u.tournamentPrediction && result
          ? calcTournamentPoints(u.tournamentPrediction, result)
          : 0;
      const topScorerPts =
        u.topScorerPrediction && result
          ? calcTopScorerPoints(u.topScorerPrediction, result)
          : 0;
      return {
        id: u.id,
        name: u.name || u.email || "Unknown",
        email: u.email || "",
        isBot: u.isBot,
        matchPts,
        tournamentPts,
        topScorerPts,
        total: matchPts + tournamentPts + topScorerPts,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
