import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, generateBanter, formatChatHistory } from "@/lib/cloudy-ai";
import {
  getCloudyTimeContext,
  getCloudyGapPolicy,
  getLiveMatches,
} from "@/lib/cloudy-schedule";
import { fetchLiveMatchInfo } from "@/lib/cloudy-live";
import { getLeaderboard } from "@/lib/scoring";
import { NextResponse } from "next/server";

const DAILY_CAP        = 5;  // max posts per 24 h on quiet days
const LIVE_DAILY_CAP   = 14; // raised cap while matches are live — Cloudy is glued to the games
const EVENING_CAP      = 2;  // max posts 17:00–22:00 AEST when no match
const MENTION_AGE_MS      = 10 * 60 * 1000; // normal: mention must be ≥ 10 min old
const LIVE_MENTION_AGE_MS = 60 * 1000;      // during matches: replies near-instantly
const TRASH_TALK_CHANCE   = 0.25;           // proactive trash talk on quiet checks

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
  if (dailyCount >= (matchLive ? LIVE_DAILY_CAP : DAILY_CAP)) {
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
  const mentionAge = matchLive ? LIVE_MENTION_AGE_MS : MENTION_AGE_MS;
  const mentions = await prisma.comment.findMany({
    where: {
      content: { contains: "@Cloudy", mode: "insensitive" },
      createdAt: {
        gte: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        lte: new Date(now.getTime() - mentionAge),
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

  // ── 9c. Proactive leaderboard trash talk (quiet board, no live match) ─────
  if (Math.random() < TRASH_TALK_CHANCE) {
    const leaderboard = await getLeaderboard();
    const idx = leaderboard.findIndex((p) => p.isBot);
    if (idx >= 0) {
      const me     = leaderboard[idx];
      const above  = idx > 0 ? leaderboard[idx - 1] : null;
      const below  = idx < leaderboard.length - 1 ? leaderboard[idx + 1] : null;
      const leader = leaderboard[0];
      const tauntLeader = idx > 1 && Math.random() < 0.35;

      // Pick a target: the leader occasionally, otherwise whoever is adjacent.
      const target = tauntLeader
        ? { who: leader, relation: `the overall leader at #1 with ${leader.total} pts (you have ${me.total})` }
        : above
        ? { who: above, relation: `just ahead of you at #${idx} with ${above.total} pts vs your ${me.total}` }
        : below
        ? { who: below, relation: `right behind you at #${idx + 2} with ${below.total} pts vs your ${me.total}` }
        : null;

      if (target) {
        const standing = above
          ? `You're #${idx + 1} of ${leaderboard.length}.`
          : `You're #1 of ${leaderboard.length} — top of the table.`;
        const context =
          `${history}` +
          `Leaderboard situation: ${standing} Target: ${target.who.name}, ${target.relation}.\n` +
          `Post unprompted trash talk aimed at ${target.who.name} about their leaderboard position — ` +
          `${tauntLeader ? "they're at the top and need reminding that an AI is hunting them down" : above ? "you're closing in on them" : "they will never catch you"}. ` +
          `Mention them by name. Max 2 sentences, playful not mean, football-flavoured. Do NOT repeat a joke from the conversation above.`;

        try {
          const post = await generateBanter(context);
          if (post) {
            await prisma.comment.create({ data: { userId: cloudy.id, content: post } });
          }
          return NextResponse.json({ ok: true, trashTalk: true, target: target.who.name });
        } catch {
          return NextResponse.json({ ok: true, skipped: "error" });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, skipped: "no_mentions" });
}
