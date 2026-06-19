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
  // Accuracy over matches that have a final result:
  played: number; // finished matches this player entered a tip for
  exact: number; // tips that nailed the exact score (5 pts)
  correct: number; // tips that got the result right but not the score (3 pts)
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
      let matchPts = 0;
      let played = 0;
      let exact = 0;
      let correct = 0;
      for (const tip of u.matchTips) {
        const res = resultMap.get(tip.matchId);
        if (!res) continue; // match not finished yet
        played++;
        const pts = calcMatchPoints(tip.homeScore, tip.awayScore, res.home, res.away);
        matchPts += pts;
        if (pts === 5) exact++;
        else if (pts === 3) correct++;
      }

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
        played,
        exact,
        correct,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export type TimelineStep = {
  matchNumber: number;
  label: string; // e.g. "MEX 2–0 RSA"
};

export type TimelinePlayer = {
  id: string;
  name: string;
  isBot: boolean;
  points: number[]; // cumulative match pts after each step (incl. step 0 = start)
  ranks: number[]; // 1-based rank after each step (ties share the best rank)
  finalRank: number;
  finalPoints: number;
};

export type LeaderboardTimeline = {
  steps: TimelineStep[]; // [Start, match1, match2, ...]
  players: TimelinePlayer[]; // sorted by current standing
};

/**
 * Match-by-match "race" data: for every finished match in chronological order,
 * each player's cumulative MATCH points and resulting rank. Tournament and
 * top-scorer bonuses are excluded — they resolve at the tournament's end, not
 * per match, so the timeline reflects the match-tipping race specifically.
 * A leading "Start" step (everyone on 0) anchors the left edge.
 */
export async function getLeaderboardTimeline(): Promise<LeaderboardTimeline> {
  const [users, matches] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isBot: true,
        matchTips: { select: { matchId: true, homeScore: true, awayScore: true } },
      },
    }),
    prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      select: {
        id: true,
        matchNumber: true,
        homeScore: true,
        awayScore: true,
        date: true,
        homeTeam: { select: { code: true } },
        awayTeam: { select: { code: true } },
      },
      orderBy: [{ date: "asc" }, { matchNumber: "asc" }],
    }),
  ]);

  const steps: TimelineStep[] = [
    { matchNumber: 0, label: "Start" },
    ...matches.map((m) => ({
      matchNumber: m.matchNumber,
      label: `${m.homeTeam?.code ?? "?"} ${m.homeScore}–${m.awayScore} ${m.awayTeam?.code ?? "?"}`,
    })),
  ];

  // Cumulative points per player across steps (index 0 = Start = 0 pts).
  const base = users.map((u) => {
    const tipByMatch = new Map(u.matchTips.map((t) => [t.matchId, t]));
    let cum = 0;
    const points: number[] = [0];
    for (const m of matches) {
      const tip = tipByMatch.get(m.id);
      if (tip) {
        cum += calcMatchPoints(tip.homeScore, tip.awayScore, m.homeScore as number, m.awayScore as number);
      }
      points.push(cum);
    }
    return { id: u.id, name: u.name || u.email || "Unknown", isBot: u.isBot, points };
  });

  // Standard competition ranking (1,1,3,…) at each step.
  const stepCount = steps.length;
  const ranks = base.map(() => [] as number[]);
  for (let s = 0; s < stepCount; s++) {
    const order = base
      .map((p, i) => ({ i, pts: p.points[s] }))
      .sort((a, b) => b.pts - a.pts);
    let rank = 0;
    let prev = Infinity;
    order.forEach((o, position) => {
      if (o.pts < prev) {
        rank = position + 1;
        prev = o.pts;
      }
      ranks[o.i].push(rank);
    });
  }

  const players: TimelinePlayer[] = base
    .map((p, i) => ({
      ...p,
      ranks: ranks[i],
      finalPoints: p.points[stepCount - 1] ?? 0,
      finalRank: ranks[i][stepCount - 1] ?? 1,
    }))
    .sort(
      (a, b) =>
        a.finalRank - b.finalRank ||
        b.finalPoints - a.finalPoints ||
        a.name.localeCompare(b.name)
    );

  return { steps, players };
}
