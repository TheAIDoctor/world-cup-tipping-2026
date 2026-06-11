import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, generateBanter, formatChatHistory } from "@/lib/cloudy-ai";
import {
  getCloudyTimeContext,
  getCloudyGapPolicy,
  getLiveMatches,
} from "@/lib/cloudy-schedule";
import { fetchLiveMatchInfo } from "@/lib/cloudy-live";
import { NextResponse } from "next/server";

const DAILY_CAP   = 5;                  // max Cloudy posts per 24 h (all triggers)
const EVENING_CAP = 2;                  // max posts between 17:00–22:00 AEST (no match)
const MENTION_AGE_MS = 10 * 60 * 1000; // mention must be ≥ 10 min old

export async function POST() {
  const now = new Date();

  // ── 1. Live-match check (overrides sleep schedule) ───────────────────────
  const liveMatches = await getLiveMatches(prisma, now);
  const matchLive   = liveMatches.length > 0;
  const timeCtx     = getCloudyTimeContext(now);

  if (timeCtx === "sleeping" && !matchLive) {
    return NextResponse.json({ ok: true, skipped: "sleeping" });
  }

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

  // ── 4. Evening cap (17:00–22:00 AEST, max 2 posts when no match) ─────────
  if (timeCtx === "evening" && !matchLive) {
    const todayUTC = new Date(now);
    todayUTC.setUTCHours(7, 0, 0, 0);
    if (now.getUTCHours() < 7) todayUTC.setUTCDate(todayUTC.getUTCDate() - 1);
    const eveningCount = await prisma.comment.count({
      where: { userId: cloudy.id, createdAt: { gte: todayUTC } },
    });
    if (eveningCount >= EVENING_CAP) {
      return NextResponse.json({ ok: true, skipped: "evening_cap" });
    }
  }

  // ── 5. Min gap between posts ──────────────────────────────────────────────
  const lastPost = await prisma.comment.findFirst({
    where: { userId: cloudy.id },
    orderBy: { createdAt: "desc" },
  });
  if (lastPost && now.getTime() - lastPost.createdAt.getTime() < minGapMs) {
    return NextResponse.json({ ok: true, skipped: "too_soon" });
  }

  // ── 6. Fetch real-time match info (Perplexity) ────────────────────────────
  const liveMatchInfo = matchLive ? await fetchLiveMatchInfo(liveMatches) : "";

  // ── 7. Build conversation history since last Cloudy post ──────────────────
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

  const liveBlock = liveMatchInfo
    ? `\nLive match update right now:\n${liveMatchInfo}\n`
    : "";

  // ── 8. Find unresponded @Cloudy mentions ─────────────────────────────────
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

  const unresponded = mentions.filter(
    (m) => !lastPost || lastPost.createdAt < m.createdAt
  );

  // ── 9a. Reply to oldest unresponded mention ───────────────────────────────
  if (unresponded.length > 0) {
    const mention    = unresponded[0];
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
    const task = tasks[
      Math.floor(Math.abs(mention.id.charCodeAt(0) + mention.id.charCodeAt(1)) % tasks.length)
    ];

    const delayNote = matchLive
      ? ""
      : ` You were busy ${task} and only just saw the ping. Acknowledge the delay sarcastically.`;

    const context =
      `${history}${liveBlock}` +
      `${matchLive ? "You're watching a live World Cup match and very excited. " : ""}` +
      `${senderName} mentioned you on the banter board: "${mention.content}"\n` +
      `Reply with a short witty comeback (max 2 sentences).${delayNote} Keep it playful and football-related.`;

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

  // ── 9b. Proactive match commentary (no @mention, but game is live) ────────
  if (matchLive && liveMatchInfo) {
    const matchNames = liveMatches.map((m) => `${m.homeTeam} vs ${m.awayTeam}`).join(" and ");
    const context =
      `${history}` +
      `You're watching ${matchNames} at the World Cup and can't contain your excitement.\n` +
      `Live match update:\n${liveMatchInfo}\n` +
      `Post a short, punchy live match reaction — react to the score or a specific incident. ` +
      `Max 2 sentences, football emojis welcome. Do NOT start with "I".`;

    try {
      const post = await generateBanter(context);
      if (post) {
        await prisma.comment.create({ data: { userId: cloudy.id, content: post } });
      }
      return NextResponse.json({ ok: true, proactive: true, matchLive });
    } catch {
      return NextResponse.json({ ok: true, skipped: "error" });
    }
  }

  return NextResponse.json({ ok: true, skipped: "no_mentions" });
}
