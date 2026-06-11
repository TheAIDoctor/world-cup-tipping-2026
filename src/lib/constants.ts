// Tip locking: individual match tips lock at kickoff (0 hours before).
// The result can't be known before the game starts, so there is no fairness
// reason to lock earlier — and a longer window (the original 24 h) made every
// near-term match un-tippable during the daily group-stage schedule.
export const TIP_LOCK_HOURS = 0;

// Public signup is restricted to CloudMarc staff email addresses.
export const ALLOWED_SIGNUP_EMAIL_DOMAIN = "cloudmarc.com.au";

// Tournament bracket predictions (champion / finalists / top scorers) lock
// when the group stage ends. Last group matches kick off at 02:00 UTC Jun 28;
// 04:00 UTC gives a 2-hour buffer for matches to finish.
export const PREDICTION_DEADLINE = new Date("2026-06-28T04:00:00Z");

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
