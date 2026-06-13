import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcMatchPoints } from "@/lib/points";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Unified admin endpoint: assign teams to a knockout match, save scores,
// save penalty shootout scores, recalculate tip points, and (for knockout
// matches) auto-advance the winner/loser per the bracket lineage seeded
// on the Match.
export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    matchId,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    penaltyHomeScore,
    penaltyAwayScore,
  }: {
    matchId: string;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    penaltyHomeScore?: number | null;
    penaltyAwayScore?: number | null;
  } = body;

  // Only patch fields that were explicitly provided.
  const data: {
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    liveHomeScore?: number | null;
    liveAwayScore?: number | null;
    liveStatus?: string | null;
    penaltyHomeScore?: number | null;
    penaltyAwayScore?: number | null;
  } = {};
  if (homeTeamId !== undefined) data.homeTeamId = homeTeamId || null;
  if (awayTeamId !== undefined) data.awayTeamId = awayTeamId || null;
  if (homeScore !== undefined) data.homeScore = homeScore;
  if (awayScore !== undefined) data.awayScore = awayScore;
  // An admin-entered final result supersedes any live in-progress display.
  if (homeScore !== undefined || awayScore !== undefined) {
    data.liveHomeScore = null;
    data.liveAwayScore = null;
    data.liveStatus = null;
  }
  if (penaltyHomeScore !== undefined) data.penaltyHomeScore = penaltyHomeScore;
  if (penaltyAwayScore !== undefined) data.penaltyAwayScore = penaltyAwayScore;

  const updated = await prisma.match.update({
    where: { id: matchId },
    data,
  });

  // If both 90' scores are present, recalculate tip points (5/3/0 on the 90' result).
  if (updated.homeScore !== null && updated.awayScore !== null) {
    const tips = await prisma.matchTip.findMany({ where: { matchId } });
    for (const tip of tips) {
      const points = calcMatchPoints(
        tip.homeScore,
        tip.awayScore,
        updated.homeScore,
        updated.awayScore
      );
      await prisma.matchTip.update({ where: { id: tip.id }, data: { points } });
    }
    // Bust ISR cache so leaderboard reflects the new scores immediately
    revalidatePath("/leaderboard");
    revalidatePath("/");
  }

  // Auto-advance bracket for knockout matches with a definite winner.
  if (
    updated.stage !== "group" &&
    updated.homeScore !== null &&
    updated.awayScore !== null &&
    updated.homeTeamId &&
    updated.awayTeamId
  ) {
    const winnerTeamId = determineWinner(updated);
    const loserTeamId =
      winnerTeamId === updated.homeTeamId
        ? updated.awayTeamId
        : winnerTeamId === updated.awayTeamId
        ? updated.homeTeamId
        : null;

    if (winnerTeamId && updated.nextMatchId && updated.nextMatchSlot) {
      await prisma.match.update({
        where: { id: updated.nextMatchId },
        data:
          updated.nextMatchSlot === "home"
            ? { homeTeamId: winnerTeamId }
            : { awayTeamId: winnerTeamId },
      });
    }
    if (loserTeamId && updated.loserMatchId && updated.loserMatchSlot) {
      await prisma.match.update({
        where: { id: updated.loserMatchId },
        data:
          updated.loserMatchSlot === "home"
            ? { homeTeamId: loserTeamId }
            : { awayTeamId: loserTeamId },
      });
    }
  }

  // Trigger Cloudy's post-match reaction (fire-and-forget, non-blocking)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/cloudy/react-to-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
      },
      body: JSON.stringify({ matchId }),
    }).catch(() => { /* non-critical */ });
  }

  return NextResponse.json({ ok: true });
}

// Decide the winner of a knockout match: 90' first; on draw, fall back to
// penalty shootout. Returns null if scores can't determine a winner yet
// (e.g. 90' draw with no penalty data — admin needs to enter pens).
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
