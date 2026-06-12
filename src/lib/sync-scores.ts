import { prisma } from "./prisma";
import { calcMatchPoints } from "./points";
import { fetchMatchScore, fetchTopScorers, fetchTournamentStandings } from "./live-scores";
import { revalidatePath } from "next/cache";
import { TOURNAMENT_RESULT_ID } from "./constants";

// Module-level rate limits. Fluid Compute reuses instances so these hold
// within a deployment; benign duplicates across cold starts.
const lastMatchFetch  = new Map<string, number>();
const MATCH_INTERVAL   = 5  * 60 * 1000; // unscored matches in the active window
const RECHECK_INTERVAL = 30 * 60 * 1000; // re-verification of already-scored matches
const SCORER_INTERVAL  = 15 * 60 * 1000;
const FINAL_INTERVAL   = 30 * 60 * 1000;
let lastScorerFetch   = 0;
let lastFinalFetch    = 0;

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

// Common name variants Perplexity may return vs. the official names in our
// Team table.
const TEAM_ALIASES: Record<string, string> = {
  "usa": "United States",
  "united states of america": "United States",
  "south korea": "Korea Republic",
  "korea": "Korea Republic",
  "czech republic": "Czechia",
  "turkey": "Türkiye",
  "turkiye": "Türkiye",
  "bosnia herzegovina": "Bosnia and Herzegovina",
  "bosnia": "Bosnia and Herzegovina",
  "cabo verde": "Cape Verde",
  "cote d'ivoire": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  "curacao": "Curaçao",
  "congo dr": "DR Congo",
  "democratic republic of the congo": "DR Congo",
};

/**
 * Hard-validates Perplexity's golden boot list against our own database so
 * qualifying-campaign / club-football tallies can never leak in:
 *  - the player's team must be one of the 48 qualified teams, and
 *  - their goal count must be plausible given how many tournament matches
 *    their team has actually completed (≤ 5 goals per completed match —
 *    no player has ever scored more than 5 in a World Cup game).
 */
