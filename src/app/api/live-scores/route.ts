import { prisma } from "@/lib/prisma";
import { calcMatchPoints } from "@/lib/points";
import { fetchMatchScore, fetchTopScorers, fetchTournamentStandings } from "@/lib/live-scores";
import { revalidatePath } from "next/cache";
import { TOURNAMENT_RESULT_ID } from "@/lib/constants";
import { NextResponse } from "next/server";

// In-memory rate limits (per match / global). Fluid Compute reuses instances
// so these hold within a deployment; benign duplicates across cold starts.
const lastMatchFetch  = new Map<string, number>();
const MATCH_INTERVAL  = 5  * 60 * 1000; // 5 min per match
const SCORER_INTERVAL = 15 * 60 * 1000; // 15 min for golden boot
const FINAL_INTERVAL  = 30 * 60 * 1000; // 30 min for tournament standings
let lastScorerFetch   = 0;
let lastFinalFetch    = 0;

function determineWinner(m: {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
}): string | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.awayScore > m.homeScore) return m.awayTeamId;
  if (m.penaltyHomeScore === null || m.penaltyAwayScore === null) return null;
  if (m.penaltyHomeScore > m.penaltyAwayScore) return m.homeTeamId;
  if (m.penaltyAwayScore > m.penaltyHomeScore) return m.awayTeamId;
  return null;
}

export async function POST() {
  const now    = new Date();
  const nowMs  = now.getTime();
  let anyUpdate = false;

  // ── 1. Live match scores ────────────────────────────────────────────────
  // Primary window: currently live (±115 min of kickoff)
  const from = new Date(nowMs - 115 * 60 * 1000);
  const to   = new Date(nowMs +   5 * 60 * 1000);

  // Catch-up window: any match in the last 48 h that still has no score
  // (covers matches that finished before the live-scores endpoint existed,
  // or when no browser tab was open during the match).
  const catchUpFrom = new Date(nowMs - 48 * 60 * 60 * 1000);

  const [liveMatches, catchUpMatches] = await Promise.all([
    prisma.match.findMany({
      where: {
        date: { gte: from, lte: to },
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    }),
    prisma.match.findMany({
      where: {
        date: { gte: catchUpFrom, lt: from }, // before the live window
        homeTeamId: { not: null },
        awayTeamId: { not: null },
        homeScore: null, // no result stored yet
      },
      include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    }),
  ]);

  // Merge, de-duplicate by id
  const seen = new Set<string>();
  const allMatches = [...liveMatches, ...catchUpMatches].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  for (const match of allMatches) {
    if (!match.homeTeam?.name || !match.awayTeam?.name) continue;

    const last = lastMatchFetch.get(match.id) ?? 0;
    if (nowMs - last < MATCH_INTERVAL) continue;
    lastMatchFetch.set(match.id, nowMs);

    const score = await fetchMatchScore(match.homeTeam.name, match.awayTeam.name);
    if (!score || score.status === "not_started") continue;

    const scoreChanged =
      match.homeScore !== score.homeScore || match.awayScore !== score.awayScore;

    if (scoreChanged) {
      const updated = await prisma.match.update({
        where: { id: match.id },
        data: { homeScore: score.homeScore, awayScore: score.awayScore },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      // Recalculate tip points
      const tips = await prisma.matchTip.findMany({ where: { matchId: match.id } });
      for (const tip of tips) {
        const points = calcMatchPoints(
          tip.homeScore, tip.awayScore,
          score.homeScore, score.awayScore
        );
        await prisma.matchTip.update({ where: { id: tip.id }, data: { points } });
      }

      // Auto-advance bracket when the match is finished (knockout only)
      if (score.status === "finished" && updated.stage !== "group") {
        const winnerTeamId = determineWinner(updated);
        const loserTeamId =
          winnerTeamId === updated.homeTeamId ? updated.awayTeamId :
          winnerTeamId === updated.awayTeamId ? updated.homeTeamId : null;

        if (winnerTeamId && updated.nextMatchId && updated.nextMatchSlot) {
          await prisma.match.update({
            where: { id: updated.nextMatchId },
            data: updated.nextMatchSlot === "home"
              ? { homeTeamId: winnerTeamId }
              : { awayTeamId: winnerTeamId },
          });
        }
        if (loserTeamId && updated.loserMatchId && updated.loserMatchSlot) {
          await prisma.match.update({
            where: { id: updated.loserMatchId },
            data: updated.loserMatchSlot === "home"
              ? { homeTeamId: loserTeamId }
              : { awayTeamId: loserTeamId },
          });
        }
      }

      anyUpdate = true;
    }
  }

  // ── 2. Golden boot standings (every 15 min during tournament) ──────────
  if (allMatches.length > 0 && nowMs - lastScorerFetch >= SCORER_INTERVAL) {
    lastScorerFetch = nowMs;
    const scorers = await fetchTopScorers();
    if (scorers.length > 0) {
      for (const s of scorers) {
        await prisma.topScorer.upsert({
          where: { name: s.name },
          create: { name: s.name, team: s.team, flagEmoji: s.flagEmoji, goals: s.goals },
          update: { team: s.team, flagEmoji: s.flagEmoji, goals: s.goals },
        });
      }
      anyUpdate = true;
    }
  }

  // ── 3. Tournament final standings (once the competition ends) ──────────
  if (nowMs - lastFinalFetch >= FINAL_INTERVAL) {
    lastFinalFetch = nowMs;
    const standings = await fetchTournamentStandings();
    if (standings) {
      await prisma.tournamentResult.upsert({
        where: { id: TOURNAMENT_RESULT_ID },
        create: { id: TOURNAMENT_RESULT_ID, ...standings },
        update: standings,
      });
      anyUpdate = true;
    }
  }

  if (anyUpdate) {
    revalidatePath("/");
    revalidatePath("/schedule");
    revalidatePath("/leaderboard");
    revalidatePath("/bracket");
  }

  return NextResponse.json({ ok: true, checked: allMatches.length });
}
