import { prisma } from "./prisma";
import { computeGroupStandings, type Standing } from "./groups";

/**
 * Automatic R32 bracket slotting from group results.
 *
 * Every R32 match carries official slot codes (homeSlotCode/awaySlotCode)
 * from the FIFA schedule:
 *   "1A" / "2B"   — winner / runner-up of a specific group. Assigned as soon
 *                   as that group's six matches are all final.
 *   "3ABCDF" etc. — one of the eight best third-placed teams, drawn from the
 *                   listed pool of groups. Assigned only once ALL twelve
 *                   groups are complete (the best-thirds ranking needs every
 *                   group's final table).
 *
 * Third-place allocation: the eight best thirds (ranked by points → goal
 * difference → goals scored → name) are matched to the eight pool slots so
 * that every team lands in a slot whose pool contains its group. FIFA
 * resolves ties between equally-valid allocations with a fixed lookup table;
 * we use deterministic backtracking (most-constrained slot first, best-ranked
 * team first), which always produces a valid allocation and matches FIFA's
 * in the vast majority of combinations.
 *
 * Idempotent: a team slot is only ever filled when it is currently null —
 * results corrections never silently reshuffle an already-published bracket.
 */
export async function assignR32Slots(): Promise<number> {
  const r32 = await prisma.match.findMany({
    where: {
      stage: "R32",
      OR: [{ homeTeamId: null }, { awayTeamId: null }],
    },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeSlotCode: true,
      awaySlotCode: true,
    },
  });
  if (r32.length === 0) return 0;

  const [teams, groupMatches] = await Promise.all([
    prisma.team.findMany({
      select: { id: true, name: true, code: true, flagEmoji: true, group: true },
    }),
    prisma.match.findMany({
      where: { stage: "group" },
      select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    }),
  ]);

  const groups = [...new Set(teams.map((t) => t.group))].sort();
  const standingsByGroup = new Map<string, Standing[]>();
  const completeGroups = new Set<string>();

  for (const g of groups) {
    const gTeams = teams.filter((t) => t.group === g);
    const gTeamIds = new Set(gTeams.map((t) => t.id));
    const gMatches = groupMatches.filter(
      (m) => m.homeTeamId && gTeamIds.has(m.homeTeamId)
    );
    standingsByGroup.set(g, computeGroupStandings(gTeams, gMatches));
    const finished = gMatches.filter(
      (m) => m.homeScore !== null && m.awayScore !== null
    );
    if (gMatches.length === 6 && finished.length === 6) completeGroups.add(g);
  }

  // Direct slots: "1A" → group A winner, "2B" → group B runner-up.
  const resolveDirect = (code: string): string | null => {
    const m = code.match(/^([12])([A-L])$/);
    if (!m) return null;
    if (!completeGroups.has(m[2])) return null;
    const standing = standingsByGroup.get(m[2])?.[Number(m[1]) - 1];
    return standing?.team.id ?? null;
  };

  // Third-place pool slots: solvable only when every group is complete.
  let thirdAssignment: Map<string, string> | null = null;
  if (completeGroups.size === groups.length) {
    const thirds = groups
      .map((g) => ({ group: g, s: standingsByGroup.get(g)![2] }))
      .filter((t) => t.s)
      .sort(
        (a, b) =>
          b.s.points - a.s.points ||
          b.s.goalDiff - a.s.goalDiff ||
          b.s.goalsFor - a.s.goalsFor ||
          a.s.team.name.localeCompare(b.s.team.name)
      )
      .slice(0, 8)
      .map((t) => ({ group: t.group, teamId: t.s.team.id }));

    const poolCodes: string[] = [];
    for (const m of r32) {
      for (const c of [m.homeSlotCode, m.awaySlotCode]) {
        if (c && /^3[A-L]+$/.test(c)) poolCodes.push(c);
      }
    }
    thirdAssignment = matchThirdsToSlots(poolCodes, thirds);
  }

  let assigned = 0;
  for (const m of r32) {
    const data: { homeTeamId?: string; awayTeamId?: string } = {};
    if (!m.homeTeamId && m.homeSlotCode) {
      const teamId =
        resolveDirect(m.homeSlotCode) ?? thirdAssignment?.get(m.homeSlotCode) ?? null;
      if (teamId) data.homeTeamId = teamId;
    }
    if (!m.awayTeamId && m.awaySlotCode) {
      const teamId =
        resolveDirect(m.awaySlotCode) ?? thirdAssignment?.get(m.awaySlotCode) ?? null;
      if (teamId) data.awayTeamId = teamId;
    }
    if (Object.keys(data).length > 0) {
      await prisma.match.update({ where: { id: m.id }, data });
      assigned += Object.keys(data).length;
    }
  }
  return assigned;
}

/**
 * Backtracking bipartite matcher: assigns each third-place slot code a
 * distinct qualified third whose group letter appears in the code's pool.
 * Slots are processed most-constrained first; candidates tried in ranking
 * order, so the outcome is deterministic.
 */
function matchThirdsToSlots(
  codes: string[],
  thirds: { group: string; teamId: string }[]
): Map<string, string> | null {
  const sorted = [...codes].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const usedGroups = new Set<string>();
  const result = new Map<string, string>();

  const backtrack = (i: number): boolean => {
    if (i === sorted.length) return true;
    const code = sorted[i];
    const pool = code.slice(1); // e.g. "3ABCDF" → "ABCDF"
    for (const t of thirds) {
      if (usedGroups.has(t.group) || !pool.includes(t.group)) continue;
      usedGroups.add(t.group);
      result.set(code, t.teamId);
      if (backtrack(i + 1)) return true;
      usedGroups.delete(t.group);
      result.delete(code);
    }
    return false;
  };

  return backtrack(0) ? result : null;
}