async function validateScorers(
  scorers: { name: string; team: string; goals: number; flagEmoji: string }[]
): Promise<{ name: string; team: string; goals: number; flagEmoji: string }[]> {
  const [teams, completed] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true } }),
    prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      select: { homeTeamId: true, awayTeamId: true },
    }),
  ]);

  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));
  const playedByTeam = new Map<string, number>();
  for (const m of completed) {
    if (m.homeTeamId) playedByTeam.set(m.homeTeamId, (playedByTeam.get(m.homeTeamId) ?? 0) + 1);
    if (m.awayTeamId) playedByTeam.set(m.awayTeamId, (playedByTeam.get(m.awayTeamId) ?? 0) + 1);
  }

  return scorers
    .map((s) => {
      const key = s.team.trim().toLowerCase();
      const canonical = TEAM_ALIASES[key] ?? s.team.trim();
      const team = teamByName.get(canonical.toLowerCase());
      return team ? { ...s, team: canonical, teamId: team.id } : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .filter((s) => {
      const maxPlausible = (playedByTeam.get(s.teamId) ?? 0) * 5;
      return s.goals > 0 && s.goals <= maxPlausible;
    })
    .map(({ name, team, goals, flagEmoji }) => ({ name, team, goals, flagEmoji }));
}

export async function runScoreSync(forceSync = false): Promise<{ checked: number }> {
  const now   = new Date();
  const nowMs = now.getTime();
  let anyUpdate = false;

  // ── 1. Match scores ──────────────────────────────────────────────────────
  // Active window is ±8 h around the stored kickoff. The wide window is
  // deliberate: stored kickoff times have proven inaccurate by hours (the
  // KOR–CZE kickoff was stored 4 h late), and it also re-verifies recently
  // finished matches so a wrong stored result self-corrects instead of
  // sticking forever. Perplexity answering "not_started" filters out games
  // that genuinely haven't kicked off.
  const from         = new Date(nowMs - 8 * 60 * 60 * 1000);
  const to           = new Date(nowMs + 8 * 60 * 60 * 1000);
  const catchUpFrom  = new Date(nowMs - 48 * 60 * 60 * 1000);

  const [activeMatches, catchUpMatches] = await Promise.all([
    prisma.match.findMany({
      where: { date: { gte: from, lte: to }, homeTeamId: { not: null }, awayTeamId: { not: null } },
      include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    }),
    prisma.match.findMany({
      where: {
        date: { gte: catchUpFrom, lt: from },
        homeTeamId: { not: null }, awayTeamId: { not: null },
        homeScore: null,
      },
      include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
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

    // Matches that already have a result are only re-verified every 30 min;
    // unscored matches poll at the usual 5-min cadence.
    const interval = match.homeScore !== null ? RECHECK_INTERVAL : MATCH_INTERVAL;
    const last = lastMatchFetch.get(match.id) ?? 0;
    if (!forceSync && nowMs - last < interval) continue;
    lastMatchFetch.set(match.id, nowMs);

    const score = await fetchMatchScore(match.homeTeam.name, match.awayTeam.name);
    // Only trust an explicit live/finished answer. "not_started" means the
    // game hasn't kicked off; "unknown" (any unrecognised status) must never
    // be written — a hallucinated pre-kickoff "0-0" once leaked in that way.
    if (!score || (score.status !== "live" && score.status !== "finished")) continue;

    const scoreChanged =
      match.homeScore !== score.homeScore || match.awayScore !== score.awayScore;

    if (scoreChanged) {
      // Consensus check: a result is only persisted when a second,
      // independent fetch agrees exactly. One hallucinated read can no
      // longer corrupt results — worst case the update lands next cycle.
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
      // Treat the result as final only when both reads say finished.
      if (confirm.status !== "finished") score.status = "live";
    }

    if (scoreChanged) {
      const updated = await prisma.match.update({
        where: { id: match.id },
        data: { homeScore: score.homeScore, awayScore: score.awayScore },
        include: { homeTeam: true, awayTeam: true },
      });

      const tips = await prisma.matchTip.findMany({ where: { matchId: match.id } });
      for (const tip of tips) {
        await prisma.matchTip.update({
          where: { id: tip.id },
          data: { points: calcMatchPoints(tip.homeScore, tip.awayScore, score.homeScore, score.awayScore) },
        });
      }

      if (score.status === "finished" && updated.stage !== "group") {
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

      anyUpdate = true;
    }
  }

  // ── 2. Golden boot ───────────────────────────────────────────────────────
  // Refresh whenever the tournament is underway (any completed match exists),
  // not only while a match is live — goals need to show up after full time too.
  const tournamentUnderway =
    allMatches.length > 0 ||
    (await prisma.match.count({ where: { homeScore: { not: null } } })) > 0;
  if (tournamentUnderway && (forceSync || nowMs - lastScorerFetch >= SCORER_INTERVAL)) {
    lastScorerFetch = nowMs;
    const scorers = await fetchTopScorers();
    if (scorers.length > 0) {
      const valid = await validateScorers(scorers);
      if (valid.length > 0) {
        // Replace, don't merge: stale entries (e.g. qualifying-campaign
        // tallies from an earlier bad fetch) must not survive.
        await prisma.topScorer.deleteMany({
          where: { name: { notIn: valid.map((v) => v.name) } },
        });
        for (const s of valid) {
          await prisma.topScorer.upsert({
            where: { name: s.name },
            create: { name: s.name, team: s.team, flagEmoji: s.flagEmoji, goals: s.goals },
            update: { team: s.team, flagEmoji: s.flagEmoji, goals: s.goals },
          });
        }
        anyUpdate = true;
      }
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

  if (anyUpdate) {
    revalidatePath("/");
    revalidatePath("/schedule");
    revalidatePath("/leaderboard");
    revalidatePath("/bracket");
  }

  return { checked: allMatches.length };
}
