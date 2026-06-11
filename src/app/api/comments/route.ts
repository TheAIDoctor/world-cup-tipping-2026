import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_LENGTH = 280;
const PAGE_SIZE = 50;

export async function GET() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { name: true, email: true, isBot: true } },
    },
  });
  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to post" }, { status: 401 });
  }

  const { content } = await req.json() as { content: string };
  const trimmed = content?.trim();

  if (!trimmed) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  if (trimmed.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Max ${MAX_LENGTH} characters` }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { userId: session.user.id, content: trimmed },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { name: true, email: true, isBot: true } },
    },
  });

  // Fire-and-forget: wake Cloudy if he's mentioned so he can reply in near
  // real-time (especially useful during live matches).
  if (/\@cloudy/i.test(trimmed)) {
    const host = req.headers.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    fetch(`${protocol}://${host}/api/cloudy/check-mentions`, { method: "POST" }).catch(() => {});
  }

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json() as { id: string };
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
