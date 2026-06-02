import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMatchLocked } from "@/lib/tips-lock";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tips } = await req.json() as {
    tips: { matchId: string; homeScore: number; awayScore: number }[];
  };

  if (!Array.isArray(tips) || tips.length === 0) {
    return NextResponse.json({ error: "No tips provided" }, { status: 400 });
  }

  // Fetch all referenced matches in one query to avoid N+1 per tip.
  const matchIds = [...new Set(tips.map((t) => t.matchId))];
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    select: { id: true, date: true, homeTeamId: true, awayTeamId: true },
  });
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const now = new Date();
  const validTips = tips.filter((tip) => {
    const match = matchMap.get(tip.matchId);
    if (!match) return false;
    const teamsAssigned = !!match.homeTeamId && !!match.awayTeamId;
    return !isMatchLocked(match.date, teamsAssigned, now);
  });

  if (validTips.length === 0) {
    return NextResponse.json({ ok: true, skipped: tips.length });
  }

  // Upsert all valid tips in parallel.
  await Promise.all(
    validTips.map((tip) =>
      prisma.matchTip.upsert({
        where: { userId_matchId: { userId: session.user.id, matchId: tip.matchId } },
        create: {
          userId: session.user.id,
          matchId: tip.matchId,
          homeScore: tip.homeScore,
          awayScore: tip.awayScore,
        },
        update: { homeScore: tip.homeScore, awayScore: tip.awayScore },
      })
    )
  );

  return NextResponse.json({ ok: true, saved: validTips.length });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tips = await prisma.matchTip.findMany({
    where: { userId: session.user.id },
    select: { matchId: true, homeScore: true, awayScore: true, points: true },
  });

  return NextResponse.json(tips);
}
