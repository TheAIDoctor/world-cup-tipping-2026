import { runScoreSync } from "@/lib/sync-scores";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const forceSync = req.headers.get("x-sync-force") === "1";
  if (forceSync) {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runScoreSync(forceSync);
  return NextResponse.json({ ok: true, ...result });
}
