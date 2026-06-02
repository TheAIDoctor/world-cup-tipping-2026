// Static team profiles for all 48 2026 World Cup participants.
// FIFA rankings and points are approximate mid-2025 estimates.
// World Cup appearance counts are historical (prior to 2026).

export type PlayerToWatch = {
  name: string;
  position: string;
  club: string;
};

export type TeamInfo = {
  fifaRanking: number;
  fifaPoints: number;
  worldCupTitles: number;
  worldCupAppearances: number;
  bestFinishes: string[];          // Up to 5, grouped by result
  qualificationSummary: string;
  playersToWatch: PlayerToWatch[];
};

export const TEAM_INFO: Record<string, TeamInfo> = {
  // ── Group A ────────────────────────────────────────────────────────────────
  MEX: {
    fifaRanking: 12, fifaPoints: 1654,
    worldCupTitles: 0, worldCupAppearances: 16,
    bestFinishes: [
      "⚽ Quarter-finals — 1970, 1986",
      "🔵 Round of 16 — 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022",
      "▪️ Group stage — 1930, 1950, 1954, 1958, 1962, 1966",
    ],
    qualificationSummary: "As one of three host nations, Mexico qualified automatically. They continued competitive matches to stay sharp, with Santiago Giménez proving devastating in front of goal. Home-crowd advantage makes them a dangerous side.",
    playersToWatch: [
      { name: "Santiago Giménez", position: "Forward", club: "AC Milan" },
      { name: "Edson Álvarez", position: "Midfielder", club: "West Ham United" },
      { name: "Hirving Lozano", position: "Forward", club: "PSV Eindhoven" },
      { name: "César Montes", position: "Defender", club: "Espanyol" },
    ],
  },
  RSA: {
    fifaRanking: 66, fifaPoints: 1325,
    worldCupTitles: 0, worldCupAppearances: 3,
    bestFinishes: [
      "🔵 Round of 16 — 2002",
      "▪️ Group stage — 1998, 2010",
    ],
    qualificationSummary: "Bafana Bafana ended a 16-year World Cup drought with a resolute CAF qualifying campaign, topping their group ahead of Morocco. Percy Tau's leadership was pivotal in their return to the global stage.",
    playersToWatch: [
      { name: "Percy Tau", position: "Forward", club: "Al-Ahly" },
      { name: "Ronwen Williams", position: "Goalkeeper", club: "SuperSport United" },
      { name: "Evidence Makgopa", position: "Forward", club: "Bayer Leverkusen" },
      { name: "Teboho Mokoena", position: "Midfielder", club: "SuperSport United" },
    ],
  },
  KOR: {
    fifaRanking: 23, fifaPoints: 1555,
    worldCupTitles: 0, worldCupAppearances: 11,
    bestFinishes: [
      "🏅 4th place — 2002",
      "🔵 Round of 16 — 2010, 2022",
      "▪️ Group stage — 1954, 1986, 1990, 1994, 1998, 2006, 2014, 2018",
    ],
    qualificationSummary: "South Korea topped their AFC qualifying group, driven by Son Heung-min's clinical finishing and Lee Kang-in's creative flair. A generation of European-based stars gives them their strongest squad since 2002.",
    playersToWatch: [
      { name: "Son Heung-min", position: "Forward", club: "Tottenham Hotspur" },
      { name: "Kim Min-jae", position: "Defender", club: "Bayern Munich" },
      { name: "Lee Kang-in", position: "Midfielder", club: "Paris Saint-Germain" },
      { name: "Hwang Hee-chan", position: "Forward", club: "Wolverhampton" },
    ],
  },
  CZE: {
    fifaRanking: 40, fifaPoints: 1416,
    worldCupTitles: 0, worldCupAppearances: 9,
    bestFinishes: [
      "🥈 Runner-up (as Czechoslovakia) — 1934, 1962",
      "🥉 Third place (as Czechoslovakia) — 1938",
      "▪️ Group stage — 1954, 1958, 1970, 1982, 1990, 2006",
    ],
    qualificationSummary: "Czechia qualified through UEFA, returning to the World Cup for the first time since 2006. Patrik Schick's goals were crucial in a tight European group, with the team punching above their weight in typical Czech fashion.",
    playersToWatch: [
      { name: "Patrik Schick", position: "Forward", club: "Bayer Leverkusen" },
      { name: "Tomáš Souček", position: "Midfielder", club: "West Ham United" },
      { name: "Vladimír Coufal", position: "Defender", club: "West Ham United" },
      { name: "Lukáš Provod", position: "Midfielder", club: "Slavia Prague" },
    ],
  },

  // ── Group B ────────────────────────────────────────────────────────────────
  CAN: {
    fifaRanking: 46, fifaPoints: 1453,
    worldCupTitles: 0, worldCupAppearances: 2,
    bestFinishes: [
      "▪️ Group stage — 1986, 2022",
    ],
    qualificationSummary: "As a host nation, Canada qualified automatically. Their thrilling 2022 return after 36 years showed they can compete at the top level. Alphonso Davies and Jonathan David lead a young side with serious ambitions.",
    playersToWatch: [
      { name: "Alphonso Davies", position: "Left Back / Forward", club: "Bayern Munich" },
      { name: "Jonathan David", position: "Forward", club: "Lille" },
      { name: "Ismaël Koné", position: "Midfielder", club: "Watford" },
      { name: "Cyle Larin", position: "Forward", club: "Club Brugge" },
    ],
  },
  BIH: {
    fifaRanking: 70, fifaPoints: 1390,
    worldCupTitles: 0, worldCupAppearances: 1,
    bestFinishes: [
      "▪️ Group stage — 2014",
    ],
    qualificationSummary: "Bosnia & Herzegovina navigated the UEFA playoffs to reach only their second World Cup. Ermedin Demirović leads the attack in what is a new generation stepping up for the Dragons.",
    playersToWatch: [
      { name: "Ermedin Demirović", position: "Forward", club: "VfB Stuttgart" },
      { name: "Sead Kolašinac", position: "Defender", club: "Atalanta" },
      { name: "Amar Dedić", position: "Defender", club: "Red Bull Salzburg" },
      { name: "Deni Jurić", position: "Forward", club: "Trabzonspor" },
    ],
  },
  QAT: {
    fifaRanking: 61, fifaPoints: 1395,
    worldCupTitles: 0, worldCupAppearances: 1,
    bestFinishes: [
      "▪️ Group stage — 2022",
    ],
    qualificationSummary: "Qatar qualified through the AFC as Asian representatives, looking to improve on their 2022 host-nation performance. The Aspire Academy pipeline continues to produce disciplined, technical players.",
    playersToWatch: [
      { name: "Akram Afif", position: "Forward", club: "Al-Sadd" },
      { name: "Almoez Ali", position: "Forward", club: "Al-Duhail" },
      { name: "Meshaal Barsham", position: "Goalkeeper", club: "Al-Sadd" },
      { name: "Abdulaziz Hatem", position: "Midfielder", club: "Al-Rayyan" },
    ],
  },
  SUI: {
    fifaRanking: 20, fifaPoints: 1578,
    worldCupTitles: 0, worldCupAppearances: 12,
    bestFinishes: [
      "🔵 Quarter-finals — 1934, 1938, 1954",
      "🔵 Round of 16 — 2006, 2022",
      "▪️ Group stage — 1950, 1962, 1966, 1994, 2010, 2014, 2018",
    ],
    qualificationSummary: "Switzerland qualified comfortably through UEFA, a side that consistently punches above its weight at major tournaments. Xhaka's leadership and Akanji's defensive solidity give them a solid base to work from.",
    playersToWatch: [
      { name: "Granit Xhaka", position: "Midfielder", club: "Bayer Leverkusen" },
      { name: "Manuel Akanji", position: "Defender", club: "Manchester City" },
      { name: "Breel Embolo", position: "Forward", club: "Monaco" },
      { name: "Ruben Vargas", position: "Forward", club: "Augsburg" },
    ],
  },

  // ── Group C ────────────────────────────────────────────────────────────────
  BRA: {
    fifaRanking: 5, fifaPoints: 1776,
    worldCupTitles: 5, worldCupAppearances: 22,
    bestFinishes: [
      "🏆 Champion — 1958, 1962, 1970, 1994, 2002",
      "🥈 Runner-up — 1950",
      "🥉 Third place — 1938, 1978",
      "🏅 4th place — 1974, 2014",
    ],
    qualificationSummary: "Brazil topped CONMEBOL qualification with one of their most exciting squads in a generation. Vinícius Júnior is in unstoppable form and young Endrick adds firepower. The Seleção carry the weight of five stars and a nation's expectation.",
    playersToWatch: [
      { name: "Vinícius Júnior", position: "Forward", club: "Real Madrid" },
      { name: "Rodrygo", position: "Forward", club: "Real Madrid" },
      { name: "Endrick", position: "Forward", club: "Real Madrid" },
      { name: "Alisson Becker", position: "Goalkeeper", club: "Liverpool" },
    ],
  },
  MAR: {
    fifaRanking: 14, fifaPoints: 1624,
    worldCupTitles: 0, worldCupAppearances: 6,
    bestFinishes: [
      "🏅 4th place — 2022",
      "🔵 Round of 16 — 1986",
      "▪️ Group stage — 1970, 1994, 1998, 2018",
    ],
    qualificationSummary: "Morocco qualified comfortably through CAF, energised by their sensational 2022 run as Africa's first-ever semi-finalists. Hakimi, Ziyech and company return with a squad that believes it can go even further this time.",
    playersToWatch: [
      { name: "Achraf Hakimi", position: "Right Back", club: "Paris Saint-Germain" },
      { name: "Hakim Ziyech", position: "Midfielder", club: "Galatasaray" },
      { name: "Youssef En-Nesyri", position: "Forward", club: "Fenerbahçe" },
      { name: "Azzedine Ounahi", position: "Midfielder", club: "Marseille" },
    ],
  },
  HAI: {
    fifaRanking: 108, fifaPoints: 1120,
    worldCupTitles: 0, worldCupAppearances: 1,
    bestFinishes: [
      "▪️ Group stage — 1974",
    ],
    qualificationSummary: "Haiti make a historic return to the World Cup for the first time in 52 years. Qualifying through CONCACAF against considerable odds, this is a monumental achievement for Caribbean football and the entire nation.",
    playersToWatch: [
      { name: "Duckens Nazon", position: "Forward", club: "Saint-Étienne" },
      { name: "James Léandre", position: "Midfielder", club: "FC Metz" },
      { name: "Wilde-Donald Guerrier", position: "Forward", club: "Valerenga" },
      { name: "Steeven Saba", position: "Forward", club: "Le Havre" },
    ],
  },
  SCO: {
    fifaRanking: 37, fifaPoints: 1471,
    worldCupTitles: 0, worldCupAppearances: 8,
    bestFinishes: [
      "▪️ Group stage — 1954, 1958, 1974, 1978, 1982, 1986, 1990, 1998",
    ],
    qualificationSummary: "Scotland ended a painful 28-year World Cup absence by topping their UEFA group. McTominay's goals from midfield were decisive. The Scots return to the global stage determined to finally escape the group stage for the first time.",
    playersToWatch: [
      { name: "Andy Robertson", position: "Left Back", club: "Liverpool" },
      { name: "Scott McTominay", position: "Midfielder", club: "Napoli" },
      { name: "Che Adams", position: "Forward", club: "Torino" },
      { name: "Ryan Christie", position: "Midfielder", club: "AFC Bournemouth" },
    ],
  },

  // ── Group D ────────────────────────────────────────────────────────────────
  USA: {
    fifaRanking: 14, fifaPoints: 1628,
    worldCupTitles: 0, worldCupAppearances: 11,
    bestFinishes: [
      "🥉 Third place — 1930",
      "🔵 Quarter-finals — 2002",
      "🔵 Round of 16 — 1994, 2010, 2014, 2022",
      "▪️ Group stage — 1934, 1950, 1998, 2006, 2010, 2018",
    ],
    qualificationSummary: "As a host nation, the USA qualified automatically and has been building toward this moment for over a decade. A golden generation led by Pulisic, Bellingham-era opponents, and young stars play on home soil for the first time.",
    playersToWatch: [
      { name: "Christian Pulisic", position: "Forward", club: "AC Milan" },
      { name: "Weston McKennie", position: "Midfielder", club: "Juventus" },
      { name: "Tyler Adams", position: "Midfielder", club: "AFC Bournemouth" },
      { name: "Folarin Balogun", position: "Forward", club: "Crystal Palace" },
    ],
  },
  PAR: {
    fifaRanking: 65, fifaPoints: 1415,
    worldCupTitles: 0, worldCupAppearances: 8,
    bestFinishes: [
      "🔵 Quarter-finals — 1986, 2010",
      "🔵 Round of 16 — 1998, 2002",
      "▪️ Group stage — 1930, 1950, 1958, 2006",
    ],
    qualificationSummary: "Paraguay secured their CONMEBOL spot with a gutsy qualification campaign, relying on their traditional defensive solidity and direct counter-attacking play. Sanabria leads the attack for La Albirroja.",
    playersToWatch: [
      { name: "Antonio Sanabria", position: "Forward", club: "Torino" },
      { name: "Miguel Almirón", position: "Midfielder", club: "Newcastle United" },
      { name: "Ángel Romero", position: "Forward", club: "Club América" },
      { name: "Junior Alonso", position: "Defender", club: "Atlético Mineiro" },
    ],
  },
  AUS: {
    fifaRanking: 24, fifaPoints: 1549,
    worldCupTitles: 0, worldCupAppearances: 6,
    bestFinishes: [
      "🔵 Quarter-finals — 2022",
      "🔵 Round of 16 — 2006",
      "▪️ Group stage — 1974, 2010, 2014, 2018",
    ],
    qualificationSummary: "Australia qualified through the AFC playoff, powered by one of their strongest squads. Their thrilling 2022 run to the quarter-finals transformed Australian football expectations — the Socceroos believe this could be their time.",
    playersToWatch: [
      { name: "Mathew Ryan", position: "Goalkeeper", club: "Real Sociedad" },
      { name: "Harry Souttar", position: "Defender", club: "Leicester City" },
      { name: "Martin Boyle", position: "Forward", club: "Al-Faisaly" },
      { name: "Mitchell Duke", position: "Forward", club: "FC Macarthur" },
    ],
  },
  TUR: {
    fifaRanking: 35, fifaPoints: 1538,
    worldCupTitles: 0, worldCupAppearances: 2,
    bestFinishes: [
      "🥉 Third place — 2002",
      "▪️ Group stage — 1954",
    ],
    qualificationSummary: "Turkey ended a 24-year World Cup absence by topping their UEFA group, their exciting young generation of Güler and Yıldız finally delivering the tournament football their talent promises. The new Türkiye are a genuine dark-horse.",
    playersToWatch: [
      { name: "Hakan Çalhanoğlu", position: "Midfielder", club: "Inter Milan" },
      { name: "Arda Güler", position: "Midfielder", club: "Real Madrid" },
      { name: "Kenan Yıldız", position: "Forward", club: "Juventus" },
      { name: "Ferdi Kadıoğlu", position: "Defender", club: "Fenerbahçe" },
    ],
  },

  // ── Group E ────────────────────────────────────────────────────────────────
  GER: {
    fifaRanking: 12, fifaPoints: 1700,
    worldCupTitles: 4, worldCupAppearances: 20,
    bestFinishes: [
      "🏆 Champion — 1954, 1974, 1990, 2014",
      "🥈 Runner-up — 1966, 1982, 1986, 2002",
      "🥉 Third place — 1934, 1970, 2006, 2010",
      "🏅 4th place — 1958",
    ],
    qualificationSummary: "Germany qualified comfortably through UEFA, desperate to rebuild after humiliating group-stage exits in 2018 and 2022. The Musiala–Wirtz partnership is the most electrifying in Europe and the team plays with renewed confidence.",
    playersToWatch: [
      { name: "Jamal Musiala", position: "Midfielder / Forward", club: "Bayern Munich" },
      { name: "Florian Wirtz", position: "Midfielder", club: "Bayer Leverkusen" },
      { name: "Kai Havertz", position: "Forward", club: "Arsenal" },
      { name: "Antonio Rüdiger", position: "Defender", club: "Real Madrid" },
    ],
  },
  CUW: {
    fifaRanking: 93, fifaPoints: 1268,
    worldCupTitles: 0, worldCupAppearances: 0,
    bestFinishes: [
      "🌟 First-ever World Cup appearance",
    ],
    qualificationSummary: "Curaçao makes history by qualifying for the first time ever. The island nation of roughly 150,000 people stunned CONCACAF to reach the global stage — one of the most remarkable qualification stories in World Cup history.",
    playersToWatch: [
      { name: "Leandro Bacuna", position: "Midfielder", club: "Middlesbrough" },
      { name: "Jairzinho Pietermaat", position: "Forward", club: "FC Eindhoven" },
      { name: "Élson Hooi", position: "Defender", club: "RKC Waalwijk" },
      { name: "Jurien Gaari", position: "Forward", club: "Jong PSV" },
    ],
  },
  CIV: {
    fifaRanking: 42, fifaPoints: 1543,
    worldCupTitles: 0, worldCupAppearances: 3,
    bestFinishes: [
      "▪️ Group stage — 2006, 2010, 2014",
    ],
    qualificationSummary: "The Elephants returned to the World Cup after missing 2018 and 2022, topping their CAF group. Simon Adingra's emergence as a world-class winger and Haller's recovery from illness give Ivory Coast renewed optimism.",
    playersToWatch: [
      { name: "Simon Adingra", position: "Forward", club: "Brighton & Hove Albion" },
      { name: "Sébastien Haller", position: "Forward", club: "Borussia Dortmund" },
      { name: "Ibrahim Sangaré", position: "Midfielder", club: "Paris Saint-Germain" },
      { name: "Franck Kessié", position: "Midfielder", club: "Al-Ahli" },
    ],
  },
  ECU: {
    fifaRanking: 46, fifaPoints: 1551,
    worldCupTitles: 0, worldCupAppearances: 4,
    bestFinishes: [
      "🔵 Round of 16 — 2006",
      "▪️ Group stage — 2002, 2014, 2022",
    ],
    qualificationSummary: "Ecuador qualified comfortably through CONMEBOL. Moisés Caicedo commands midfield with authority and Piero Hincapié is one of the best young defenders in Europe — a team built to compete at the highest level.",
    playersToWatch: [
      { name: "Moisés Caicedo", position: "Midfielder", club: "Chelsea" },
      { name: "Piero Hincapié", position: "Defender", club: "Bayer Leverkusen" },
      { name: "Enner Valencia", position: "Forward", club: "Internacional" },
      { name: "Kevin Rodríguez", position: "Forward", club: "Ipswich Town" },
    ],
  },

  // ── Group F ────────────────────────────────────────────────────────────────
  NED: {
    fifaRanking: 8, fifaPoints: 1748,
    worldCupTitles: 0, worldCupAppearances: 11,
    bestFinishes: [
      "🥈 Runner-up — 1974, 1978, 2010",
      "🥉 Third place — 2014",
      "🔵 Quarter-finals — 1994, 2022",
    ],
    qualificationSummary: "The Netherlands qualified comfortably through UEFA, with Van Dijk's commanding presence at the back and Gakpo terrorising defences up front. Three World Cup final appearances with no title — the Oranje remain football's most tantalising nearly-men.",
    playersToWatch: [
      { name: "Virgil van Dijk", position: "Defender", club: "Liverpool" },
      { name: "Cody Gakpo", position: "Forward", club: "Liverpool" },
      { name: "Xavi Simons", position: "Midfielder", club: "Paris Saint-Germain" },
      { name: "Frenkie de Jong", position: "Midfielder", club: "FC Barcelona" },
    ],
  },
  JPN: {
    fifaRanking: 17, fifaPoints: 1614,
    worldCupTitles: 0, worldCupAppearances: 7,
    bestFinishes: [
      "🔵 Round of 16 — 2002, 2010, 2018, 2022",
      "▪️ Group stage — 1998, 2006, 2014",
    ],
    qualificationSummary: "Japan dominated AFC qualification, winning their group without conceding. A star-studded squad of European-based players, this could be Japan's most talented generation ever — Kubo and Mitoma are world-class.",
    playersToWatch: [
      { name: "Takefusa Kubo", position: "Forward", club: "Real Sociedad" },
      { name: "Kaoru Mitoma", position: "Forward", club: "Brighton & Hove Albion" },
      { name: "Wataru Endo", position: "Midfielder", club: "Liverpool" },
      { name: "Takumi Minamino", position: "Forward", club: "Monaco" },
    ],
  },
  SWE: {
    fifaRanking: 25, fifaPoints: 1545,
    worldCupTitles: 0, worldCupAppearances: 12,
    bestFinishes: [
      "🥈 Runner-up — 1958",
      "🥉 Third place — 1950, 1994",
      "🏅 4th place — 1938",
      "🔵 Quarter-finals — 2018",
    ],
    qualificationSummary: "Sweden qualified through UEFA with Alexander Isak in devastating form. Despite missing 2022, the Swedes return with a blend of experienced pros and emerging talent. Isak at his best can trouble any defence in the world.",
    playersToWatch: [
      { name: "Alexander Isak", position: "Forward", club: "Newcastle United" },
      { name: "Dejan Kulusevski", position: "Midfielder / Forward", club: "Tottenham Hotspur" },
      { name: "Victor Lindelöf", position: "Defender", club: "Manchester United" },
      { name: "Emil Forsberg", position: "Midfielder", club: "RB Leipzig" },
    ],
  },
  TUN: {
    fifaRanking: 31, fifaPoints: 1514,
    worldCupTitles: 0, worldCupAppearances: 6,
    bestFinishes: [
      "▪️ Group stage — 1978, 1998, 2002, 2006, 2018, 2022",
    ],
    qualificationSummary: "Tunisia qualified through CAF and arrive with a reputation for being well-organised and hard to beat. The Eagles of Carthage famously beat France in the 2022 group stage — upsetting a major side is absolutely within their capabilities.",
    playersToWatch: [
      { name: "Ellyes Skhiri", position: "Midfielder", club: "Eintracht Frankfurt" },
      { name: "Wahbi Khazri", position: "Forward", club: "Montpellier" },
      { name: "Aïssa Laïdouni", position: "Midfielder", club: "Ferencváros" },
      { name: "Hannibal Mejbri", position: "Midfielder", club: "Manchester United" },
    ],
  },

  // ── Group G ────────────────────────────────────────────────────────────────
  BEL: {
    fifaRanking: 5, fifaPoints: 1779,
    worldCupTitles: 0, worldCupAppearances: 14,
    bestFinishes: [
      "🥉 Third place — 2018",
      "🏅 4th place — 1986",
      "🔵 Quarter-finals — 2014, 2022",
    ],
    qualificationSummary: "Belgium's golden generation has aged but De Bruyne, Lukaku, and De Ketelaere represent the bridge to a new era. They topped their UEFA group and arrive with a familiar mix of individual quality and collective ambition.",
    playersToWatch: [
      { name: "Kevin De Bruyne", position: "Midfielder", club: "Manchester City" },
      { name: "Romelu Lukaku", position: "Forward", club: "Roma" },
      { name: "Charles De Ketelaere", position: "Forward", club: "Atalanta" },
      { name: "Lois Openda", position: "Forward", club: "RB Leipzig" },
    ],
  },
  EGY: {
    fifaRanking: 46, fifaPoints: 1492,
    worldCupTitles: 0, worldCupAppearances: 3,
    bestFinishes: [
      "▪️ Group stage — 1934, 1990, 2018",
    ],
    qualificationSummary: "Egypt qualified through CAF with Mo Salah carrying the Pharaohs on another campaign. A side capable of frustrating anyone with their defensive discipline, they'll aim to progress beyond the group stage for the first time since 1990.",
    playersToWatch: [
      { name: "Mohamed Salah", position: "Forward", club: "Liverpool" },
      { name: "Omar Marmoush", position: "Forward", club: "Manchester City" },
      { name: "Mostafa Mohamed", position: "Forward", club: "Galatasaray" },
      { name: "Trézéguet", position: "Midfielder", club: "Trabzonspor" },
    ],
  },
  IRN: {
    fifaRanking: 24, fifaPoints: 1465,
    worldCupTitles: 0, worldCupAppearances: 6,
    bestFinishes: [
      "▪️ Group stage — 1978, 1998, 2006, 2014, 2018, 2022",
    ],
    qualificationSummary: "Iran topped their AFC qualifying group with characteristic defensive organisation. Team Melli are hard to beat and Mehdi Taremi is a world-class striker at the peak of his powers — they're always capable of a major upset.",
    playersToWatch: [
      { name: "Mehdi Taremi", position: "Forward", club: "Inter Milan" },
      { name: "Sardar Azmoun", position: "Forward", club: "Bayer Leverkusen" },
      { name: "Alireza Jahanbakhsh", position: "Forward", club: "AZ Alkmaar" },
      { name: "Ali Gholizadeh", position: "Forward", club: "Charleroi" },
    ],
  },
  NZL: {
    fifaRanking: 104, fifaPoints: 1290,
    worldCupTitles: 0, worldCupAppearances: 2,
    bestFinishes: [
      "▪️ Group stage — 1982, 2010",
    ],
    qualificationSummary: "New Zealand qualified through the OFC / inter-confederation playoff, a remarkable achievement for Oceanian football. Chris Wood leads the line for a side that punches well above its weight and will give nothing away easily.",
    playersToWatch: [
      { name: "Chris Wood", position: "Forward", club: "Nottingham Forest" },
      { name: "Liberato Cacace", position: "Defender", club: "Empoli" },
      { name: "Ryan Thomas", position: "Midfielder", club: "PSV Eindhoven" },
      { name: "Matthew Garbett", position: "Midfielder", club: "Venezia" },
    ],
  },

  // ── Group H ────────────────────────────────────────────────────────────────
  ESP: {
    fifaRanking: 8, fifaPoints: 1728,
    worldCupTitles: 1, worldCupAppearances: 16,
    bestFinishes: [
      "🏆 Champion — 2010",
      "🏅 4th place — 1950",
      "🔵 Quarter-finals — 1934, 1994, 2002, 2018, 2022",
    ],
    qualificationSummary: "Spain topped their UEFA group unbeaten with one of the most exciting young squads in world football. Lamine Yamal at 18 is already a phenomenon, and Pedri orchestrates with a maturity well beyond his years. La Roja are title favourites.",
    playersToWatch: [
      { name: "Pedri", position: "Midfielder", club: "FC Barcelona" },
      { name: "Lamine Yamal", position: "Forward", club: "FC Barcelona" },
      { name: "Nico Williams", position: "Forward", club: "Athletic Club" },
      { name: "Dani Vivian", position: "Defender", club: "Athletic Club" },
    ],
  },
  CPV: {
    fifaRanking: 71, fifaPoints: 1380,
    worldCupTitles: 0, worldCupAppearances: 0,
    bestFinishes: [
      "🌟 First-ever World Cup appearance",
    ],
    qualificationSummary: "Cape Verde make their World Cup debut, qualifying through CAF in a historic first for the island nation. With a population of just 550,000, this is one of the greatest achievements in African football history.",
    playersToWatch: [
      { name: "Ryan Mendes", position: "Forward", club: "Paços de Ferreira" },
      { name: "Djaniny", position: "Forward", club: "Club América" },
      { name: "Steven Fortes", position: "Defender", club: "FK Midtjylland" },
      { name: "Garry Rodrigues", position: "Forward", club: "Galatasaray" },
    ],
  },
  KSA: {
    fifaRanking: 57, fifaPoints: 1380,
    worldCupTitles: 0, worldCupAppearances: 5,
    bestFinishes: [
      "🔵 Round of 16 — 1994",
      "▪️ Group stage — 1998, 2002, 2018, 2022",
    ],
    qualificationSummary: "Saudi Arabia arrive on the back of their sensational 2-1 win over Argentina in 2022 — the Falcons believe big upsets are within their reach. The Saudi Pro League has boosted domestic quality and brought many stars home.",
    playersToWatch: [
      { name: "Salem Al-Dawsari", position: "Forward", club: "Al-Hilal" },
      { name: "Mohammed Al-Owais", position: "Goalkeeper", club: "Al-Hilal" },
      { name: "Firas Al-Buraikan", position: "Forward", club: "Al-Fateh" },
      { name: "Riyadh Sharahili", position: "Midfielder", club: "Al-Shabab" },
    ],
  },
  URU: {
    fifaRanking: 19, fifaPoints: 1558,
    worldCupTitles: 2, worldCupAppearances: 14,
    bestFinishes: [
      "🏆 Champion — 1930, 1950",
      "🏅 4th place — 1954, 1970, 2010",
      "🔵 Quarter-finals — 1966, 2022",
    ],
    qualificationSummary: "Uruguay qualified through CONMEBOL with Darwin Núñez and Federico Valverde devastating defences. La Celeste carry two World Cup titles and an unshakeable belief that no game is over until the final whistle. Always dangerous.",
    playersToWatch: [
      { name: "Darwin Núñez", position: "Forward", club: "Liverpool" },
      { name: "Federico Valverde", position: "Midfielder", club: "Real Madrid" },
      { name: "Rodrigo Bentancur", position: "Midfielder", club: "Tottenham Hotspur" },
      { name: "José María Giménez", position: "Defender", club: "Atlético de Madrid" },
    ],
  },

  // ── Group I ────────────────────────────────────────────────────────────────
  FRA: {
    fifaRanking: 2, fifaPoints: 1873,
    worldCupTitles: 2, worldCupAppearances: 16,
    bestFinishes: [
      "🏆 Champion — 1998, 2018",
      "🥈 Runner-up — 2006, 2022",
      "🥉 Third place — 1958, 1986",
      "🏅 4th place — 1982",
    ],
    qualificationSummary: "France cruised through UEFA qualifying unbeaten, with Mbappé in extraordinary form for Real Madrid. The reigning finalists are deep, talented, and mentality monsters. Les Bleus are among the top two or three favourites to lift the trophy.",
    playersToWatch: [
      { name: "Kylian Mbappé", position: "Forward", club: "Real Madrid" },
      { name: "Aurélien Tchouaméni", position: "Midfielder", club: "Real Madrid" },
      { name: "William Saliba", position: "Defender", club: "Arsenal" },
      { name: "Marcus Thuram", position: "Forward", club: "Inter Milan" },
    ],
  },
  SEN: {
    fifaRanking: 20, fifaPoints: 1617,
    worldCupTitles: 0, worldCupAppearances: 3,
    bestFinishes: [
      "🔵 Quarter-finals — 2002",
      "🔵 Round of 16 — 2022",
      "▪️ Group stage — 2018",
    ],
    qualificationSummary: "Senegal topped their CAF qualifying group as Africa's No.1 ranked side. As the reigning African Cup of Nations champions, they carry the continent's hopes with Mané's experience and Ndiaye's emerging talent.",
    playersToWatch: [
      { name: "Sadio Mané", position: "Forward", club: "Al-Nassr" },
      { name: "Iliman Ndiaye", position: "Forward", club: "Everton" },
      { name: "Pape Gueye", position: "Midfielder", club: "Villarreal" },
      { name: "Boulaye Dia", position: "Forward", club: "Lazio" },
    ],
  },
  IRQ: {
    fifaRanking: 77, fifaPoints: 1345,
    worldCupTitles: 0, worldCupAppearances: 1,
    bestFinishes: [
      "▪️ Group stage — 1986",
    ],
    qualificationSummary: "Iraq qualified through the AFC, returning to the World Cup for the first time in 40 years. Buoyed by strong performances in the Asian Cup, they are organised and resilient and won't be anyone's easy three points.",
    playersToWatch: [
      { name: "Aymen Hussein", position: "Forward", club: "Al-Zawraa" },
      { name: "Ali Adnan", position: "Defender / Midfielder", club: "Rapid Wien" },
      { name: "Amjed Attwan", position: "Midfielder", club: "Al-Quwa Al-Jawiya" },
      { name: "Ahmed Yasin", position: "Midfielder", club: "Al-Zawraa" },
    ],
  },
  NOR: {
    fifaRanking: 46, fifaPoints: 1512,
    worldCupTitles: 0, worldCupAppearances: 3,
    bestFinishes: [
      "🔵 Round of 16 — 1998",
      "▪️ Group stage — 1938, 1994",
    ],
    qualificationSummary: "Norway ended a 28-year World Cup drought with Erling Haaland obliterating qualifying defences. The most feared striker on the planet leads a squad that finally has the supporting cast to do something special. All eyes will be on No.9.",
    playersToWatch: [
      { name: "Erling Haaland", position: "Forward", club: "Manchester City" },
      { name: "Martin Ødegaard", position: "Midfielder", club: "Arsenal" },
      { name: "Alexander Sørloth", position: "Forward", club: "Atlético de Madrid" },
      { name: "Kristoffer Ajer", position: "Defender", club: "Brentford" },
    ],
  },

  // ── Group J ────────────────────────────────────────────────────────────────
  ARG: {
    fifaRanking: 1, fifaPoints: 1891,
    worldCupTitles: 3, worldCupAppearances: 18,
    bestFinishes: [
      "🏆 Champion — 1978, 1986, 2022",
      "🥈 Runner-up — 1930, 1990, 2014",
      "🥉 Third place — 2022 (in group stage elimination; SF: 2014)",
    ],
    qualificationSummary: "World champions and world No.1 — Argentina dominated CONMEBOL qualifying. Lautaro Martínez leads the attack with Enzo Fernández pulling the strings. The Albiceleste arrive as the team everyone wants to avoid.",
    playersToWatch: [
      { name: "Lautaro Martínez", position: "Forward", club: "Inter Milan" },
      { name: "Enzo Fernández", position: "Midfielder", club: "Chelsea" },
      { name: "Rodrigo De Paul", position: "Midfielder", club: "Atlético de Madrid" },
      { name: "Lisandro Martínez", position: "Defender", club: "Manchester United" },
    ],
  },
  ALG: {
    fifaRanking: 38, fifaPoints: 1490,
    worldCupTitles: 0, worldCupAppearances: 4,
    bestFinishes: [
      "🔵 Round of 16 — 2014",
      "▪️ Group stage — 1982, 1986, 2010",
    ],
    qualificationSummary: "Algeria qualified through a competitive CAF campaign, returning to the World Cup for the first time since 2014. Mahrez's leadership and Aouar's creativity give the Desert Foxes the quality to compete with any side in the group.",
    playersToWatch: [
      { name: "Riyad Mahrez", position: "Forward", club: "Al-Ahli" },
      { name: "Houssem Aouar", position: "Midfielder", club: "OGC Nice" },
      { name: "Youcef Atal", position: "Midfielder", club: "OGC Nice" },
      { name: "Aissa Mandi", position: "Defender", club: "Villarreal" },
    ],
  },
  AUT: {
    fifaRanking: 30, fifaPoints: 1440,
    worldCupTitles: 0, worldCupAppearances: 7,
    bestFinishes: [
      "🥉 Third place — 1954",
      "🔵 Quarter-finals — 1934",
      "▪️ Group stage — 1958, 1978, 1982, 1990, 1998",
    ],
    qualificationSummary: "Austria qualified through UEFA, ending a 28-year World Cup wait. A resurgent side fuelled by Baumgartner's creativity and Sabitzer's tenacity, they are the most underrated team in the tournament and a genuine group-stage threat.",
    playersToWatch: [
      { name: "Marcel Sabitzer", position: "Midfielder", club: "Borussia Dortmund" },
      { name: "Christoph Baumgartner", position: "Midfielder", club: "RB Leipzig" },
      { name: "Patrick Wimmer", position: "Midfielder", club: "VfL Wolfsburg" },
      { name: "Michael Gregoritsch", position: "Forward", club: "SC Freiburg" },
    ],
  },
  JOR: {
    fifaRanking: 74, fifaPoints: 1295,
    worldCupTitles: 0, worldCupAppearances: 0,
    bestFinishes: [
      "🌟 First-ever World Cup appearance",
    ],
    qualificationSummary: "Jordan's historic qualification caps years of football development in the region. The Nashama reached the 2023 Asian Cup final and now make their World Cup debut — Musa Al-Tamari's goals were decisive throughout the AFC campaign.",
    playersToWatch: [
      { name: "Musa Al-Tamari", position: "Forward", club: "Montpellier" },
      { name: "Yazan Al-Naimat", position: "Forward", club: "Al-Qaisumah" },
      { name: "Baha' Faisal", position: "Midfielder", club: "Al-Faisaly" },
      { name: "Mahmoud Al-Mardi", position: "Goalkeeper", club: "Al-Ramtha" },
    ],
  },

  // ── Group K ────────────────────────────────────────────────────────────────
  POR: {
    fifaRanking: 7, fifaPoints: 1760,
    worldCupTitles: 0, worldCupAppearances: 8,
    bestFinishes: [
      "🥉 Third place — 1966",
      "🏅 4th place — 2006",
      "🔵 Quarter-finals — 2010, 2022",
      "🔵 Round of 16 — 2002, 2018",
    ],
    qualificationSummary: "Portugal dominated UEFA qualifying as a new generation steps up. Bruno Fernandes captains a squad full of Premier League talent, with Gonçalo Ramos and Pedro Neto emerging as the new attacking pillars for the post-Ronaldo era.",
    playersToWatch: [
      { name: "Bruno Fernandes", position: "Midfielder", club: "Manchester United" },
      { name: "Rafael Leão", position: "Forward", club: "AC Milan" },
      { name: "Bernardo Silva", position: "Midfielder", club: "Manchester City" },
      { name: "Gonçalo Ramos", position: "Forward", club: "Paris Saint-Germain" },
    ],
  },
  COD: {
    fifaRanking: 62, fifaPoints: 1410,
    worldCupTitles: 0, worldCupAppearances: 1,
    bestFinishes: [
      "▪️ Group stage — 1974 (as Zaire)",
    ],
    qualificationSummary: "DR Congo qualify for the first time since the Zaire era in 1974, topping their CAF group with Yoane Wissa leading the charge. The Leopards represent an exciting new chapter in Central African football.",
    playersToWatch: [
      { name: "Yoane Wissa", position: "Forward", club: "Brentford" },
      { name: "Cédric Bakambu", position: "Forward", club: "Marseille" },
      { name: "Chancel Mbemba", position: "Defender", club: "Marseille" },
      { name: "Arthur Masuaku", position: "Defender", club: "Brentford" },
    ],
  },
  UZB: {
    fifaRanking: 74, fifaPoints: 1330,
    worldCupTitles: 0, worldCupAppearances: 0,
    bestFinishes: [
      "🌟 First-ever World Cup appearance",
    ],
    qualificationSummary: "Uzbekistan make history as the first Central Asian nation to qualify for a World Cup, topping their AFC group with an attractive, technical brand of football. Eldor Shomurodov's goals paved the way for this extraordinary achievement.",
    playersToWatch: [
      { name: "Eldor Shomurodov", position: "Forward", club: "Cagliari" },
      { name: "Abbosbek Fayzullayev", position: "Midfielder", club: "FC Navbahor" },
      { name: "Dostonbek Khamdamov", position: "Forward", club: "Pakhtakor" },
      { name: "Jaloliddin Masharipov", position: "Midfielder", club: "Pakhtakor" },
    ],
  },
  COL: {
    fifaRanking: 11, fifaPoints: 1672,
    worldCupTitles: 0, worldCupAppearances: 6,
    bestFinishes: [
      "🔵 Quarter-finals — 2014",
      "🔵 Round of 16 — 1990",
      "▪️ Group stage — 1962, 1994, 1998, 2018",
    ],
    qualificationSummary: "Colombia topped CONMEBOL qualifying and were 2024 Copa América runners-up. Luis Díaz terrorises defenders for Liverpool and James Rodríguez still provides the creative spark — the Cafeteros have their most complete squad in over a decade.",
    playersToWatch: [
      { name: "Luis Díaz", position: "Forward", club: "Liverpool" },
      { name: "James Rodríguez", position: "Midfielder", club: "Rayo Vallecano" },
      { name: "Jhon Duran", position: "Forward", club: "Aston Villa" },
      { name: "Richard Ríos", position: "Midfielder", club: "Palmeiras" },
    ],
  },

  // ── Group L ────────────────────────────────────────────────────────────────
  ENG: {
    fifaRanking: 3, fifaPoints: 1816,
    worldCupTitles: 1, worldCupAppearances: 16,
    bestFinishes: [
      "🏆 Champion — 1966",
      "🏅 4th place — 1990",
      "🔵 Quarter-finals — 1954, 1962, 1970, 2002, 2006, 2010, 2022",
    ],
    qualificationSummary: "England qualified comfortably at the top of their UEFA group. After back-to-back Euro finals and the 2022 WC quarter-final exit, Bellingham and the new generation are desperate to end 60 years of hurt. They're among the favourites.",
    playersToWatch: [
      { name: "Jude Bellingham", position: "Midfielder", club: "Real Madrid" },
      { name: "Harry Kane", position: "Forward", club: "Bayern Munich" },
      { name: "Bukayo Saka", position: "Forward", club: "Arsenal" },
      { name: "Phil Foden", position: "Midfielder", club: "Manchester City" },
    ],
  },
  CRO: {
    fifaRanking: 11, fifaPoints: 1714,
    worldCupTitles: 0, worldCupAppearances: 6,
    bestFinishes: [
      "🥉 Third place — 1998, 2022",
      "🥈 Runner-up — 2018",
      "🔵 Round of 16 — 2002, 2014",
    ],
    qualificationSummary: "Croatia qualified through UEFA, a veteran side that consistently defies expectations. Modrić plays his final World Cup at 40, Gvardiol represents the next generation, and Kovačić continues to control matches. They will not go quietly.",
    playersToWatch: [
      { name: "Luka Modrić", position: "Midfielder", club: "Real Madrid" },
      { name: "Joško Gvardiol", position: "Defender", club: "Manchester City" },
      { name: "Mateo Kovačić", position: "Midfielder", club: "Manchester City" },
      { name: "Bruno Petković", position: "Forward", club: "Dinamo Zagreb" },
    ],
  },
  GHA: {
    fifaRanking: 60, fifaPoints: 1473,
    worldCupTitles: 0, worldCupAppearances: 4,
    bestFinishes: [
      "🔵 Quarter-finals — 2010",
      "🔵 Round of 16 — 2006, 2014",
      "▪️ Group stage — 2022",
    ],
    qualificationSummary: "Ghana qualified through CAF with Mohammed Kudus and Iñaki Williams providing an exciting attacking partnership. The Black Stars have the quality to make the knockout rounds and Kudus is one of the most dynamic players in the Premier League.",
    playersToWatch: [
      { name: "Mohammed Kudus", position: "Midfielder / Forward", club: "West Ham United" },
      { name: "Iñaki Williams", position: "Forward", club: "Athletic Club" },
      { name: "Thomas Partey", position: "Midfielder", club: "Arsenal" },
      { name: "Kamaldeen Sulemana", position: "Forward", club: "Southampton" },
    ],
  },
  PAN: {
    fifaRanking: 77, fifaPoints: 1320,
    worldCupTitles: 0, worldCupAppearances: 1,
    bestFinishes: [
      "▪️ Group stage — 2018",
    ],
    qualificationSummary: "Panama return to the World Cup for only the second time, qualifying through CONCACAF with their trademark defensive resolve. Every point in every match will be hard-fought — Los Canaleros give maximum effort and ask questions of every opponent.",
    playersToWatch: [
      { name: "Rodolfo Pitti", position: "Forward", club: "Libertad" },
      { name: "Adalberto Carrasquilla", position: "Midfielder", club: "D.C. United" },
      { name: "José Fajardo", position: "Forward", club: "Philadelphia Union" },
      { name: "César Blackman", position: "Midfielder", club: "AaB" },
    ],
  },
};
