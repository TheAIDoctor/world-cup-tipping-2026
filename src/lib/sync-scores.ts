import { prisma } from "./prisma";
import { calcMatchPoints } from "./points";
import { fetchMatchScore, fetchMatchScorers, fetchTournamentStandings } from "./live-scores";
import { fetchOfficialFeed, normalizeFeedTeam, feedDate, type FeedMatch } from "./official-feed";
import { assignR32Slots } from "./bracket-slotting";
import { cloudyReactToResult } from "./cloudy-react";
import { revalidatePath } from "next/cache";
import { TOURNAMENT_RESULT_ID } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// MASTER DATA MODEL
//
//   Match.date / homeScore / awayScore  — kickoff times and official results.
//     Source of truth: the official fixture feed (fetchOfficialFeed), which
//     mirrors FIFA's schedule and final scores. Perplexity (with mandatory
//     consensus double-reads) is used ONLY for live in-progress updates while
//     the feed has no score yet; whatever it writes is overwritten by the
//     official feed score as soon as one exists, every sync cycle.
//
//   MatchGoal — who scored in each match. Fetched per finished match and
//     hard-validated: per-team goal totals must equal the official score or
//     the whole list is rejected.
//
//   TopScorer — the Golden Boot table. Never fetched as a standalone list;
//     always derived by aggregating MatchGoal rows.
// ─────────────────────────────────────────────────────────────────────────────

// Module-level rate limits. Fluid Compute reuses instances so these hold
// within a deployment; benign duplicates across cold starts.
const lastMatchFetch   = new Map<string, number>();
const MATCH_INTERVAL   = 5  * 60 * 1000; // unscored matches in the active window
const RECHECK_INTERVAL = 30 * 60 * 1000; // re-verification of already-scored matches
const FINAL_INTERVAL   = 30 * 60 * 1000; // tournament standings
let lastFinalFetch     = 0;

type DbMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  date: Date;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
};

function determineWinner(m: {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
}): string | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.awayScore > m.homeScore) return m.awayTeamId;
  if (m.penaltyHomeScore === null || m.penaltyAwayScore === null) return null;
  if (m.penaltyHomeScore > m.penaltyAwayScore) return m.homeTeamId;
  if (m.penaltyAwayScore > m.penaltyHomeScore) return m.awayTeamId;
  return null;
}

/**
 * Finds the official feed entry for a DB match.
 * Knockout matches share FIFA's official numbering (73–104) with the feed;
 * group matches are matched by their unique team pairing because the feed's
 * group-stage match numbers differ from ours. `flipped` is set when the feed
 * lists our home team as away.
 */
function findFeedMatch(
  feed: FeedMatch[],
  match: DbMatch
): { f: FeedMatch; flipped: boolean } | null {
  if (match.stage !== "group") {
    const f = feed.find((x) => x.MatchNumber === match.matchNumber);
    return f ? { f, flipped: false } : null;
  }
  if (!match.homeTeam || !match.awayTeam) return null;
  const h = match.homeTeam.name.toLowerCase();
  const a = match.awayTeam.name.toLowerCase();
  for (const f of feed) {
    if (!f.Group) continue;
    const fh = normalizeFeedTeam(f.HomeTeam).toLowerCase();
    const fa = normalizeFeedTeam(f.AwayTeam).toLowerCase();
    if (fh === h && fa === a) return { f, flipped: false };
    if (fh === a && fa === h) return { f, flipped: true };
  }
  return null;
}

/**
 * Writes a (new) result for a match: updates the score, rescores every tip,
 * clears any goalscorer rows recorded against the old score so they are
 * re-fetched and re-validated, and (for finished knockout games) advances the
 * bracket.
 */
