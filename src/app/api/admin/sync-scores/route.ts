import { auth } from "@/lib/auth";
import { runScoreSync } from "@/lib/sync-scores";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runScoreSync(true);
  return NextResponse.json({ ok: true, ...result });
}
