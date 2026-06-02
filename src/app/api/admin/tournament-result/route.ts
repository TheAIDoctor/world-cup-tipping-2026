import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT_RESULT_ID as SINGLETON_ID } from "@/lib/constants";

export async function GET() {
  const result = await prisma.tournamentResult.findUnique({ where: { id: SINGLETON_ID } });
  return NextResponse.json(result ?? {});
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { champion, runnerUp, third, fourth, topScorer1, topScorer2, topScorer3 } = body;

  const data = {
    champion: champion || null,
    runnerUp: runnerUp || null,
    third: third || null,
    fourth: fourth || null,
    topScorer1: topScorer1 || null,
    topScorer2: topScorer2 || null,
    topScorer3: topScorer3 || null,
  };

  await prisma.tournamentResult.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