async function applyResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
  isFinal: boolean
): Promise<void> {
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
    include: { homeTeam: true, awayTeam: true },
  });

  const tips = await prisma.matchTip.findMany({ where: { matchId } });
  for (const tip of tips) {
    await prisma.matchTip.update({
      where: { id: tip.id },
      data: { points: calcMatchPoints(tip.homeScore, tip.awayScore, homeScore, awayScore) },
    });
  }

  // Scorers recorded against a superseded score are no longer trustworthy.
  await prisma.matchGoal.deleteMany({ where: { matchId } });

  if (isFinal && updated.stage !== "group") {
    const winnerTeamId = determineWinner(updated);
    const loserTeamId =
      winnerTeamId === updated.homeTeamId ? updated.awayTeamId :
      winnerTeamId === updated.awayTeamId ? updated.homeTeamId : null;

    if (winnerTeamId && updated.nextMatchId && updated.nextMatchSlot) {
      await prisma.match.update({
        where: { id: updated.nextMatchId },
        data: updated.nextMatchSlot === "home" ? { homeTeamId: winnerTeamId } : { awayTeamId: winnerTeamId },
      });
    }
    if (loserTeamId && updated.loserMatchId && updated.loserMatchSlot) {
      await prisma.match.update({
        where: { id: updated.loserMatchId },
        data: updated.loserMatchSlot === "home" ? { homeTeamId: loserTeamId } : { awayTeamId: loserTeamId },
      });
    }
  }

  if (isFinal) {
    // Group results can complete a group → fill R32 bracket slots.
    if (updated.stage === "group") {
      try { await assignR32Slots(); } catch (e) { console.error("R32 slotting failed:", e); }
    }
    // Cloudy brags/complains on the banter board (deduped per match inside).
    try { await cloudyReactToResult(matchId); } catch { /* non-critical */ }
  }
}

