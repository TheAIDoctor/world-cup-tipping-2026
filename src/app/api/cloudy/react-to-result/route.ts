/**
 * POST /api/cloudy/react-to-result
 * Manual trigger for Cloudy's post-result banter (the score sync calls
 * cloudyReactToResult directly whenever a final result lands).
 */

import { cloudyReactToResult } from "@/lib/cloudy-react";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("x-cron-secret")
    ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await req.json() as { matchId: string };
  const posted = await cloudyReactToResult(matchId);
  return NextResponse.json({ ok: true, posted });
}
