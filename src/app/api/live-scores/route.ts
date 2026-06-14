import { runScoreSync } from "@/lib/sync-scores";
import { NextResponse } from "next/server";

// Score sync has two triggers:
//   • POST — fired by the in-browser LiveScoresPoller while a match is live.
//   • GET  — fired by the Vercel cron (see vercel.json). This is what makes
//     correctness independent of anyone having a tab open: a wrong live score
//     or a feed that publishes its final late is reconciled even when nobody
//     is watching. Vercel sends `Authorization: Bearer ${CRON_SECRET}`.
//
// Neither forces the per-match Perplexity rate limiter — the (free, always
// authoritative) official feed is consulted on every run regardless, so a
// stale/hallucinated live score self-corrects the moment the feed publishes
// the final, while the paid Perplexity reads stay bounded to their cadence.

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured we don't gate (local/dev); in prod it's set.
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runScoreSync(false);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  const forceSync = req.headers.get("x-sync-force") === "1";
  if (forceSync && !authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runScoreSync(forceSync);
  return NextResponse.json({ ok: true, ...result });
}
