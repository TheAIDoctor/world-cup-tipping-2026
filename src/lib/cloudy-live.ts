/**
 * Real-time match data for Cloudy, fetched via Perplexity/Sonar through
 * OpenRouter. Called during live fixtures so Cloudy can comment on actual
 * goals, cards, and incidents rather than generic football banter.
 */

import type { LiveMatch } from "@/lib/cloudy-schedule";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Fetches the current score + key events for one or more live matches.
 * Returns a formatted string ready to be injected into a Cloudy prompt,
 * or an empty string if the fetch fails or the API key is missing.
 */
export async function fetchLiveMatchInfo(matches: LiveMatch[]): Promise<string> {
  if (matches.length === 0) return "";
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return "";

  const matchList = matches
    .map((m) => `${m.homeTeam} vs ${m.awayTeam}`)
    .join(", ");

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
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `FIFA World Cup 2026 — live match update right now.\n` +
              `Matches in progress: ${matchList}.\n` +
              `For each match give: current score, goalscorers with minute played, ` +
              `any red cards or major incidents. If a match hasn't kicked off yet say so. ` +
              `Bullet points only, max 4 bullets per match, be factual and up to the minute.`,
          },
        ],
      }),
    });

    if (!res.ok) return "";
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}
