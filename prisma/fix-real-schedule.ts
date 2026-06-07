/**
 * Fix all 72 group stage match dates, times, and cities
 * using the real FIFA World Cup 2026 schedule.
 *
 * Source: NBC Sports (ET times) cross-checked with Sky Sports (BST times)
 * All times stored as UTC. Display converts to Australia/Melbourne.
 * Run: npx tsx prisma/fix-real-schedule.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Entry = { teams: [string, string]; utc: string; city: string; country: string };

// EDT = UTC-4  →  ET time + 4h = UTC
// Verified against Sky Sports BST times (BST = UTC+1)
const SCHEDULE: Entry[] = [
  // ── Group A ──────────────────────────────────────────────────────────────
  { teams: ["Mexico", "South Africa"],         utc: "2026-06-11T19:00:00Z", city: "Mexico City",    country: "Mexico"  }, // 3pm ET
  { teams: ["Korea Republic", "Czechia"],      utc: "2026-06-12T02:00:00Z", city: "Guadalajara",    country: "Mexico"  }, // 10pm ET Jun 11
  { teams: ["Czechia", "South Africa"],        utc: "2026-06-18T16:00:00Z", city: "Atlanta",         country: "USA"     }, // 12pm ET
  { teams: ["Mexico", "Korea Republic"],       utc: "2026-06-19T01:00:00Z", city: "Guadalajara",    country: "Mexico"  }, // 9pm ET Jun 18
  { teams: ["Czechia", "Mexico"],              utc: "2026-06-25T01:00:00Z", city: "Mexico City",    country: "Mexico"  }, // 9pm ET Jun 24
  { teams: ["South Africa", "Korea Republic"], utc: "2026-06-25T01:00:00Z", city: "Monterrey",      country: "Mexico"  }, // 9pm ET Jun 24
  // ── Group B ──────────────────────────────────────────────────────────────
  { teams: ["Canada", "Bosnia and Herzegovina"],          utc: "2026-06-12T19:00:00Z", city: "Toronto",      country: "Canada"  }, // 3pm ET
  { teams: ["Qatar", "Switzerland"],                      utc: "2026-06-13T19:00:00Z", city: "Santa Clara",  country: "USA"     }, // 3pm ET
  { teams: ["Switzerland", "Bosnia and Herzegovina"],     utc: "2026-06-18T19:00:00Z", city: "Los Angeles",  country: "USA"     }, // 3pm ET
  { teams: ["Canada", "Qatar"],                           utc: "2026-06-18T22:00:00Z", city: "Vancouver",    country: "Canada"  }, // 6pm ET
  { teams: ["Switzerland", "Canada"],                     utc: "2026-06-24T19:00:00Z", city: "Vancouver",    country: "Canada"  }, // 3pm ET
  { teams: ["Bosnia and Herzegovina", "Qatar"],           utc: "2026-06-24T19:00:00Z", city: "Seattle",      country: "USA"     }, // 3pm ET
  // ── Group C ──────────────────────────────────────────────────────────────
  { teams: ["Brazil", "Morocco"],   utc: "2026-06-13T22:00:00Z", city: "East Rutherford", country: "USA" }, // 6pm ET
  { teams: ["Haiti", "Scotland"],   utc: "2026-06-14T01:00:00Z", city: "Foxborough",      country: "USA" }, // 9pm ET Jun 13
  { teams: ["Scotland", "Morocco"], utc: "2026-06-19T22:00:00Z", city: "Foxborough",      country: "USA" }, // 6pm ET
  { teams: ["Brazil", "Haiti"],     utc: "2026-06-20T01:00:00Z", city: "Philadelphia",    country: "USA" }, // 9pm ET Jun 19
  { teams: ["Scotland", "Brazil"],  utc: "2026-06-24T22:00:00Z", city: "Miami Gardens",   country: "USA" }, // 6pm ET
  { teams: ["Morocco", "Haiti"],    utc: "2026-06-24T22:00:00Z", city: "Atlanta",          country: "USA" }, // 6pm ET
  // ── Group D ──────────────────────────────────────────────────────────────
  { teams: ["United States", "Paraguay"], utc: "2026-06-13T01:00:00Z", city: "Inglewood",   country: "USA"    }, // 9pm ET Jun 12
  { teams: ["Australia", "Türkiye"],      utc: "2026-06-14T04:00:00Z", city: "Vancouver",   country: "Canada" }, // midnight ET Jun 13
  { teams: ["United States", "Australia"],utc: "2026-06-19T19:00:00Z", city: "Seattle",     country: "USA"    }, // 3pm ET ← user-verified
  { teams: ["Türkiye", "Paraguay"],       utc: "2026-06-20T04:00:00Z", city: "Santa Clara", country: "USA"    }, // midnight ET Jun 19
  { teams: ["Türkiye", "United States"],  utc: "2026-06-26T02:00:00Z", city: "Inglewood",   country: "USA"    }, // 10pm ET Jun 25
  { teams: ["Paraguay", "Australia"],     utc: "2026-06-26T02:00:00Z", city: "Santa Clara", country: "USA"    }, // 10pm ET Jun 25
  // ── Group E ──────────────────────────────────────────────────────────────
  { teams: ["Germany", "Curaçao"],     utc: "2026-06-14T17:00:00Z", city: "Houston",         country: "USA"    }, // 1pm ET
  { teams: ["Ivory Coast", "Ecuador"], utc: "2026-06-14T23:00:00Z", city: "Philadelphia",    country: "USA"    }, // 7pm ET
  { teams: ["Germany", "Ivory Coast"], utc: "2026-06-20T20:00:00Z", city: "Toronto",         country: "Canada" }, // 4pm ET
  { teams: ["Ecuador", "Curaçao"],     utc: "2026-06-21T00:00:00Z", city: "Kansas City",     country: "USA"    }, // 8pm ET Jun 20
  { teams: ["Ecuador", "Germany"],     utc: "2026-06-25T20:00:00Z", city: "East Rutherford", country: "USA"    }, // 4pm ET
  { teams: ["Curaçao", "Ivory Coast"], utc: "2026-06-25T20:00:00Z", city: "Philadelphia",    country: "USA"    }, // 4pm ET
  // ── Group F ──────────────────────────────────────────────────────────────
  { teams: ["Netherlands", "Japan"],  utc: "2026-06-14T20:00:00Z", city: "Arlington",    country: "USA"    }, // 4pm ET
  { teams: ["Sweden", "Tunisia"],     utc: "2026-06-15T02:00:00Z", city: "Monterrey",    country: "Mexico" }, // 10pm ET Jun 14
  { teams: ["Netherlands", "Sweden"], utc: "2026-06-20T17:00:00Z", city: "Houston",      country: "USA"    }, // 1pm ET
  { teams: ["Tunisia", "Japan"],      utc: "2026-06-21T04:00:00Z", city: "Monterrey",    country: "Mexico" }, // midnight ET Jun 20
  { teams: ["Japan", "Sweden"],       utc: "2026-06-25T23:00:00Z", city: "Arlington",    country: "USA"    }, // 7pm ET
  { teams: ["Tunisia", "Netherlands"],utc: "2026-06-25T23:00:00Z", city: "Kansas City",  country: "USA"    }, // 7pm ET
  // ── Group G ──────────────────────────────────────────────────────────────
  { teams: ["Belgium", "Egypt"],       utc: "2026-06-15T19:00:00Z", city: "Seattle",    country: "USA"    }, // 3pm ET
  { teams: ["Iran", "New Zealand"],    utc: "2026-06-16T01:00:00Z", city: "Inglewood",  country: "USA"    }, // 9pm ET Jun 15
  { teams: ["Belgium", "Iran"],        utc: "2026-06-21T19:00:00Z", city: "Inglewood",  country: "USA"    }, // 3pm ET
  { teams: ["New Zealand", "Egypt"],   utc: "2026-06-22T01:00:00Z", city: "Vancouver",  country: "Canada" }, // 9pm ET Jun 21
  { teams: ["Egypt", "Iran"],          utc: "2026-06-27T03:00:00Z", city: "Seattle",    country: "USA"    }, // 11pm ET Jun 26
  { teams: ["New Zealand", "Belgium"], utc: "2026-06-27T03:00:00Z", city: "Vancouver",  country: "Canada" }, // 11pm ET Jun 26
  // ── Group H ──────────────────────────────────────────────────────────────
  { teams: ["Spain", "Cape Verde"],     utc: "2026-06-15T16:00:00Z", city: "Atlanta",       country: "USA"    }, // 12pm ET
  { teams: ["Saudi Arabia", "Uruguay"], utc: "2026-06-15T22:00:00Z", city: "Miami Gardens", country: "USA"    }, // 6pm ET
  { teams: ["Spain", "Saudi Arabia"],   utc: "2026-06-21T16:00:00Z", city: "Atlanta",       country: "USA"    }, // 12pm ET
  { teams: ["Uruguay", "Cape Verde"],   utc: "2026-06-21T22:00:00Z", city: "Miami Gardens", country: "USA"    }, // 6pm ET
  { teams: ["Cape Verde", "Saudi Arabia"],utc: "2026-06-27T00:00:00Z", city: "Houston",     country: "USA"    }, // 8pm ET Jun 26
  { teams: ["Uruguay", "Spain"],        utc: "2026-06-27T00:00:00Z", city: "Guadalajara",  country: "Mexico" }, // 8pm ET Jun 26
  // ── Group I ──────────────────────────────────────────────────────────────
  { teams: ["France", "Senegal"], utc: "2026-06-16T19:00:00Z", city: "East Rutherford", country: "USA"    }, // 3pm ET
  { teams: ["Iraq", "Norway"],    utc: "2026-06-16T22:00:00Z", city: "Foxborough",      country: "USA"    }, // 6pm ET
  { teams: ["France", "Iraq"],    utc: "2026-06-22T21:00:00Z", city: "Philadelphia",    country: "USA"    }, // 5pm ET
  { teams: ["Norway", "Senegal"], utc: "2026-06-23T00:00:00Z", city: "East Rutherford", country: "USA"    }, // 8pm ET Jun 22
  { teams: ["Norway", "France"],  utc: "2026-06-26T19:00:00Z", city: "Foxborough",      country: "USA"    }, // 3pm ET
  { teams: ["Senegal", "Iraq"],   utc: "2026-06-26T19:00:00Z", city: "Toronto",         country: "Canada" }, // 3pm ET
  // ── Group J ──────────────────────────────────────────────────────────────
  { teams: ["Argentina", "Algeria"], utc: "2026-06-17T01:00:00Z", city: "Kansas City", country: "USA" }, // 9pm ET Jun 16
  { teams: ["Austria", "Jordan"],    utc: "2026-06-17T04:00:00Z", city: "Santa Clara", country: "USA" }, // midnight ET Jun 16
  { teams: ["Argentina", "Austria"], utc: "2026-06-22T17:00:00Z", city: "Arlington",   country: "USA" }, // 1pm ET
  { teams: ["Jordan", "Algeria"],    utc: "2026-06-23T03:00:00Z", city: "Santa Clara", country: "USA" }, // 11pm ET Jun 22
  { teams: ["Algeria", "Austria"],   utc: "2026-06-28T02:00:00Z", city: "Kansas City", country: "USA" }, // 10pm ET Jun 27
  { teams: ["Jordan", "Argentina"],  utc: "2026-06-28T02:00:00Z", city: "Arlington",   country: "USA" }, // 10pm ET Jun 27
  // ── Group K ──────────────────────────────────────────────────────────────
  { teams: ["Portugal", "DR Congo"],   utc: "2026-06-17T17:00:00Z", city: "Houston",       country: "USA"    }, // 1pm ET
  { teams: ["Uzbekistan", "Colombia"], utc: "2026-06-18T02:00:00Z", city: "Mexico City",   country: "Mexico" }, // 10pm ET Jun 17
  { teams: ["Portugal", "Uzbekistan"], utc: "2026-06-23T17:00:00Z", city: "Houston",       country: "USA"    }, // 1pm ET
  { teams: ["Colombia", "DR Congo"],   utc: "2026-06-24T02:00:00Z", city: "Guadalajara",   country: "Mexico" }, // 10pm ET Jun 23
  { teams: ["Colombia", "Portugal"],   utc: "2026-06-27T23:30:00Z", city: "Miami Gardens", country: "USA"    }, // 7:30pm ET
  { teams: ["DR Congo", "Uzbekistan"], utc: "2026-06-27T23:30:00Z", city: "Atlanta",        country: "USA"    }, // 7:30pm ET
  // ── Group L ──────────────────────────────────────────────────────────────
  { teams: ["England", "Croatia"], utc: "2026-06-17T20:00:00Z", city: "Arlington",       country: "USA"    }, // 4pm ET
  { teams: ["Ghana", "Panama"],    utc: "2026-06-17T23:00:00Z", city: "Toronto",         country: "Canada" }, // 7pm ET
  { teams: ["England", "Ghana"],   utc: "2026-06-23T20:00:00Z", city: "Foxborough",      country: "USA"    }, // 4pm ET
  { teams: ["Panama", "Croatia"],  utc: "2026-06-23T23:00:00Z", city: "Toronto",         country: "Canada" }, // 7pm ET
  { teams: ["Panama", "England"],  utc: "2026-06-27T21:00:00Z", city: "East Rutherford", country: "USA"    }, // 5pm ET
  { teams: ["Croatia", "Ghana"],   utc: "2026-06-27T21:00:00Z", city: "Philadelphia",    country: "USA"    }, // 5pm ET
];

async function main() {
  const dbMatches = await prisma.match.findMany({
    where: { stage: "group" },
    include: { homeTeam: true, awayTeam: true },
  });

  console.log(`Found ${dbMatches.length} group-stage matches in DB\n`);

  let updated = 0;
  let notFound = 0;

  for (const entry of SCHEDULE) {
    const [a, b] = entry.teams;

    const match = dbMatches.find((m) => {
      const h = m.homeTeam?.name ?? "";
      const aw = m.awayTeam?.name ?? "";
      return (h === a && aw === b) || (h === b && aw === a);
    });

    if (!match) {
      console.error(`  NOT FOUND: ${a} vs ${b}`);
      notFound++;
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { date: new Date(entry.utc), city: entry.city, country: entry.country },
    });

    const aest = new Date(entry.utc).toLocaleString("en-AU", {
      timeZone: "Australia/Melbourne",
      weekday: "short", day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    console.log(`✓ ${a.padEnd(24)} vs ${b.padEnd(24)} → ${aest} AEST  (${entry.city})`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
