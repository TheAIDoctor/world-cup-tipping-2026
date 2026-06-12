// Master source of truth for the World Cup 2026 schedule and official
// results: the fixturedownload.com feed mirrors FIFA's official fixture
// list (match numbers 1–104, kickoff times in UTC, final scores).
//
// Score precedence in the sync:
//   1. This feed (official, structured)  — authoritative once it has a score
//   2. Perplexity with consensus reads   — live in-progress updates only

export type FeedMatch = {
  MatchNumber: number;
  RoundNumber: number;
  DateUtc: string; // "2026-06-11 19:00:00Z"
  Location: string;
  HomeTeam: string;
  AwayTeam: string;
  Group: string | null;
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  Winner: string;
};

const FEED_URL = "https://fixturedownload.com/feed/json/fifa-world-cup-2026";

// Feed team names → our Team.name values.
export const FEED_TEAM_ALIASES: Record<string, string> = {
  "USA": "United States",
  "Côte d'Ivoire": "Ivory Coast",
  "Cabo Verde": "Cape Verde",
  "IR Iran": "Iran",
  "Congo DR": "DR Congo",
};

export function normalizeFeedTeam(name: string): string {
  return FEED_TEAM_ALIASES[name] ?? name;
}

export function feedDate(f: FeedMatch): Date {
  return new Date(f.DateUtc.replace(" ", "T"));
}

let cachedFeed: { at: number; data: FeedMatch[] } | null = null;
const FEED_CACHE_MS = 2 * 60 * 1000;

export async function fetchOfficialFeed(): Promise<FeedMatch[] | null> {
  if (cachedFeed && Date.now() - cachedFeed.at < FEED_CACHE_MS) return cachedFeed.data;
  try {
    const res = await fetch(FEED_URL, {
      headers: {
        // The feed 403s default fetch UAs; a browser UA is fine.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as FeedMatch[];
    if (!Array.isArray(data) || data.length < 100) return null; // sanity: full tournament
    cachedFeed = { at: Date.now(), data };
    return data;
  } catch {
    return null;
  }
}
