/**
 * POST /api/cloudy/react-to-result
 * Called after admin enters a match result.
 * Cloudy checks how its tip compared to the actual result, looks at the
 * leaderboard, and posts banter — bragging, complaining, or trash-talking
 * nearby players depending on how things went.
 */

import { prisma } from "@/lib/prisma";
import { CLOUDY_EMAIL, generateBanter } from "@/lib/cloudy-ai";
import { getLeaderboard } from "@/lib/scoring";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("x-cron-secret")
    ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await req.json() as { matchId: string };

  const cloudy = await prisma.user.findUnique({ where: { email: CLOUDY_EMAIL } });
  if (!cloudy) return NextResponse.json({ error: "Cloudy not found" }, { status: 404 });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });
  if (!match || match.homeScore === null || match.awayScore === null) {
    return NextResponse.json({ error: "Match result not available" }, { status: 400 });
  }

  const tip = await prisma.matchTip.findUnique({
    where: { userId_matchId: { userId: cloudy.id, matchId } },
  });
  if (!tip) return NextResponse.json({ ok: true, skipped: true });

  const exactScore = tip.homeScore === match.homeScore && tip.awayScore === match.awayScore;
  const correctResult =
    (tip.homeScore > tip.awayScore && match.homeScore > match.awayScore) ||
    (tip.homeScore < tip.awayScore && match.homeScore < match.awayScore) ||
    (tip.homeScore === tip.awayScore && match.homeScore === match.awayScore);
  const points = exactScore ? 5 : correctResult ? 3 : 0;

  // Leaderboard context — fetch after points have been updated
  const leaderboard = await getLeaderboard();
  const cloudyIdx = leaderboard.findIndex((p) => p.isBot);
  const rank = cloudyIdx + 1;
  const total = leaderboard.length;
  const above = cloudyIdx > 0 ? leaderboard[cloudyIdx - 1] : null;
  const below = cloudyIdx < leaderboard.length - 1 ? leaderboard[cloudyIdx + 1] : null;
  const leader = leaderboard[0];
  const cloudyScore = leaderboard[cloudyIdx]?.total ?? 0;

  // Take a shot at the overall leader ~40% of the time when not adjacent to them
  const isAdjacentToLeader = cloudyIdx <= 1; // rank 1 or 2
  const tauntLeader = !isAdjacentToLeader && Math.random() < 0.4;

  const rankLine = `You are currently ranked #${rank} of ${total} on the leaderboard with ${cloudyScore} points.`;

  const aboveLine = above
    ? `The player just ahead of you is ${above.name} with ${above.total} pts (${above.total - cloudyScore} ahead).`
    : `You are in FIRST PLACE. Nobody is ahead of you.`;

  const belowLine = below
    ? `The player just behind you is ${below.name} with ${below.total} pts (${cloudyScore - below.total} behind you).`
    : `You are LAST on the leaderboard.`;

  const leaderLine = tauntLeader
    ? `The current overall leader is ${leader.name} sitting pretty at #1 with ${leader.total} pts.`
    : "";

  const resultLine = `Match: ${match.homeTeam?.name} ${match.homeScore}–${match.awayScore} ${match.awayTeam?.name}. Your tip: ${tip.homeScore}–${tip.awayScore}. You scored ${points} pts (${exactScore ? "EXACT SCORE 🎯" : correctResult ? "correct result" : "WRONG"}).`;

  let instruction: string;
  if (exactScore) {
    instruction = `You nailed the exact score. Boast insufferably. ${above ? `Trash-talk ${above.name} (just ahead of you) and tell them you're coming for them.` : "You're at the top — remind everyone who the real expert is."}`;
    if (tauntLeader) instruction += ` Also take a cheeky jab at ${leader.name} at the top — you're not there yet but the AI never forgets.`;
  } else if (correctResult) {
    instruction = `You got the result right (not exact). Modest brag. ${above ? `Mention ${above.name} is still ahead of you but not for long.` : ""} ${below ? `Remind ${below.name} (just behind) that they're not catching up.` : ""}`;
    if (tauntLeader) instruction += ` Throw a casual dig at ${leader.name} sitting at the top — something like "enjoy it while it lasts."`;
  } else {
    instruction = `You got it completely wrong. Make a funny excuse (blame the referee, injuries, Mercury in retrograde, anything but your own model). ${above ? `Grumble that ${above.name} is probably gloating.` : ""} ${below ? `Warn ${below.name} not to get too excited about closing the gap.` : ""}`;
    if (tauntLeader) instruction += ` Begrudgingly acknowledge ${leader.name} is at the top right now — but make it sound like a temporary insult to your intelligence.`;
  }
  instruction += " Keep the whole thing to 1-2 sentences.";

  const context = [resultLine, rankLine, aboveLine, belowLine, leaderLine, "", instruction]
    .filter(Boolean)
    .join("\n");

  try {
    const banter = await generateBanter(context);
    if (banter) {
      await prisma.comment.create({ data: { userId: cloudy.id, content: banter } });
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, points, exactScore, correctResult, rank });
}
