import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, generateBanter } from "@/lib/cloudy-ai";
import { NextResponse } from "next/server";

const MIN_MENTION_AGE_MS = 10 * 60 * 1000;  // mention must be 10+ min old (not instant)
const MIN_GAP_MS = 2 * 60 * 60 * 1000;       // at least 2h between Cloudy posts
const DAILY_CAP = 5;                           // max 5 Cloudy posts per 24h (all sources)

export async function POST() {
  const cloudy = await prisma.user.findUnique({ where: { email: CLOUDY_EMAIL } });
  if (!cloudy) return NextResponse.json({ ok: false });

  // Daily cap across all Cloudy activity
  const dailyCount = await prisma.comment.count({
    where: {
      userId: cloudy.id,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (dailyCount >= DAILY_CAP) return NextResponse.json({ ok: true, skipped: "daily_cap" });

  // Minimum gap between posts
  const recentPost = await prisma.comment.findFirst({
    where: {
      userId: cloudy.id,
      createdAt: { gte: new Date(Date.now() - MIN_GAP_MS) },
    },
  });
  if (recentPost) return NextResponse.json({ ok: true, skipped: "too_soon" });

  // Find @Cloudy mentions from last 48h that are at least 20 minutes old
  const mentions = await prisma.comment.findMany({
    where: {
      content: { contains: "@Cloudy", mode: "insensitive" },
      createdAt: {
        gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        lte: new Date(Date.now() - MIN_MENTION_AGE_MS),
      },
      userId: { not: cloudy.id },
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (mentions.length === 0) return NextResponse.json({ ok: true, skipped: "no_mentions" });

  // Filter to mentions that have no Cloudy reply posted after them
  const cloudyLastPost = await prisma.comment.findFirst({
    where: { userId: cloudy.id },
    orderBy: { createdAt: "desc" },
  });

  const unresponded = mentions.filter(
    (m) => !cloudyLastPost || cloudyLastPost.createdAt < m.createdAt
  );

  if (unresponded.length === 0) return NextResponse.json({ ok: true, skipped: "already_replied" });

  // Respond to the oldest unresponded mention
  const mention = unresponded[0];
  const senderName = mention.user.name || "someone";

  const tasks = [
    "recalculating everyone's chances of winning (spoiler: it's not looking great for humans)",
    "reviewing squad injury reports",
    "judging people's terrible tips",
    "updating my probability models",
    "watching match highlights for research purposes",
    "ignoring the group chat",
    "doing important AI things you wouldn't understand",
  ];
  const task = tasks[Math.floor(Math.abs(mention.id.charCodeAt(0) + mention.id.charCodeAt(1)) % tasks.length)];

  const context = `You're Cloudy ☁️, CloudMarc's AI World Cup tipping mascot. You just noticed that ${senderName} mentioned you on the banter board a little while ago. You were busy ${task} and only just saw the ping.
They wrote: "${mention.content}"
React with a short, witty comeback. Acknowledge the delay sarcastically (e.g. "sorry was busy", "oh I see someone called", etc.) and respond to what they actually said. Max 2 sentences. Keep it playful and football-related.`;

  try {
    const reply = await generateBanter(context);
    if (reply) {
      await prisma.comment.create({ data: { userId: cloudy.id, content: reply } });
    }
    return NextResponse.json({ ok: true, replied: true });
  } catch {
    return NextResponse.json({ ok: true, skipped: "error" });
  }
}
