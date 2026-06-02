export type TeamRow = {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  group: string;
};

export type MatchRow = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type Standing = {
  team: TeamRow;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

/**
 * Derives W/D/L/GF/GA/GD/Pts for each team in a group from the set of
 * completed group-stage matches (those with non-null homeScore/awayScore).
 *
 * Tiebreak: points → goal difference → goals scored → name (alphabetical).
 * Head-to-head is omitted — it rarely matters before the final matchday and
 * adds significant complexity with no user-facing value at this scale.
 *
 * Knockout penalty shootout scores are intentionally ignored; this table
 * reflects 90-minute group-stage records only.
 */
export function computeGroupStandings(teams: TeamRow[], matches: MatchRow[]): Standing[] {
  const stats = new Map<string, Omit<Standing, "goalDiff" | "points">>(
    teams.map((t) => [
      t.id,
      { team: t, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
    ])
  );

  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null || !m.homeTeamId || !m.awayTeamId) continue;
    const home = stats.get(m.homeTeamId);
    const away = stats.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++;
      away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  return Array.from(stats.values())
    .map((s) => ({
      ...s,
      goalDiff: s.goalsFor - s.goalsAgainst,
      points: s.won * 3 + s.drawn,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name)
    );
}
