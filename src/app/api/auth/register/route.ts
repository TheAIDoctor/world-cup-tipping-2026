import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ALLOWED_SIGNUP_EMAIL_DOMAIN } from "@/lib/constants";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const allowedEmailSuffix = `@${ALLOWED_SIGNUP_EMAIL_DOMAIN}`;

  if (!normalizedEmail || !normalizedPassword) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!normalizedEmail.endsWith(allowedEmailSuffix)) {
    return NextResponse.json(
      { error: `Only @${ALLOWED_SIGNUP_EMAIL_DOMAIN} email addresses can sign up.` },
      { status: 403 }
    );
  }
  if (normalizedPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Allow setting a password on a legacy magic-link account (no password set yet)
    if (existing.password) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const hashed = await bcrypt.hash(normalizedPassword, 12);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashed, name: normalizedName || existing.name || null },
    });
    return NextResponse.json({ ok: true });
  }

  const hashed = await bcrypt.hash(normalizedPassword, 12);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: normalizedName || null,
      password: hashed,
    },
  });

  return NextResponse.json({ ok: true });
}
