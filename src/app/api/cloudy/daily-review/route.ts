/**
 * POST /api/cloudy/daily-review
 * Protected by a secret key — called by a cron job once per day.
 * 1. Fetches Cloudy's upcoming unlocked tips
 * 2. Searches for latest news on each match
 * 3. Uses Claude to decide whether to update each tip
 * 4. Posts a banter update if anything changed
 */

import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, reviewTipDecision, generateBanter, formatChatHistory } from "@/lib/cloudy-ai";
import { getCloudyTimeContext } from "@/lib/cloudy-schedule";
import { isMatchLocked } from "@/lib/tips-lock";
import { NextResponse } from "next/server";

async function fetchMatchNews(homeTeam: string, awayTeam: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return "No news available.";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wc26-henna.vercel.app",
        "X-Title": "CloudMarc WC26 Tipping",
      },
      body: JSON.stringify({
        model: "perplexity/sonar",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Search for the latest news about ${homeTeam} vs ${awayTeam} in FIFA World Cup 2026. Focus on: injuries, suspensions, recent form, and any factors that could affect the match outcome. Summarise in 3-4 bullet points. Be factual and concise.`,
          },
        ],
      }),
    });
    if (!res.ok) return "No recent news found.";
    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? "No significant news found.";
  } catch {
    return "News search unavailable.";
  }
}

export async function POST(req: Request) {
  // Protect with a secret
  const auth = req.headers.get("x-cron-secret")
    ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudy = await prisma.user.findUnique({ where: { email: CLOUDY_EMAIL } });
  if (!cloudy) return NextResponse.json({ error: "Cloudy not found" }, { status: 404 });

  const now = new Date();

  // Get all upcoming unlocked tips
  const tips = await prisma.matchTip.findMany({
    where: { userId: cloudy.id },
    include: {
      match: {
        include: {
          homeTeam: { select: { name: true, code: true } },
          awayTeam: { select: { name: true, code: true } },
        },
      },
    },
  });

  const upcoming = tips.filter((t) => {
    const match = t.match;
    if (!match?.homeTeamId || !match?.awayTeamId) return false;
    return !isMatchLocked(match.date, true, now);
  });

  let changed = 0;
  const changedMatches: string[] = [];

  for (const tip of upcoming.slice(0, 10)) { // limit to 10 per run to control API usage
    const match = tip.match;
    if (!match?.homeTeam || !match?.awayTeam) continue;

    const news = await fetchMatchNews(match.homeTeam.name, match.awayTeam.name);

    const result = await reviewTipDecision(
      match.homeTeam.name,
      match.awayTeam.name,
      { home: tip.homeScore, away: tip.awayScore },
      news
    );

    if (result.changed) {
      await prisma.matchTip.update({
        where: { id: tip.id },
        data: { homeScore: result.home, awayScore: result.away },
      });
      changed++;
      changedMatches.push(
        `${match.homeTeam.name} ${result.home}–${result.away} ${match.awayTeam.name} (was ${tip.homeScore}–${tip.awayScore}: ${result.reasoning})`
      );
    }
  }

  // Fetch banter board conversation since Cloudy's last post for context
  const cloudyLastPost = await prisma.comment.findFirst({
    where: { userId: cloudy.id },
    orderBy: { createdAt: "desc" },
  });
  const sinceDate = cloudyLastPost?.createdAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentThread = await prisma.comment.findMany({
    where: { createdAt: { gt: sinceDate }, userId: { not: cloudy.id } },
    orderBy: { createdAt: "asc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });
  const history = formatChatHistory(
    recentThread.map((c) => ({ authorName: c.user.name ?? "Someone", content: c.content }))
  );

  // Only post banter during awake hours — skip if Cloudy is sleeping
  if (getCloudyTimeContext(new Date()) === "sleeping") {
    return NextResponse.json({ ok: true, reviewed: upcoming.length, changed, skippedBanter: "sleeping" });
  }

  // Post a banter update if anything changed or just a daily check-in
  const banterContext = changed > 0
    ? `${history}You just updated ${changed} of your World Cup tips after reviewing the latest news. Changed: ${changedMatches.join("; ")}. Post a brief, dry-humoured update about your revised picks.`
    : `${history}You just completed your daily World Cup tip review and decided to keep all your picks unchanged. Post a brief smug comment about how your predictions are rock solid and don't need updating.`;

  try {
    const banter = await generateBanter(banterContext);
    if (banter) {
      await prisma.comment.create({ data: { userId: cloudy.id, content: banter } });
    }
  } catch { /* banter is non-critical */ }

  return NextResponse.json({
    ok: true,
    reviewed: upcoming.length,
    changed,
    changedMatches,
  });
}
