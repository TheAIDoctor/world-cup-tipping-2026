/**
 * One-shot migration: fix group-stage match dates.
 *
 * Root causes fixed:
 *  1. "00:00" time was placed on the SAME UTC date as "15:00"/"18:00"/"21:00",
 *     making it chronologically *before* those games (midnight < 15:00).
 *     Fixed: "00:00" now goes on the NEXT UTC day.
 *  2. All 6 matches of a group (3 matchdays) were crammed into the same
 *     24-slot window, putting MD1 and MD2 on the same UTC date for later
 *     groups (e.g. Brazil played twice on the same Melbourne day).
 *     Fixed: MD1 → June 11-14, MD2 → June 17-20, MD3 → June 23-26.
 *
 * Schedule layout (Melbourne AEST = UTC+10):
 *   Each UTC day hosts 3 groups = 6 matches:
 *     1:00 AM, 4:00 AM, 7:00 AM, 10:00 AM, 1:00 PM, 4:00 PM AEST
 *   MD3: both games in a group are simultaneous (same kickoff time).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 12 groups in draw order
const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// Base UTC dates for the three matchday windows (4 days × 3 groups/day = 12 groups)
const MD1_BASES = ["2026-06-11","2026-06-12","2026-06-13","2026-06-14"];
const MD2_BASES = ["2026-06-17","2026-06-18","2026-06-19","2026-06-20"];
const MD3_BASES = ["2026-06-23","2026-06-24","2026-06-25","2026-06-26"];

// 6 time slots per day (3 groups × 2 games).
// Slots 3-5 go on baseDate+1 so midnight is chronologically AFTER the 21:00 game.
const DAY_SLOTS: Array<{ dayOffset: number; time: string }> = [
  { dayOffset: 0, time: "T15:00:00Z" },  // → 1:00 AM Melbourne next day
  { dayOffset: 0, time: "T18:00:00Z" },  // → 4:00 AM
  { dayOffset: 0, time: "T21:00:00Z" },  // → 7:00 AM
  { dayOffset: 1, time: "T00:00:00Z" },  // → 10:00 AM
  { dayOffset: 1, time: "T03:00:00Z" },  // → 1:00 PM
  { dayOffset: 1, time: "T06:00:00Z" },  // → 4:00 PM
];

// MD3: 3 simultaneous-kickoff slots per day (both group games at the same time)
const MD3_SLOTS: Array<{ time: string }> = [
  { time: "T15:00:00Z" },  // Group 0-of-day → 1:00 AM Melbourne
  { time: "T19:00:00Z" },  // Group 1-of-day → 5:00 AM
  { time: "T23:00:00Z" },  // Group 2-of-day → 9:00 AM
];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function computeDate(gIdx: number, pos: number): Date {
  // gIdx: 0-11 (groups A-L)
  // pos:  0-5 within the group (0-1 = MD1, 2-3 = MD2, 4-5 = MD3)
  const dayIdx   = Math.floor(gIdx / 3); // 0-3
  const groupPos = gIdx % 3;             // 0-2 (slot within the day)

  if (pos < 2) {
    // ── Matchday 1 ──────────────────────────────────────────────────────────
    const slotIdx = groupPos * 2 + pos;  // 0-5
    const { dayOffset, time } = DAY_SLOTS[slotIdx];
    const base = addDays(MD1_BASES[dayIdx], dayOffset);
    return new Date(base + time);
  } else if (pos < 4) {
    // ── Matchday 2 ──────────────────────────────────────────────────────────
    const slotIdx = groupPos * 2 + (pos - 2);
    const { dayOffset, time } = DAY_SLOTS[slotIdx];
    const base = addDays(MD2_BASES[dayIdx], dayOffset);
    return new Date(base + time);
  } else {
    // ── Matchday 3 (simultaneous within group) ───────────────────────────────
    const { time } = MD3_SLOTS[groupPos];
    return new Date(MD3_BASES[dayIdx] + time);
  }
}

async function main() {
  console.log("Fixing group-stage match dates...\n");

  let updated = 0;

  for (let gIdx = 0; gIdx < 12; gIdx++) {
    const group = GROUPS[gIdx];
    for (let pos = 0; pos < 6; pos++) {
      const matchNumber = gIdx * 6 + pos + 1;
      const newDate = computeDate(gIdx, pos);
      const melb = newDate.toLocaleString("en-AU", {
        timeZone: "Australia/Melbourne",
        month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      });
      await prisma.match.update({
        where: { matchNumber },
        data: { date: newDate },
      });
      console.log(`Group ${group} match #${matchNumber} (pos ${pos}) → ${newDate.toISOString()} (Melbourne: ${melb})`);
      updated++;
    }
  }

  console.log(`\n✓ Updated ${updated} group-stage matches.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
