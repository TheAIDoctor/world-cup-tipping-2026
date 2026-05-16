import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tips } = await req.json(); // [{ matchId, homeScore, awayScore }]
  const now = new Date();

  for (const tip of tips) {
    const match = await prisma.match.findUnique({ where: { id: tip.matchId } });
    if (!match || match.date <= now) continue; // skip locked matches

    await prisma.matchTip.upsert({
      where: {
        userId_matchId: { userId: session.user.id, matchId: tip.matchId },
      },
      create: {
        userId: session.user.id,
        matchId: tip.matchId,
        homeScore: tip.homeScore,
        awayScore: tip.awayScore,
      },
      update: { homeScore: tip.homeScore, awayScore: tip.awayScore },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tips = await prisma.matchTip.findMany({
    where: { userId: session.user.id },
  });
  return NextResponse.json(tips);
}
