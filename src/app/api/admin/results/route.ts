import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcMatchPoints } from "@/lib/points";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matchId, homeScore, awayScore } = await req.json();

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
  });

  // Recalculate points for all tips on this match
  const tips = await prisma.matchTip.findMany({ where: { matchId } });
  for (const tip of tips) {
    const points = calcMatchPoints(
      tip.homeScore,
      tip.awayScore,
      homeScore,
      awayScore
    );
    await prisma.matchTip.update({ where: { id: tip.id }, data: { points } });
  }

  return NextResponse.json({ ok: true });
}