export async function runScoreSync(forceSync = false): Promise<{ checked: number }> {
  const now   = new Date();
  const nowMs = now.getTime();
  let anyUpdate = false;

  // The official feed is fetched once per sync (internally cached 2 min).
  const feed = await fetchOfficialFeed();

  // ── 1. Match scores ──────────────────────────────────────────────────────
  // Active window is ±8 h around the stored kickoff: covers live games, keeps
  // re-verifying recently finished ones so any wrong result self-corrects,
  // and tolerates schedule drift.
  const from        = new Date(nowMs - 8 * 60 * 60 * 1000);
  const to          = new Date(nowMs + 8 * 60 * 60 * 1000);
  const catchUpFrom = new Date(nowMs - 48 * 60 * 60 * 1000);

  const matchInclude = {
    homeTeam: { select: { name: true } },
    awayTeam: { select: { name: true } },
  } as const;

  const [activeMatches, catchUpMatches] = await Promise.all([
    prisma.match.findMany({
      where: { date: { gte: from, lte: to }, homeTeamId: { not: null }, awayTeamId: { not: null } },
      include: matchInclude,
    }),
    prisma.match.findMany({
      where: {
        date: { gte: catchUpFrom, lt: from },
        homeTeamId: { not: null }, awayTeamId: { not: null },
        homeScore: null,
      },
      include: matchInclude,
    }),
  ]);

  const seen = new Set<string>();
  const allMatches = [...activeMatches, ...catchUpMatches].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  for (const match of allMatches) {
    if (!match.homeTeam?.name || !match.awayTeam?.name) continue;

    const interval = match.homeScore !== null ? RECHECK_INTERVAL : MATCH_INTERVAL;
    const last = lastMatchFetch.get(match.id) ?? 0;
    if (!forceSync && nowMs - last < interval) continue;
    lastMatchFetch.set(match.id, nowMs);

    // 1a. Official feed result — authoritative, no second opinion needed.
    const feedEntry = feed ? findFeedMatch(feed, match) : null;
    if (feedEntry && feedEntry.f.HomeTeamScore !== null && feedEntry.f.AwayTeamScore !== null) {
      const officialHome = feedEntry.flipped ? feedEntry.f.AwayTeamScore : feedEntry.f.HomeTeamScore;
      const officialAway = feedEntry.flipped ? feedEntry.f.HomeTeamScore : feedEntry.f.AwayTeamScore;
      if (match.homeScore !== officialHome || match.awayScore !== officialAway) {
        await applyResult(match.id, officialHome, officialAway, feedEntry.f.Winner !== "");
        anyUpdate = true;
      }
      continue; // never let an LLM read override an official score
    }

    // 1b. No official score yet — Perplexity live updates, consensus-gated.
    const score = await fetchMatchScore(match.homeTeam.name, match.awayTeam.name);
    // Only trust an explicit live/finished answer. "not_started" means the
    // game hasn't kicked off; "unknown" (any unrecognised status) must never
    // be written — a hallucinated pre-kickoff "0-0" once leaked in that way.
    if (!score || (score.status !== "live" && score.status !== "finished")) continue;

    const scoreChanged =
      match.homeScore !== score.homeScore || match.awayScore !== score.awayScore;
    if (!scoreChanged) continue;

    // Consensus check: a result is only persisted when a second, independent
    // fetch agrees exactly. One hallucinated read can no longer corrupt
    // results — worst case the update lands next cycle.
    const confirm = await fetchMatchScore(match.homeTeam.name, match.awayTeam.name);
    if (
      !confirm ||
      (confirm.status !== "live" && confirm.status !== "finished") ||
      confirm.homeScore !== score.homeScore ||
      confirm.awayScore !== score.awayScore
    ) {
      console.warn(
        `Score consensus failed for ${match.homeTeam.name} v ${match.awayTeam.name}: ` +
        `${score.homeScore}-${score.awayScore} (${score.status}) vs ` +
        `${confirm ? `${confirm.homeScore}-${confirm.awayScore} (${confirm.status})` : "null"} — skipping`
      );
      continue;
    }

    const isFinal = score.status === "finished" && confirm.status === "finished";
    await applyResult(match.id, score.homeScore, score.awayScore, isFinal);
    anyUpdate = true;
  }

  // ── 2. Goalscorers per finished match → Golden Boot ─────────────────────
  // A match needs scorers when it has a final result but no MatchGoal rows.
  // "Final" = the official feed has a winner for it, or kickoff was over
  // 2.5 h ago. 0-0 games are excluded (nothing to record).
  const needScorers = (await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
      goals: { none: {} },
      NOT: { homeScore: 0, awayScore: 0 },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    include: matchInclude,
    orderBy: { date: "asc" },
    take: 5, // bound API usage per sync
  })).filter((m) => {
    const fe = feed ? findFeedMatch(feed, m as DbMatch) : null;
    if (fe?.f.Winner) return true;
    return m.date.getTime() < nowMs - 150 * 60 * 1000;
  });

  for (const m of needScorers) {
    if (!m.homeTeam?.name || !m.awayTeam?.name) continue;
    const scorers = await fetchMatchScorers(
      m.homeTeam.name, m.awayTeam.name,
      m.homeScore as number, m.awayScore as number
    );
    if (!scorers || scorers.length === 0) continue; // validation failed — retry next sync
    await prisma.matchGoal.createMany({
      data: scorers.map((s) => ({
        matchId: m.id,
        playerName: s.name,
        team: s.team,
        goals: s.goals,
      })),
      skipDuplicates: true,
    });
    anyUpdate = true;
  }

  // Rebuild the Golden Boot table from MatchGoal aggregation (own goals,
  // suffixed " (OG)", never count toward the race).
  if (anyUpdate || forceSync) {
    const allGoals = await prisma.matchGoal.findMany();
    const tally = new Map<string, { team: string; goals: number }>();
    for (const g of allGoals) {
      if (g.playerName.includes("(OG)")) continue;
      const cur = tally.get(g.playerName);
      tally.set(g.playerName, { team: g.team, goals: (cur?.goals ?? 0) + g.goals });
    }
    const teams = await prisma.team.findMany({ select: { name: true, flagEmoji: true } });
    const flagByTeam = new Map(teams.map((t) => [t.name, t.flagEmoji]));
    const top = [...tally.entries()]
      .map(([name, v]) => ({ name, team: v.team, goals: v.goals, flagEmoji: flagByTeam.get(v.team) ?? "" }))
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .slice(0, 10);

    await prisma.topScorer.deleteMany({
      where: { name: { notIn: top.map((t) => t.name) } },
    });
    for (const s of top) {
      await prisma.topScorer.upsert({
        where: { name: s.name },
        create: s,
        update: { team: s.team, flagEmoji: s.flagEmoji, goals: s.goals },
      });
    }
  }

  // ── 3. Tournament standings ──────────────────────────────────────────────
  if (nowMs - lastFinalFetch >= FINAL_INTERVAL) {
    lastFinalFetch = nowMs;
    const standings = await fetchTournamentStandings();
    if (standings) {
      await prisma.tournamentResult.upsert({
        where: { id: TOURNAMENT_RESULT_ID },
        create: { id: TOURNAMENT_RESULT_ID, ...standings },
        update: standings,
      });
      anyUpdate = true;
    }
  }

  // ── 4. Schedule drift guard ──────────────────────────────────────────────
  // Kickoff times in the active window are continuously reconciled against
  // the official feed so tip-locking always uses the real kickoff.
  if (feed) {
    for (const match of allMatches) {
      const fe = findFeedMatch(feed, match);
      if (!fe) continue;
      const official = feedDate(fe.f);
      if (match.date.getTime() !== official.getTime()) {
        await prisma.match.update({ where: { id: match.id }, data: { date: official } });
        anyUpdate = true;
      }
    }
  }

  if (anyUpdate) {
    revalidatePath("/");
    revalidatePath("/schedule");
    revalidatePath("/leaderboard");
    revalidatePath("/bracket");
  }

  return { checked: allMatches.length };
}
