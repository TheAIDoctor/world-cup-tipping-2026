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

// The 16 host cities of FIFA World Cup 2026 with their assigned stadiums.
// Sources: FIFA official 2026 host city announcement (Jun 2022) and venue
// designations. The actual match-by-match venue map depends on the official
// 2026 fixture list; since the seeded groups (A–L) are placeholders that
// will be replaced by the real draw, we round-robin the venues across the
// 72 group-stage matches and 32 knockout matches.
//
// Conventional kickoff: match #1 is the host's (Mexico) opener at Estadio
// Azteca, and the Final (#104) is at MetLife Stadium — we reflect that in
// the rotation by listing Azteca first and pinning the Final explicitly.
const VENUES = [
  { city: "Mexico City", venue: "Estadio Azteca", country: "Mexico" },
  { city: "Inglewood, CA", venue: "SoFi Stadium", country: "USA" },
  { city: "Arlington, TX", venue: "AT&T Stadium", country: "USA" },
  { city: "Atlanta", venue: "Mercedes-Benz Stadium", country: "USA" },
  { city: "Houston", venue: "NRG Stadium", country: "USA" },
  { city: "Kansas City", venue: "Arrowhead Stadium", country: "USA" },
  { city: "Miami Gardens, FL", venue: "Hard Rock Stadium", country: "USA" },
  { city: "Philadelphia", venue: "Lincoln Financial Field", country: "USA" },
  { city: "Santa Clara, CA", venue: "Levi's Stadium", country: "USA" },
  { city: "Seattle", venue: "Lumen Field", country: "USA" },
  { city: "Foxborough, MA", venue: "Gillette Stadium", country: "USA" },
  { city: "East Rutherford, NJ", venue: "MetLife Stadium", country: "USA" },
  { city: "Guadalajara", venue: "Estadio Akron", country: "Mexico" },
  { city: "Monterrey", venue: "Estadio BBVA", country: "Mexico" },
  { city: "Toronto", venue: "BMO Field", country: "Canada" },
  { city: "Vancouver", venue: "BC Place", country: "Canada" },
] as const;

