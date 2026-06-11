import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Resend sandbox accounts may only deliver to the account owner's address.
// The DB write below is the source of truth; email is best-effort notification.
const REPORT_EMAIL_TO = "daniel.r.lessa@gmail.com";

export async function POST(req: Request) {
  const session = await auth();
  const { description, pageUrl, userAgent } = await req.json() as {
    description: string;
    pageUrl: string;
    userAgent: string;
  };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }

  const userName = session?.user?.name || session?.user?.email || "Anonymous";
  const userEmail = session?.user?.email || "Not signed in";

  // 1. Store in the DB — this is what makes the report "sent" for the user.
  let stored = false;
  try {
    await prisma.bugReport.create({
      data: {
        description: description.trim(),
        pageUrl: pageUrl ?? "",
        userAgent: userAgent ?? "",
        reporter: `${userName} (${userEmail})`,
      },
    });
    stored = true;
  } catch (e) {
    console.error("BugReport DB write failed:", e);
  }

  // 2. Best-effort email notification.
  let emailed = false;
  try {
    const now = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
    const shortDesc = description.trim().slice(0, 60);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c10fff;">🐛 Bug Report — CloudMarc WC26</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #555; width: 140px;">Reported by</td><td style="padding: 6px 12px;">${userName} (${userEmail})</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 6px 12px; font-weight: bold; color: #555;">Time (AEST)</td><td style="padding: 6px 12px;">${now}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #555;">Page</td><td style="padding: 6px 12px;"><a href="${pageUrl}">${pageUrl}</a></td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 6px 12px; font-weight: bold; color: #555;">Browser</td><td style="padding: 6px 12px; font-size: 12px; color: #666;">${userAgent}</td></tr>
        </table>
        <h3 style="color: #333;">Description</h3>
        <div style="background: #f4f4f4; border-left: 4px solid #c10fff; padding: 16px; border-radius: 4px; white-space: pre-wrap;">${description.trim()}</div>
      </div>
    `;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AUTH_RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "CloudMarc WC26 <onboarding@resend.dev>",
        to: REPORT_EMAIL_TO,
        subject: `[BUG REPORT] ${shortDesc}${shortDesc.length < description.trim().length ? "…" : ""} — from ${userName}`,
        html,
      }),
    });
    if (res.ok) {
      emailed = true;
    } else {
      console.error("Resend error:", await res.text());
    }
  } catch (e) {
    console.error("Resend request failed:", e);
  }

  if (!stored && !emailed) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored, emailed });
}
