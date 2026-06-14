"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const LIVE_POLL_MS    = 5 * 60 * 1000;  // score sync cadence during a match
const IDLE_REFRESH_MS = 15 * 1000;      // lightweight router.refresh() always
const CLOUDY_LIVE_MS  = 5 * 60 * 1000;  // Cloudy check cadence during a match
const CLOUDY_IDLE_MS  = 15 * 60 * 1000; // Cloudy check cadence otherwise

/**
 * kickoffTimes: Unix timestamps (ms) of today's matches, passed from the
 * server component so the client knows when to activate live polling.
 *
 * During a live window (kickoff − 2 min → kickoff + 200 min) this component
 * calls POST /api/live-scores, which syncs official scores into the DB and
 * revalidates the cache, then router.refresh() re-renders with fresh data.
 *
 * It also pings POST /api/cloudy/check-mentions so Cloudy stays active —
 * every 5 min while a match is live (commentary + instant mention replies),
 * every 15 min otherwise (mention replies + occasional leaderboard trash
 * talk). The endpoint itself enforces Cloudy's schedule, caps, and gaps, so
 * these pings are cheap no-ops most of the time.
 */
export function LiveScoresPoller({ kickoffTimes }: { kickoffTimes: number[] }) {
  const router = useRouter();
  const lastLivePoll = useRef<number>(0);
  const lastCloudyPing = useRef<number>(0);

  useEffect(() => {
    const isLive = () => {
      const now = Date.now();
      // Window must extend past the Perplexity final-confirmation threshold
      // (kickoff + 150 min, see sync-scores.ts) so a result the official feed
      // is slow to publish can still be finalised before polling stops; the
      // cron is the real backstop, this just keeps an open tab in sync.
      return kickoffTimes.some(
        (t) => now >= t - 2 * 60 * 1000 && now <= t + 200 * 60 * 1000
      );
    };

    const syncAndRefresh = async () => {
      if (document.hidden) return;
      const now = Date.now();
      const live = isLive();

      if (live && now - lastLivePoll.current >= LIVE_POLL_MS) {
        lastLivePoll.current = now;
        try {
          await fetch("/api/live-scores", { method: "POST" });
        } catch { /* non-critical */ }
      }

      const cloudyInterval = live ? CLOUDY_LIVE_MS : CLOUDY_IDLE_MS;
      if (now - lastCloudyPing.current >= cloudyInterval) {
        lastCloudyPing.current = now;
        fetch("/api/cloudy/check-mentions", { method: "POST" }).catch(() => {});
      }

      router.refresh();
    };

    // Kick off immediately if a match is live right now
    if (isLive()) syncAndRefresh();

    const id = setInterval(syncAndRefresh, IDLE_REFRESH_MS);
    return () => clearInterval(id);
  }, [kickoffTimes, router]);

  return null;
}
