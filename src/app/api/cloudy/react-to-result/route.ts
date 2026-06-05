/**
 * POST /api/cloudy/react-to-result
 * Called after admin enters a match result.
 * Cloudy checks how its tip compared to the actual result and posts banter.
 */

import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, generateBanter } from "@/lib/cloudy-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("x-cron-secret")
    ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await req.json() as { matchId: string };

  const cloudy = await prisma.user.findUnique({ where: { email: CLOUDY_EMAIL } });
  if (!cloudy) return NextResponse.json({ error: "Cloudy not found" }, { status: 404 });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });
  if (!match || match.homeScore === null || match.awayScore === null) {
    return NextResponse.json({ error: "Match result not available" }, { status: 400 });
  }

  const tip = await prisma.matchTip.findUnique({
    where: { userId_matchId: { userId: cloudy.id, matchId } },
  });
  if (!tip) return NextResponse.json({ ok: true, skipped: true });

  const actualHome = match.homeScore;
  const actualAway = match.awayScore;
  const tipHome = tip.homeScore;
  const tipAway = tip.awayScore;

  // Determine outcome
  const exactScore = tipHome === actualHome && tipAway === actualAway;
  const correctResult =
    (tipHome > tipAway && actualHome > actualAway) ||
    (tipHome < tipAway && actualHome < actualAway) ||
    (tipHome === tipAway && actualHome === actualAway);

  const points = exactScore ? 5 : correctResult ? 3 : 0;

  const context = `Match result: ${match.homeTeam?.name} ${actualHome}–${actualAway} ${match.awayTeam?.name}.
Your tip was: ${tipHome}–${tipAway}.
You scored: ${points} points (${exactScore ? "EXACT SCORE 🎯" : correctResult ? "correct result" : "WRONG"}).
Post a very short reaction. If you got it right, boast insufferably. If wrong, make a funny excuse. Max 1-2 sentences.`;

  try {
    const banter = await generateBanter(context);
    if (banter) {
      await prisma.comment.create({
        data: { userId: cloudy.id, content: banter },
      });
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, points, exactScore, correctResult });
}
