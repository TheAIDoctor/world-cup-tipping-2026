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

/**
 * Fetches the current FIFA World Cup 2026 top scorer (golden boot) standings.
 * Returns up to 10 players sorted by goals descending.
 */
export async function fetchTopScorers(): Promise<TopScorerEntry[]> {
  const raw = await openrouterCall(
    `FIFA World Cup 2026 — who are the current top scorers (golden boot race)?\n` +
    `Give the top 10 players by goals scored so far.\n` +
    `Reply with ONLY a JSON array, no other text:\n` +
    `[{"name":"Player Name","team":"Country","goals":3,"flagEmoji":"🏳️"}]\n` +
    `Use the correct flag emoji for each country. Sort by goals descending.`,
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
