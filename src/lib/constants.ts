// Tip locking: individual match tips lock this many hours before kickoff.
// Games are in the USA; users are in Melbourne (AEST = UTC+10 during Jun–Jul).
// A 24-hour lead gives Australian users a comfortable window to submit before
// they go to sleep, even for early-morning AEST kick-offs.
export const TIP_LOCK_HOURS = 24;

// Tournament bracket predictions (champion / finalists / top scorers) lock at
// the start of the first match. This is 2026-06-11T00:00:00Z = 10:00 am AEST.
export const PREDICTION_DEADLINE = new Date("2026-06-11T00:00:00Z");

// Prisma ID for the single TournamentResult row (admin-entered after each event).
export const TOURNAMENT_RESULT_ID = "singleton";

// Canonical labels for each competition stage — used on tips, leaderboard,
// schedule, bracket, admin, and my-tips pages.
export const STAGE_LABELS: Record<string, string> = {
  group: "Group Stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3P": "3rd Place Playoff",
  F: "Final",
};

// Ordered from earliest to latest for display/sorting purposes.
export const STAGE_ORDER = ["group", "R32", "R16", "QF", "SF", "3P", "F"] as const;
export type Stage = (typeof STAGE_ORDER)[number];
