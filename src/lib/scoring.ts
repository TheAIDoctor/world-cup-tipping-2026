import { prisma } from "./prisma";
import { calcMatchPoints, calcTournamentPoints, calcTopScorerPoints } from "./points";
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
 * Fetches all users and computes their full point totals in three parallel
 * DB queries. Match points are computed on the fly from actual match scores
 * crossed with each user's tips — the stored MatchTip.points field is not
 * used so the leaderboard is always live regardless of when/how results land.
 */
export async function getLeaderboard(): Promise<PlayerScore[]> {
  const [users, matches, result] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isBot: true,
        matchTips: { select: { matchId: true, homeScore: true, awayScore: true } },
        tournamentPrediction: {
          select: { champion: true, runnerUp: true, third: true, fourth: true },
        },
        topScorerPrediction: {
          select: { scorer1: true, scorer2: true, scorer3: true },
        },
      },
    }),
    // Only fetch matches that have an actual result
    prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      select: { id: true, homeScore: true, awayScore: true },
    }),
    prisma.tournamentResult.findUnique({ where: { id: TOURNAMENT_RESULT_ID } }),
  ]);

  // Build a lookup: matchId → { homeScore, awayScore }
  const resultMap = new Map(
    matches.map((m) => [m.id, { home: m.homeScore as number, away: m.awayScore as number }])
  );

  return users
    .map((u) => {
      const matchPts = u.matchTips.reduce((sum, tip) => {
        const res = resultMap.get(tip.matchId);
        if (!res) return sum;
        return sum + calcMatchPoints(tip.homeScore, tip.awayScore, res.home, res.away);
      }, 0);

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
