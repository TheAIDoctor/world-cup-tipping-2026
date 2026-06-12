const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type MatchScoreResult = {
  homeScore: number;
  awayScore: number;
  status: "live" | "finished" | "not_started" | "unknown";
};

export type TopScorerEntry = {
  name: string;
  team: string;
  goals: number;
  flagEmoji: string;
};

export type TournamentStandings = {
  champion: string;
  runnerUp: string;
  third: string;
  fourth: string;
  topScorer1: string;
  topScorer2: string;
  topScorer3: string;
};

async function openrouterCall(prompt: string, maxTokens: number): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wc26-henna.vercel.app",
        "X-Title": "CloudMarc WC26 Tipping",
      },
      body: JSON.stringify({
        model: "perplexity/sonar",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches the current or final score for a single WC 2026 match.
 */
export async function fetchMatchScore(
  homeTeam: string,
  awayTeam: string
): Promise<MatchScoreResult | null> {
  const raw = await openrouterCall(
    `FIFA World Cup 2026 match: ${homeTeam} vs ${awayTeam}.\n` +
    `What is the exact score right now? If finished, give the final score.\n` +
    `Reply with ONLY valid JSON, no other text:\n` +
    `{"status":"live","homeScore":0,"awayScore":0}\n` +
    `"status" must be exactly one of: "live", "finished", "not_started".\n` +
    `${homeTeam} score goes in "homeScore", ${awayTeam} score in "awayScore".`,
    120
  );
  if (!raw) return null;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const homeScore = Number(parsed.homeScore);
    const awayScore = Number(parsed.awayScore);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;
    if (homeScore < 0 || awayScore < 0) return null;
    const rawStatus = String(parsed.status ?? "");
    const status: MatchScoreResult["status"] =
      rawStatus === "live" || rawStatus === "finished" || rawStatus === "not_started"
        ? rawStatus : "unknown";
    return { homeScore, awayScore, status };
  } catch {
    return null;
  }
}

export type MatchScorerEntry = {
  name: string;
  team: string;
  goals: number;
};

/**
 * Fetches the goalscorers for one specific finished match. The caller
 * validates the result against the official score (per-team goal totals must
 * match) before persisting, so a hallucinated list cannot leak in.
 */
export async function fetchMatchScorers(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): Promise<MatchScorerEntry[] | null> {
  if (homeScore === 0 && awayScore === 0) return [];
  const attempt = () => fetchMatchScorersOnce(homeTeam, awayTeam, homeScore, awayScore);

  // Consensus requirement: two independent reads must agree on the exact
  // scorer list. Totals alone can't catch misattribution (both Korea goals
  // were once credited to one player); identical independent reads make a
  // hallucinated attribution far less likely to persist.
  const [a, b] = [await attempt(), await attempt()];
  if (!a || !b) return null;
  const key = (e: MatchScorerEntry) => `${e.name.toLowerCase()}|${e.team}|${e.goals}`;
  const setA = new Set(a.map(key));
  const setB = new Set(b.map(key));
  if (setA.size !== setB.size || [...setA].some((k) => !setB.has(k))) return null;
  return a;
}

async function fetchMatchScorersOnce(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): Promise<MatchScorerEntry[] | null> {
  const raw = await openrouterCall(
    `FIFA World Cup 2026 match: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam} (final score).\n` +
    `Who scored the goals in this match? List EVERY individual goalscorer with the minute of each goal.\n` +
    `Be precise about WHO scored each goal — do not merge different players' goals together.\n` +
    `Credit own goals to the team that benefited, with the player name suffixed " (OG)".\n` +
    `Reply with ONLY a JSON array, no other text:\n` +
    `[{"name":"Player Name","team":"${homeTeam}","goals":1,"minutes":"67'"}]\n` +
    `"team" must be exactly "${homeTeam}" or "${awayTeam}".\n` +
    `The goals for ${homeTeam} must total ${homeScore} and for ${awayTeam} must total ${awayScore}.`,
    500
  );
  if (!raw) return null;
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as unknown[];
    const entries = parsed
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        name: String(e.name ?? "").trim(),
        team: String(e.team ?? "").trim(),
        goals: Math.max(0, Number(e.goals) || 0),
      }))
      .filter((e) => e.name && e.goals > 0);

    // Hard validation: per-team totals must equal the official score.
    const homeTotal = entries.filter((e) => e.team === homeTeam).reduce((s, e) => s + e.goals, 0);
    const awayTotal = entries.filter((e) => e.team === awayTeam).reduce((s, e) => s + e.goals, 0);
    if (homeTotal !== homeScore || awayTotal !== awayScore) return null;
    return entries;
  } catch {
    return null;
  }
}

/**
 * Fetches the current FIFA World Cup 2026 top scorer (golden boot) standings.
 * Returns up to 10 players sorted by goals descending.
 */
export async function fetchTopScorers(): Promise<TopScorerEntry[]> {
  const raw = await openrouterCall(
    `FIFA World Cup 2026 FINAL TOURNAMENT (June 11 – July 19, 2026, hosted in USA/Mexico/Canada) — ` +
    `who are the top scorers (golden boot race)?\n` +
    `STRICT RULES:\n` +
    `- Count ONLY goals scored in official World Cup 2026 final tournament matches (group stage and knockout rounds).\n` +
    `- Do NOT count qualifying matches, friendlies, warm-up games, club football, or any other competition.\n` +
    `- The tournament just started, so tallies will be small. If no goals have been scored yet, reply with [].\n` +
    `Give up to 10 players by tournament goals scored so far.\n` +
    `Reply with ONLY a JSON array, no other text:\n` +
    `[{"name":"Player Name","team":"Country","goals":1,"flagEmoji":"🏳️"}]\n` +
    `Use official FIFA country names and the correct flag emoji. Sort by goals descending.`,
    400
  );
  if (!raw) return [];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as unknown[];
    return parsed
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        name: String(e.name ?? "").trim(),
        team: String(e.team ?? "").trim(),
        goals: Math.max(0, Number(e.goals) || 0),
        flagEmoji: String(e.flagEmoji ?? ""),
      }))
      .filter((e) => e.name && e.goals >= 0)
      .slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Fetches the final tournament standings once the competition is over.
 * Returns null if the tournament hasn't finished yet or data is unavailable.
 */
export async function fetchTournamentStandings(): Promise<TournamentStandings | null> {
  const raw = await openrouterCall(
    `FIFA World Cup 2026 — has the tournament finished? If yes, give the final standings.\n` +
    `Reply with ONLY valid JSON, no other text. If the tournament is not finished yet, reply:\n` +
    `{"finished":false}\n` +
    `If it is finished:\n` +
    `{"finished":true,"champion":"Country","runnerUp":"Country","third":"Country","fourth":"Country",` +
    `"topScorer1":"Player Name","topScorer2":"Player Name","topScorer3":"Player Name"}`,
    200
  );
  if (!raw) return null;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    if (!parsed.finished) return null;
    const str = (k: string) => String(parsed[k] ?? "").trim() || "";
    return {
      champion: str("champion"),
      runnerUp: str("runnerUp"),
      third: str("third"),
      fourth: str("fourth"),
      topScorer1: str("topScorer1"),
      topScorer2: str("topScorer2"),
      topScorer3: str("topScorer3"),
    };
  } catch {
    return null;
  }
}
