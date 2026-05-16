import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const teams = [
  // Group A
  { name: "Mexico", code: "MEX", flagEmoji: "🇲🇽", group: "A" },
  { name: "South Africa", code: "RSA", flagEmoji: "🇿🇦", group: "A" },
  { name: "Korea Republic", code: "KOR", flagEmoji: "🇰🇷", group: "A" },
  { name: "Czechia", code: "CZE", flagEmoji: "🇨🇿", group: "A" },
  // Group B
  { name: "Canada", code: "CAN", flagEmoji: "🇨🇦", group: "B" },
  { name: "Bosnia and Herzegovina", code: "BIH", flagEmoji: "🇧🇦", group: "B" },
  { name: "Qatar", code: "QAT", flagEmoji: "🇶🇦", group: "B" },
  { name: "Switzerland", code: "SUI", flagEmoji: "🇨🇭", group: "B" },
  // Group C
  { name: "Brazil", code: "BRA", flagEmoji: "🇧🇷", group: "C" },
  { name: "Morocco", code: "MAR", flagEmoji: "🇲🇦", group: "C" },
  { name: "Haiti", code: "HAI", flagEmoji: "🇭🇹", group: "C" },
  { name: "Scotland", code: "SCO", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C" },
  // Group D
  { name: "United States", code: "USA", flagEmoji: "🇺🇸", group: "D" },
  { name: "Paraguay", code: "PAR", flagEmoji: "🇵🇾", group: "D" },
  { name: "Australia", code: "AUS", flagEmoji: "🇦🇺", group: "D" },
  { name: "Türkiye", code: "TUR", flagEmoji: "🇹🇷", group: "D" },
  // Group E
  { name: "Germany", code: "GER", flagEmoji: "🇩🇪", group: "E" },
  { name: "Curaçao", code: "CUW", flagEmoji: "🏝️", group: "E" },
  { name: "Ivory Coast", code: "CIV", flagEmoji: "🇨🇮", group: "E" },
  { name: "Ecuador", code: "ECU", flagEmoji: "🇪🇨", group: "E" },
  // Group F
  { name: "Netherlands", code: "NED", flagEmoji: "🇳🇱", group: "F" },
  { name: "Japan", code: "JPN", flagEmoji: "🇯🇵", group: "F" },
  { name: "Sweden", code: "SWE", flagEmoji: "🇸🇪", group: "F" },
  { name: "Tunisia", code: "TUN", flagEmoji: "🇹🇳", group: "F" },
  // Group G
  { name: "Belgium", code: "BEL", flagEmoji: "🇧🇪", group: "G" },
  { name: "Egypt", code: "EGY", flagEmoji: "🇪🇬", group: "G" },
  { name: "Iran", code: "IRN", flagEmoji: "🇮🇷", group: "G" },
  { name: "New Zealand", code: "NZL", flagEmoji: "🇳🇿", group: "G" },
  // Group H
  { name: "Spain", code: "ESP", flagEmoji: "🇪🇸", group: "H" },
  { name: "Cape Verde", code: "CPV", flagEmoji: "🇨🇻", group: "H" },
  { name: "Saudi Arabia", code: "KSA", flagEmoji: "🇸🇦", group: "H" },
  { name: "Uruguay", code: "URU", flagEmoji: "🇺🇾", group: "H" },
  // Group I
  { name: "France", code: "FRA", flagEmoji: "🇫🇷", group: "I" },
  { name: "Senegal", code: "SEN", flagEmoji: "🇸🇳", group: "I" },
  { name: "Iraq", code: "IRQ", flagEmoji: "🇮🇶", group: "I" },
  { name: "Norway", code: "NOR", flagEmoji: "🇳🇴", group: "I" },
  // Group J
  { name: "Argentina", code: "ARG", flagEmoji: "🇦🇷", group: "J" },
  { name: "Algeria", code: "ALG", flagEmoji: "🇩🇿", group: "J" },
  { name: "Austria", code: "AUT", flagEmoji: "🇦🇹", group: "J" },
  { name: "Jordan", code: "JOR", flagEmoji: "🇯🇴", group: "J" },
  // Group K
  { name: "Portugal", code: "POR", flagEmoji: "🇵🇹", group: "K" },
  { name: "DR Congo", code: "COD", flagEmoji: "🇨🇩", group: "K" },
  { name: "Uzbekistan", code: "UZB", flagEmoji: "🇺🇿", group: "K" },
  { name: "Colombia", code: "COL", flagEmoji: "🇨🇴", group: "K" },
  // Group L
  { name: "England", code: "ENG", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L" },
  { name: "Croatia", code: "CRO", flagEmoji: "🇭🇷", group: "L" },
  { name: "Ghana", code: "GHA", flagEmoji: "🇬🇭", group: "L" },
  { name: "Panama", code: "PAN", flagEmoji: "🇵🇦", group: "L" },
];

// Groups in order A-L
const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// Schedule: distribute 72 matches across June 11-27, 2026 (17 days)
// ~4 matches per day. We have 12 groups × 6 matches = 72 matches.
// Round 1: matches 1-2 per group (24 matches) -> June 11-14 (6 days, 4/day)
// Round 2: matches 3-4 per group (24 matches) -> June 15-18 (6 days, 4/day)
// Round 3: matches 5-6 per group (24 matches) -> June 22-25 (4 days, 6/day)

function getMatchDate(matchIndex: number): Date {
  // matchIndex 0-71
  const round1Dates = [
    "2026-06-11", "2026-06-11", "2026-06-11", "2026-06-11",
    "2026-06-12", "2026-06-12", "2026-06-12", "2026-06-12",
    "2026-06-13", "2026-06-13", "2026-06-13", "2026-06-13",
    "2026-06-13", "2026-06-13", "2026-06-13", "2026-06-13",
    "2026-06-14", "2026-06-14", "2026-06-14", "2026-06-14",
    "2026-06-14", "2026-06-14", "2026-06-14", "2026-06-14",
  ];
  const round2Dates = [
    "2026-06-15", "2026-06-15", "2026-06-15", "2026-06-15",
    "2026-06-16", "2026-06-16", "2026-06-16", "2026-06-16",
    "2026-06-17", "2026-06-17", "2026-06-17", "2026-06-17",
    "2026-06-17", "2026-06-17", "2026-06-17", "2026-06-17",
    "2026-06-18", "2026-06-18", "2026-06-18", "2026-06-18",
    "2026-06-18", "2026-06-18", "2026-06-18", "2026-06-18",
  ];
  const round3Dates = [
    "2026-06-22", "2026-06-22", "2026-06-22", "2026-06-22", "2026-06-22", "2026-06-22",
    "2026-06-23", "2026-06-23", "2026-06-23", "2026-06-23", "2026-06-23", "2026-06-23",
    "2026-06-24", "2026-06-24", "2026-06-24", "2026-06-24", "2026-06-24", "2026-06-24",
    "2026-06-25", "2026-06-25", "2026-06-25", "2026-06-25", "2026-06-25", "2026-06-25",
  ];

  const times = ["15:00", "18:00", "21:00", "00:00"];

  let dateStr: string;
  let timeIndex: number;

  if (matchIndex < 24) {
    dateStr = round1Dates[matchIndex];
    timeIndex = matchIndex % 4;
  } else if (matchIndex < 48) {
    dateStr = round2Dates[matchIndex - 24];
    timeIndex = (matchIndex - 24) % 4;
  } else {
    dateStr = round3Dates[matchIndex - 48];
    timeIndex = (matchIndex - 48) % 4;
  }

  return new Date(`${dateStr}T${times[timeIndex]}:00Z`);
}

async function main() {
  console.log("Seeding database...");

  // Upsert all teams
  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      create: team,
      update: team,
    });
  }
  console.log(`Seeded ${teams.length} teams`);

  // Fetch all teams from DB
  const dbTeams = await prisma.team.findMany();
  const teamByCode = Object.fromEntries(dbTeams.map((t) => [t.code, t]));

  let matchNumber = 1;
  let matchIndex = 0;

  for (const group of groups) {
    const groupTeams = teams.filter((t) => t.group === group);
    const [t1, t2, t3, t4] = groupTeams.map((t) => teamByCode[t.code]);

    // 6 matches per group
    const groupMatches = [
      // Match day 1
      { home: t1, away: t2 },
      { home: t3, away: t4 },
      // Match day 2
      { home: t1, away: t3 },
      { home: t2, away: t4 },
      // Match day 3
      { home: t1, away: t4 },
      { home: t2, away: t3 },
    ];

    for (const m of groupMatches) {
      await prisma.match.upsert({
        where: { matchNumber },
        create: {
          matchNumber,
          stage: "group",
          homeTeamId: m.home.id,
          awayTeamId: m.away.id,
          date: getMatchDate(matchIndex),
          venue: "Stadium TBC",
        },
        update: {
          homeTeamId: m.home.id,
          awayTeamId: m.away.id,
          date: getMatchDate(matchIndex),
          venue: "Stadium TBC",
        },
      });
      matchNumber++;
      matchIndex++;
    }
  }

  console.log(`Seeded ${matchNumber - 1} matches`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
