/**
 * POST /api/cloudy/respond-to-mention
 * Checks recent banter board comments for @Cloudy mentions and replies once.
 * Called by a periodic cron (every 30 min or so).
 * Rate-limited: Cloudy won't respond more than once per comment thread per hour.
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

  const cloudy = await prisma.user.findUnique({ where: { email: CLOUDY_EMAIL } });
  if (!cloudy) return NextResponse.json({ error: "Cloudy not found" }, { status: 404 });

  // Find comments mentioning @Cloudy in the last hour that Cloudy hasn't replied after
  const oneHourAgo = new Date(Date.now() - 3_600_000);

  const mentions = await prisma.comment.findMany({
    where: {
      content: { contains: "@Cloudy", mode: "insensitive" },
      createdAt: { gte: oneHourAgo },
      userId: { not: cloudy.id },
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
    take: 3, // max 3 replies per run
  });

  // Check if Cloudy already replied after each mention
  const cloudyLastComment = await prisma.comment.findFirst({
    where: { userId: cloudy.id },
    orderBy: { createdAt: "desc" },
  });

  const replied: string[] = [];

  for (const mention of mentions) {
    // Don't reply if Cloudy posted after this mention
    if (cloudyLastComment && cloudyLastComment.createdAt > mention.createdAt) continue;

    const senderName = mention.user.name || "someone";
    const context = `${senderName} just posted on the banter board: "${mention.content}"
They mentioned you (@Cloudy). Reply with a short, witty comeback (max 1-2 sentences). Keep it playful and football-related.`;

    try {
      const reply = await generateBanter(context);
      if (reply) {
        await prisma.comment.create({
          data: { userId: cloudy.id, content: reply },
        });
        replied.push(mention.id);
      }
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ ok: true, repliedTo: replied.length });
}
