"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const LIVE_POLL_MS   = 5 * 60 * 1000; // call Perplexity every 5 min during match
const IDLE_REFRESH_MS = 15 * 1000;    // lightweight router.refresh() when no match

/**
 * kickoffTimes: Unix timestamps (ms) of today's matches, passed from the
 * server component so the client knows when to activate live polling.
 *
 * During a live window (kickoff − 2 min → kickoff + 115 min) this component
 * calls POST /api/live-scores, which fetches the real score from Perplexity,
 * writes it to the DB, and revalidates the cache. Then it calls router.refresh()
 * so the page re-renders with fresh data.
 *
 * Outside live windows it falls back to a slower router.refresh() so manual
 * admin updates are still visible without a full page reload.
 */
export function LiveScoresPoller({ kickoffTimes }: { kickoffTimes: number[] }) {
  const router = useRouter();
  const lastLivePoll = useRef<number>(0);

  useEffect(() => {
    const isLive = () => {
      const now = Date.now();
      return kickoffTimes.some(
        (t) => now >= t - 2 * 60 * 1000 && now <= t + 115 * 60 * 1000
      );
    };

    const syncAndRefresh = async () => {
      if (document.hidden) return;
      const now = Date.now();
      if (isLive() && now - lastLivePoll.current >= LIVE_POLL_MS) {
        lastLivePoll.current = now;
        try {
          await fetch("/api/live-scores", { method: "POST" });
        } catch { /* non-critical */ }
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
