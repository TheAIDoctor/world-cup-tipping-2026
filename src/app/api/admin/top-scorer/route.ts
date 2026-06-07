import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Upsert a scorer (create or update goals/team)
export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, team, flagEmoji, goals } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const goalsNum = Math.max(0, parseInt(goals ?? "0") || 0);

  if (id) {
    // Update existing
    const scorer = await prisma.topScorer.update({
      where: { id },
      data: { name: name.trim(), team: team ?? "", flagEmoji: flagEmoji ?? "", goals: goalsNum },
    });
    return NextResponse.json(scorer);
  } else {
    // Create new
    const scorer = await prisma.topScorer.upsert({
      where: { name: name.trim() },
      create: { name: name.trim(), team: team ?? "", flagEmoji: flagEmoji ?? "", goals: goalsNum },
      update: { team: team ?? "", flagEmoji: flagEmoji ?? "", goals: goalsNum },
    });
    return NextResponse.json(scorer);
  }
}

// Delete a scorer by id
export async function DELETE(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.topScorer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
