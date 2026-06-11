import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, generateBanter, formatChatHistory } from "@/lib/cloudy-ai";
import {
  getCloudyTimeContext,
  getCloudyGapPolicy,
  isMatchCurrentlyLive,
} from "@/lib/cloudy-schedule";
import { NextResponse } from "next/server";

const DAILY_CAP = 5;          // max Cloudy posts per 24 h (all triggers)
const EVENING_CAP = 2;        // max posts between 17:00–22:00 AEST
const MENTION_AGE_MS = 10 * 60 * 1000; // mention must be ≥10 min old

export async function POST() {
  const now = new Date();

  // ── 1. Time-of-day gate ──────────────────────────────────────────────────
  const timeCtx = getCloudyTimeContext(now);
  if (timeCtx === "sleeping") {
    return NextResponse.json({ ok: true, skipped: "sleeping" });
  }

  const matchLive = await isMatchCurrentlyLive(prisma, now);
  const { minGapMs, shouldSkip } = getCloudyGapPolicy(timeCtx, matchLive);
  if (shouldSkip) {
    return NextResponse.json({ ok: true, skipped: "busy" });
  }

  // ── 2. Find Cloudy's account ─────────────────────────────────────────────
  const cloudy = await prisma.user.findUnique({ where: { email: CLOUDY_EMAIL } });
  if (!cloudy) return NextResponse.json({ ok: false });

  // ── 3. Daily cap ─────────────────────────────────────────────────────────
  const dailyCount = await prisma.comment.count({
    where: {
      userId: cloudy.id,
      createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  });
  if (dailyCount >= DAILY_CAP) {
    return NextResponse.json({ ok: true, skipped: "daily_cap" });
  }

  // ── 4. Evening cap (5 pm–10 pm AEST, max 2 posts) ───────────────────────
  if (timeCtx === "evening" && !matchLive) {
    // Count posts since 17:00 AEST today. 17:00 AEST = 07:00 UTC.
    const todayUTC = new Date(now);
    todayUTC.setUTCHours(7, 0, 0, 0);
    // If it's before 07:00 UTC the "evening" is actually from yesterday — adjust
    if (now.getUTCHours() < 7) todayUTC.setUTCDate(todayUTC.getUTCDate() - 1);

    const eveningCount = await prisma.comment.count({
      where: {
        userId: cloudy.id,
        createdAt: { gte: todayUTC },
      },
    });
    if (eveningCount >= EVENING_CAP) {
      return NextResponse.json({ ok: true, skipped: "evening_cap" });
    }
  }

  // ── 5. Minimum gap between posts ─────────────────────────────────────────
  const lastPost = await prisma.comment.findFirst({
    where: { userId: cloudy.id },
    orderBy: { createdAt: "desc" },
  });
  if (lastPost && now.getTime() - lastPost.createdAt.getTime() < minGapMs) {
    return NextResponse.json({ ok: true, skipped: "too_soon" });
  }

  // ── 6. Find unresponded @Cloudy mentions ─────────────────────────────────
  const mentions = await prisma.comment.findMany({
    where: {
      content: { contains: "@Cloudy", mode: "insensitive" },
      createdAt: {
        gte: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        lte: new Date(now.getTime() - MENTION_AGE_MS),
      },
      userId: { not: cloudy.id },
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (mentions.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no_mentions" });
  }

  const unresponded = mentions.filter(
    (m) => !lastPost || lastPost.createdAt < m.createdAt
  );
  if (unresponded.length === 0) {
    return NextResponse.json({ ok: true, skipped: "already_replied" });
  }

  // ── 7. Build context with recent thread history ───────────────────────────
  const mention = unresponded[0];
  const senderName = mention.user.name || "someone";

  const sinceDate = lastPost?.createdAt ?? new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const thread = await prisma.comment.findMany({
    where: { createdAt: { gt: sinceDate }, userId: { not: cloudy.id } },
    orderBy: { createdAt: "asc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });
  const history = formatChatHistory(
    thread.map((c) => ({ authorName: c.user.name ?? "Someone", content: c.content }))
  );

  // ── 8. Generate and post reply ────────────────────────────────────────────
  const matchTone = matchLive
    ? "You're currently watching a live World Cup match and are very excited."
    : "";

  const tasks = [
    "recalculating everyone's chances of winning (spoiler: it's not looking great for humans)",
    "reviewing squad injury reports",
    "judging people's terrible tips",
    "updating my probability models",
    "watching match highlights for research purposes",
    "ignoring the group chat",
    "doing important AI things you wouldn't understand",
  ];
  const task = tasks[
    Math.floor(Math.abs(mention.id.charCodeAt(0) + mention.id.charCodeAt(1)) % tasks.length)
  ];

  const delayNote = matchLive
    ? ""
    : ` You were busy ${task} and only just saw the ping. Acknowledge the delay sarcastically.`;

  const context = `${history}${matchTone}
${senderName} mentioned you on the banter board: "${mention.content}"
Reply with a short witty comeback (max 2 sentences).${delayNote} Keep it playful and football-related.`.trim();

  try {
    const reply = await generateBanter(context);
    if (reply) {
      await prisma.comment.create({ data: { userId: cloudy.id, content: reply } });
    }
    return NextResponse.json({ ok: true, replied: true, matchLive, timeCtx });
  } catch {
    return NextResponse.json({ ok: true, skipped: "error" });
  }
}