function venueForMatch(
  matchIndex: number
): { city: string; venue: string; country: string } {
  return VENUES[matchIndex % VENUES.length];
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
      const { city, venue, country } = venueForMatch(matchIndex);
      await prisma.match.upsert({
        where: { matchNumber },
        create: {
          matchNumber,
          stage: "group",
          homeTeamId: m.home.id,
          awayTeamId: m.away.id,
          date: getMatchDate(matchIndex),
          city,
          venue,
          country,
        },
        update: {
          homeTeamId: m.home.id,
          awayTeamId: m.away.id,
          date: getMatchDate(matchIndex),
          city,
          venue,
          country,
        },
      });
      matchNumber++;
      matchIndex++;
    }
  }

  console.log(`Seeded ${matchNumber - 1} group-stage matches`);

  // ----- Knockout stage -----
  // 2026 format: 32 teams (top 2 of each group + 8 best 3rd-place) → R32 (16) →
  // R16 (8) → QF (4) → SF (2) → 3rd-place playoff + Final.
  // We pre-seed all 32 knockout matches with TBD teams and lineage so the
  // admin only needs to assign teams; winners auto-advance on result save.
  //
  // Lineage convention:
  //   R32 match i (1..16) -> feeds R16 match ceil(i/2) — odd into "home", even into "away"
  //   R16 match i (1..8)  -> feeds QF  match ceil(i/2) — odd into "home", even into "away"
  //   QF  match i (1..4)  -> feeds SF  match ceil(i/2) — odd into "home", even into "away"
  //   SF  match i (1..2)  -> winner feeds Final (i=1 home, i=2 away);
  //                          loser feeds 3rd-place playoff (i=1 home, i=2 away)
  const knockoutSchedule = [
    // [stage, count, startMatchNumber, dates (one per match)]
    {
      stage: "R32",
      count: 16,
      startNumber: 73,
      dates: [
        "2026-06-27T15:00:00Z", "2026-06-27T18:00:00Z", "2026-06-27T21:00:00Z", "2026-06-28T00:00:00Z",
        "2026-06-28T15:00:00Z", "2026-06-28T18:00:00Z", "2026-06-28T21:00:00Z", "2026-06-29T00:00:00Z",
        "2026-06-29T18:00:00Z", "2026-06-29T21:00:00Z", "2026-06-30T00:00:00Z", "2026-06-30T03:00:00Z",
        "2026-07-01T18:00:00Z", "2026-07-01T21:00:00Z", "2026-07-02T00:00:00Z", "2026-07-02T03:00:00Z",
      ],
    },
    {
      stage: "R16",
      count: 8,
      startNumber: 89,
      dates: [
        "2026-07-04T18:00:00Z", "2026-07-04T21:00:00Z",
        "2026-07-05T18:00:00Z", "2026-07-05T21:00:00Z",
        "2026-07-06T18:00:00Z", "2026-07-06T21:00:00Z",
        "2026-07-07T18:00:00Z", "2026-07-07T21:00:00Z",
      ],
    },
    {
      stage: "QF",
      count: 4,
      startNumber: 97,
      dates: [
        "2026-07-09T20:00:00Z", "2026-07-09T23:00:00Z",
        "2026-07-11T20:00:00Z", "2026-07-11T23:00:00Z",
      ],
    },
    {
      stage: "SF",
      count: 2,
      startNumber: 101,
      dates: ["2026-07-14T23:00:00Z", "2026-07-15T23:00:00Z"],
    },
    {
      stage: "3P",
      count: 1,
      startNumber: 103,
      dates: ["2026-07-18T19:00:00Z"],
    },
    {
      stage: "F",
      count: 1,
      startNumber: 104,
      dates: ["2026-07-19T19:00:00Z"],
    },
  ];

  // Knockout venue pins for the marquee fixtures (per FIFA's announced
  // designations for 2026). Everything else continues the venue round-robin.
  const KNOCKOUT_VENUE_PINS: Record<
    number,
    { city: string; venue: string; country: string }
  > = {
    103: { city: "Miami Gardens, FL", venue: "Hard Rock Stadium", country: "USA" }, // 3rd-place playoff
    104: { city: "East Rutherford, NJ", venue: "MetLife Stadium", country: "USA" }, // Final
    101: { city: "Arlington, TX", venue: "AT&T Stadium", country: "USA" }, // SF 1
    102: { city: "Atlanta", venue: "Mercedes-Benz Stadium", country: "USA" }, // SF 2
  };

  // First pass: upsert all knockout matches without lineage so IDs exist.
  for (const round of knockoutSchedule) {
    for (let i = 0; i < round.count; i++) {
      const mn = round.startNumber + i;
      const { city, venue, country } =
        KNOCKOUT_VENUE_PINS[mn] ?? venueForMatch(mn - 1);
      await prisma.match.upsert({
        where: { matchNumber: mn },
        create: {
          matchNumber: mn,
          stage: round.stage,
          date: new Date(round.dates[i]),
          city,
          venue,
          country,
        },
        update: {
          stage: round.stage,
          date: new Date(round.dates[i]),
          city,
          venue,
          country,
        },
      });
    }
  }

  // Helper: find a match by matchNumber.
  const matchByNumber = async (n: number) =>
    prisma.match.findUnique({ where: { matchNumber: n } });

  // Second pass: set lineage.
  // R32 → R16: R32 #73..88 feed R16 #89..96. R32 #(73 + 2k) → R16 #(89 + k), slot "home".
  //                                          R32 #(73 + 2k + 1) → R16 #(89 + k), slot "away".
  for (let i = 0; i < 16; i++) {
    const r32 = await matchByNumber(73 + i);
    const r16 = await matchByNumber(89 + Math.floor(i / 2));
    if (r32 && r16) {
      await prisma.match.update({
        where: { id: r32.id },
        data: {
          nextMatchId: r16.id,
          nextMatchSlot: i % 2 === 0 ? "home" : "away",
        },
      });
    }
  }
  // R16 → QF
  for (let i = 0; i < 8; i++) {
    const r16 = await matchByNumber(89 + i);
    const qf = await matchByNumber(97 + Math.floor(i / 2));
    if (r16 && qf) {
      await prisma.match.update({
        where: { id: r16.id },
        data: {
          nextMatchId: qf.id,
          nextMatchSlot: i % 2 === 0 ? "home" : "away",
        },
      });
    }
  }
  // QF → SF
  for (let i = 0; i < 4; i++) {
    const qf = await matchByNumber(97 + i);
    const sf = await matchByNumber(101 + Math.floor(i / 2));
    if (qf && sf) {
      await prisma.match.update({
        where: { id: qf.id },
        data: {
          nextMatchId: sf.id,
          nextMatchSlot: i % 2 === 0 ? "home" : "away",
        },
      });
    }
  }
  // SF → Final (winner) and SF → 3rd-place playoff (loser)
  const final = await matchByNumber(104);
  const thirdPlace = await matchByNumber(103);
  for (let i = 0; i < 2; i++) {
    const sf = await matchByNumber(101 + i);
    if (sf && final && thirdPlace) {
      await prisma.match.update({
        where: { id: sf.id },
        data: {
          nextMatchId: final.id,
          nextMatchSlot: i === 0 ? "home" : "away",
          loserMatchId: thirdPlace.id,
          loserMatchSlot: i === 0 ? "home" : "away",
        },
      });
    }
  }

  console.log("Seeded 32 knockout matches with bracket lineage");
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
