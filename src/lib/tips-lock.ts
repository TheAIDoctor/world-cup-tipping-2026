import { TIP_LOCK_HOURS } from "./constants";
import { formatKickoff } from "./format";

/**
 * Returns the UTC timestamp at which tips for a given match lock.
 * Tips lock TIP_LOCK_HOURS before kickoff regardless of timezone — the
 * comparison is purely UTC so it is correct for all user locations.
 */
export function getLockTime(matchDate: Date): Date {
  return new Date(matchDate.getTime() - TIP_LOCK_HOURS * 60 * 60 * 1000);
}

/**
 * Returns true if tips for this match can no longer be submitted.
 * A match with unassigned teams is always locked (there is nothing to tip on).
 */
export function isMatchLocked(matchDate: Date, teamsAssigned: boolean, now = new Date()): boolean {
  if (!teamsAssigned) return true;
  return getLockTime(matchDate) <= now;
}

/**
 * Human-readable lock time displayed in Melbourne local time (AEST, UTC+10).
 * Example: "Locks Mon 10 Jun · 1:00 am AEST"
 */
export function formatLockTime(matchDate: Date): string {
  return `Locks ${formatKickoff(getLockTime(matchDate))}`;
}
