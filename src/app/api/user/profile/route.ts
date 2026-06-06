import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent bot accounts from being modified via this endpoint
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (currentUser?.isBot) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const body = await req.json();

  // Update display name
  if (body.name !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name || null },
    });
    return NextResponse.json({ ok: true });
  }

  // Change password
  if (body.newPassword !== undefined) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) {
      return NextResponse.json({ error: "No password set on this account." }, { status: 400 });
    }
    const valid = await bcrypt.compare(String(body.currentPassword ?? ""), user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const hashed = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
