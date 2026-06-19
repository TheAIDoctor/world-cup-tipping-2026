/**
 * Kickoff timestamps (ms) of matches that still need a final result and are
 * close enough in time to keep syncing for. The LiveScoresPoller uses these to
 * decide when to poll /api/live-scores.
 *
 * A match drops out of this list the moment it has a final score, so the
 * poller naturally stops once everything is finalised — and it keeps going
 * (up to the poller's post-kickoff window) for matches whose official-feed
 * final publishes hours after full time.
 */
export function pendingKickoffMs(
  matches: { date: Date | string; homeScore: number | null }[],
  nowMs: number
): number[] {
  const lo = nowMs - 12 * 60 * 60 * 1000; // kicked off up to 12 h ago, still no final
  const hi = nowMs + 36 * 60 * 60 * 1000; // or upcoming within ~1.5 days
  return matches
    .filter((m) => m.homeScore === null)
    .map((m) => (typeof m.date === "string" ? new Date(m.date).getTime() : m.date.getTime()))
    .filter((t) => t >= lo && t <= hi);
}
