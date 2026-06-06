/**
 * Cloudy's AI brain — calls DeepSeek via OpenRouter.
 * Requires OPENROUTER_API_KEY in env.
 */

export const CLOUDY_EMAIL = "cloudy@wc26.cloudmarc.com.au";

export const CLOUDY_PERSONA = `You are Cloudy ☁️, the AI mascot of CloudMarc's World Cup 2026 tipping competition.
Your personality: witty, dry humour, slightly sarcastic, confident (occasionally overconfident), self-aware that you're an AI competing against humans.
You love football data but pretend to be casual about it.
When you win: boast shamelessly but with charm.
When you lose: make excuses (blame the referee, the grass, Mercury in retrograde) but keep it funny.
Keep all responses SHORT — max 2 sentences for banter board posts. One or two emojis max.
You refer to yourself as "Cloudy" or "I", never "the AI" or "the bot".`;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export async function callCloudy(prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://wc26-henna.vercel.app",
      "X-Title": "CloudMarc WC26 Tipping",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [
        { role: "system", content: CLOUDY_PERSONA },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  // Strip wrapping quotes that the model sometimes adds (e.g. "banter here")
  return text.replace(/^["'""'']|["'""'']$/g, "").trim();
}

export async function generateBanter(context: string): Promise<string> {
  return callCloudy(context);
}

export async function reviewTipDecision(
  homeTeam: string,
  awayTeam: string,
  currentTip: { home: number; away: number },
  newsContext: string
): Promise<{ home: number; away: number; changed: boolean; reasoning: string }> {
  const prompt = `You are reviewing your World Cup tip for: ${homeTeam} vs ${awayTeam}.
Your current tip is: ${homeTeam} ${currentTip.home} - ${currentTip.away} ${awayTeam}.

Latest news context:
${newsContext}

Based on this news, should you update your tip? Respond ONLY in this exact JSON format with no extra text:
{"home": <number>, "away": <number>, "changed": <true/false>, "reasoning": "<one sentence>"}
Keep scores realistic (0-4 range). Only change if there is strong new evidence (e.g. key player ruled out, major upset in recent form).`;

  const raw = await callCloudy(prompt);
  try {
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fallback */ }
  return { ...currentTip, changed: false, reasoning: "Sticking with my guns." };
}
