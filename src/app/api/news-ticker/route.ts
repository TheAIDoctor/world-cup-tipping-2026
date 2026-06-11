import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MELBOURNE_TZ = "Australia/Melbourne";

/** Extract text between two XML tags (first occurrence). */
function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

/** Strip " - Source Name" suffix that Google News appends to titles. */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*-\s*[^-]{3,40}$/, "")   // strip trailing " - Source"
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function fetchGoogleNewsHeadlines(): Promise<string[]> {
  const queries = [
    "FIFA World Cup 2026 soccer",
    "World Cup 2026 injury transfer",
  ];

  const headlines: string[] = [];

  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; WC26TipperBot/1.0)" },
        next: { revalidate: 60 },
      });
      if (!res.ok) continue;
      const xml = await res.text();

      // Split into <item> blocks and extract titles
      const items = xml.split("<item>");
      items.shift(); // drop preamble
      for (const item of items.slice(0, 10)) {
        const raw = extractTag(item, "title");
        if (raw) {
          const clean = cleanTitle(raw);
          if (clean.length > 15 && !headlines.includes(clean)) {
            headlines.push(clean);
          }
        }
        if (headlines.length >= 15) break;
      }
    } catch {
      // network issue — skip this feed
    }
    if (headlines.length >= 15) break;
  }

  return headlines.slice(0, 15);
}

async function buildAppItems(): Promise<string[]> {
  const now = new Date();
  // Melbourne midnight → next midnight in UTC
  const melbDate = now.toLocaleString("sv-SE", { timeZone: MELBOURNE_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const dayStart = new Date(melbDate + "T00:00:00+10:00");
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const todayMatches = await prisma.match.findMany({
    where: { date: { gte: dayStart, lt: dayEnd } },
    orderBy: { date: "asc" },
    include: { homeTeam: true, awayTeam: true },
    take: 12,
  });

  const items: string[] = [];

  for (const m of todayMatches) {
    const time = m.date.toLocaleString("en-AU", { timeZone: MELBOURNE_TZ, hour: "numeric", minute: "2-digit", hour12: true });
    const home = m.homeTeam ? `${m.homeTeam.flagEmoji} ${m.homeTeam.name}` : "TBD";
    const away = m.awayTeam ? `${m.awayTeam.flagEmoji} ${m.awayTeam.name}` : "TBD";

    if (m.homeScore !== null && m.awayScore !== null) {
      // Result known
      items.push(`FT: ${home} ${m.homeScore}–${m.awayScore} ${away}`);
    } else {
      // Upcoming today
      items.push(`🕐 ${time} AEST — ${home} vs ${away}`);
    }
  }

  // Recent results (last 48 h, already played)
  const recentStart = new Date(now.getTime() - 48 * 3_600_000);
  const recentResults = await prisma.match.findMany({
    where: { date: { gte: recentStart, lt: dayStart }, homeScore: { not: null } },
    orderBy: { date: "desc" },
    include: { homeTeam: true, awayTeam: true },
    take: 6,
  });

  for (const m of recentResults) {
    if (m.homeScore === null || m.awayScore === null) continue;
    const home = m.homeTeam ? `${m.homeTeam.flagEmoji} ${m.homeTeam.name}` : "TBD";
    const away = m.awayTeam ? `${m.awayTeam.flagEmoji} ${m.awayTeam.name}` : "TBD";
    items.push(`Result: ${home} ${m.homeScore}–${m.awayScore} ${away}`);
  }

  return items;
}

export async function GET() {
  const [appItems, newsHeadlines] = await Promise.all([
    buildAppItems(),
    fetchGoogleNewsHeadlines(),
  ]);

  // App match items go first (most relevant), then real news
  const items = [...appItems, ...newsHeadlines];

  // Fallback if everything failed
  if (items.length === 0) {
    items.push(
      "⚽ FIFA World Cup 2026 — USA · Mexico · Canada",
      "🗓️ Group stage kicks off June 11, 2026",
      "🏆 48 teams · 104 matches · one champion",
    );
  }

  return NextResponse.json({ items });
}
