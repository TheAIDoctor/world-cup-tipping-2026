import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEADLINE = new Date("2026-06-11T00:00:00Z");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (new Date() > DEADLINE)
    return NextResponse.json({ error: "Deadline passed" }, { status: 400 });

  const { tournament, topScorers } = await req.json();

  if (tournament) {
    await prisma.tournamentPrediction.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...tournament },
      update: tournament,
    });
  }
  if (topScorers) {
    await prisma.topScorerPrediction.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...topScorers },
      update: topScorers,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tournament, topScorers] = await Promise.all([
    prisma.tournamentPrediction.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.topScorerPrediction.findUnique({
      where: { userId: session.user.id },
    }),
  ]);
  return NextResponse.json({ tournament, topScorers });
}
