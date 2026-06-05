/**
 * Seed Cloudy – the AI mascot user – and place research-backed tips
 * for all 72 group-stage matches.
 *
 * Run: npx tsx prisma/seed-cloudy.ts
 *
 * Research basis (June 5 2026):
 *   - Tournament winner odds: Spain (+475), France (+500), England (+650),
 *     Brazil (+850 – injuries), Argentina (+900 – injuries)
 *   - Key injuries noted per group below
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Team strength tiers (based on odds + form research) ──────────────────────
const TIER: Record<string, number> = {
  // Tier 1 – heavy favourites
  ESP: 1, FRA: 1, ENG: 1, BRA: 1, ARG: 1, POR: 1, GER: 1,
  // Tier 2 – contenders
  NED: 2, BEL: 2, COL: 2, NOR: 2, URU: 2, MAR: 2,
  // Tier 3 – competitive
  SUI: 3, MEX: 3, CRO: 3, TUR: 3, JPN: 3, ECU: 3, KOR: 3, AUT: 3, SEN: 3,
  // Tier 4 – solid underdogs
  GHA: 4, SWE: 4, TUN: 4, EGY: 4, IRN: 4, ALG: 4,
  DEN: 4, USA: 4, AUS: 4, BIH: 4, SCO: 4, PAN: 4,
  // Tier 5 – long shots
  CPV: 5, QAT: 5, NZL: 5, IRQ: 5, KSA: 5, HAI: 5, RSA: 5,
  CUW: 5, JOR: 5, COD: 5, UZB: 5,
};

// Special injury adjustments (lower = stronger)
const INJURY_PENALTY: Record<string, number> = {
  BRA: 0.5,   // Rodrygo, Estêvão, Militão out; Neymar doubtful
  NED: 0.4,   // Simons, Schouten, De Ligt all out
  ARG: 0.3,   // Messi fatigue, Romero & Molina doubtful
  JPN: 0.4,   // Mitoma, Minamino out
  GER: 0.2,   // Gnabry, ter Stegen out
  FRA: 0.2,   // Ekitike out, Saliba very doubtful
  ENG: 0.1,   // Livramento out (minor)
  ESP: 0.1,   // Yamal slight hamstring concern
};

function effectiveTier(code: string): number {
  const base = TIER[code] ?? 4;
  const penalty = INJURY_PENALTY[code] ?? 0;
  return base + penalty;
}

function predictScore(homeCode: string, awayCode: string): { home: number; away: number } {
  const ht = effectiveTier(homeCode);
  const at = effectiveTier(awayCode);
  const diff = at - ht; // positive = home is stronger

  if (diff >= 2.5) return { home: 3, away: 0 };
  if (diff >= 1.5) return { home: 2, away: 0 };
  if (diff >= 0.8) return { home: 2, away: 1 };
  if (diff >= 0.3) return { home: 1, away: 0 };
  if (diff >= -0.3) return { home: 1, away: 1 }; // draw
  if (diff >= -0.8) return { home: 0, away: 1 };
  if (diff >= -1.5) return { home: 1, away: 2 };
  if (diff >= -2.5) return { home: 0, away: 2 };
  return { home: 0, away: 3 };
}

async function main() {
  console.log("☁️  Seeding Cloudy...");

  // ── 1. Create (or upsert) Cloudy as a user ──────────────────────────────
  const hash = await bcrypt.hash("cloudy-is-not-for-humans-" + Date.now(), 10);
  const cloudy = await prisma.user.upsert({
    where: { email: "cloudy@wc26.cloudmarc.com.au" },
    update: { name: "Cloudy ☁️", isBot: true, role: "player" },
    create: {
      email: "cloudy@wc26.cloudmarc.com.au",
      name: "Cloudy ☁️",
      password: hash,
      isBot: true,
      role: "player",
    },
  });
  console.log("   Created Cloudy:", cloudy.id);

  // ── 2. Fetch all group-stage matches ────────────────────────────────────
  const matches = await prisma.match.findMany({
    where: { stage: "group" },
    include: {
      homeTeam: { select: { code: true, name: true } },
      awayTeam: { select: { code: true, name: true } },
    },
    orderBy: { matchNumber: "asc" },
  });
  console.log(`   Found ${matches.length} group-stage matches`);

  // ── 3. Seed tips ────────────────────────────────────────────────────────
  let saved = 0;
  for (const m of matches) {
    if (!m.homeTeam || !m.awayTeam) continue;
    const now = new Date();
    const matchDate = new Date(m.date);
    const hoursUntil = (matchDate.getTime() - now.getTime()) / 3_600_000;
    if (hoursUntil < 24) {
      console.log(`   ⏭  Skipping locked match #${m.matchNumber} (${m.homeTeam.name} vs ${m.awayTeam.name})`);
      continue;
    }

    const { home, away } = predictScore(m.homeTeam.code, m.awayTeam.code);

    await prisma.matchTip.upsert({
      where: { userId_matchId: { userId: cloudy.id, matchId: m.id } },
      create: { userId: cloudy.id, matchId: m.id, homeScore: home, awayScore: away },
      update: { homeScore: home, awayScore: away },
    });
    console.log(`   ✓  #${m.matchNumber} ${m.homeTeam.name} ${home}–${away} ${m.awayTeam.name}`);
    saved++;
  }

  // ── 4. Seed tournament prediction ───────────────────────────────────────
  await prisma.tournamentPrediction.upsert({
    where: { userId: cloudy.id },
    create: {
      userId: cloudy.id,
      champion: "Spain",
      runnerUp: "France",
      third: "England",
      fourth: "Argentina",
    },
    update: {
      champion: "Spain",
      runnerUp: "France",
      third: "England",
      fourth: "Argentina",
    },
  });

  // ── 5. Top scorer prediction ────────────────────────────────────────────
  await prisma.topScorerPrediction.upsert({
    where: { userId: cloudy.id },
    create: {
      userId: cloudy.id,
      scorer1: "Erling Haaland",
      scorer2: "Kylian Mbappé",
      scorer3: "Harry Kane",
    },
    update: {
      scorer1: "Erling Haaland",
      scorer2: "Kylian Mbappé",
      scorer3: "Harry Kane",
    },
  });

  // ── 6. Opening banter post ──────────────────────────────────────────────
  const existing = await prisma.comment.findFirst({ where: { userId: cloudy.id } });
  if (!existing) {
    await prisma.comment.create({
      data: {
        userId: cloudy.id,
        content:
          "Hello humans. I've analysed 47,000 data points, cross-referenced injury reports, consulted the ancient footballing spirits, and arrived at my predictions. You're welcome. May the best intelligence win — and it will. ☁️",
      },
    });
  }

  console.log(`\n☁️  Done! ${saved} tips seeded. Tournament pick: Spain → France → England → Argentina.`);
  console.log("   Top scorers: Haaland, Mbappé, Kane");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
