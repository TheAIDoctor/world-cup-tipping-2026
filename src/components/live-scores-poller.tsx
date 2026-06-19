"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const SYNC_POLL_MS    = 3 * 60 * 1000;        // POST /api/live-scores while a final is pending
const IDLE_REFRESH_MS = 15 * 1000;            // lightweight router.refresh() always
const CLOUDY_LIVE_MS  = 5 * 60 * 1000;        // Cloudy check cadence during a match
const CLOUDY_IDLE_MS  = 15 * 60 * 1000;       // Cloudy check cadence otherwise
const SYNC_WINDOW_MS  = 12 * 60 * 60 * 1000;  // keep syncing up to 12 h after kickoff until the feed finalises
const LIVE_WINDOW_MS  = 150 * 60 * 1000;      // "match in play" window (for Cloudy cadence)

/**
 * pendingKickoffs: Unix timestamps (ms) of matches that have NOT been
 * finalised yet (see lib/poller.ts), passed from the server. A match leaves
 * this list as soon as it has a final score, so polling winds down on its own.
 *
 * While any pending match is within [kickoff − 2 min, kickoff + 12 h], this
 * POSTs /api/live-scores so the official-feed final is pulled in promptly —
 * even when the feed publishes hours after full time (the old fixed 200-min
 * window stopped too early, leaving matches stuck showing "in progress").
 *
 * It also pings /api/cloudy/check-mentions so Cloudy stays active — every
 * 5 min while a match is in play, every 15 min otherwise. That endpoint
 * enforces Cloudy's own schedule/caps, so the pings are cheap no-ops most of
 * the time.
 */
export function LiveScoresPoller({ pendingKickoffs }: { pendingKickoffs: number[] }) {
  const router = useRouter();
  const lastSyncPoll = useRef<number>(0);
  const lastCloudyPing = useRef<number>(0);

  useEffect(() => {
    const within = (windowMs: number) => {
      const now = Date.now();
      return pendingKickoffs.some((t) => now >= t - 2 * 60 * 1000 && now <= t + windowMs);
    };

    const tick = async () => {
      if (document.hidden) return;
      const now = Date.now();

      if (within(SYNC_WINDOW_MS) && now - lastSyncPoll.current >= SYNC_POLL_MS) {
        lastSyncPoll.current = now;
        try {
          await fetch("/api/live-scores", { method: "POST" });
        } catch { /* non-critical */ }
      }

      const cloudyInterval = within(LIVE_WINDOW_MS) ? CLOUDY_LIVE_MS : CLOUDY_IDLE_MS;
      if (now - lastCloudyPing.current >= cloudyInterval) {
        lastCloudyPing.current = now;
        fetch("/api/cloudy/check-mentions", { method: "POST" }).catch(() => {});
      }

      router.refresh();
    };

    tick();
    const id = setInterval(tick, IDLE_REFRESH_MS);
    return () => clearInterval(id);
  }, [pendingKickoffs, router]);

  return null;
}
