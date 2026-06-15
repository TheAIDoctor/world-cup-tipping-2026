import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { TipsList } from "@/components/tips-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TipsPage() {
  const session = await auth();

  const [matches, userTipsRaw] = await Promise.all([
    prisma.match.findMany({
      select: {
        id: true,
        matchNumber: true,
        stage: true,
        date: true,
        homeScore: true,
        awayScore: true,
        penaltyHomeScore: true,
        penaltyAwayScore: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true, code: true, flagEmoji: true, group: true } },
        awayTeam: { select: { name: true, code: true, flagEmoji: true, group: true } },
      },
      orderBy: [{ date: "asc" }, { matchNumber: "asc" }],
    }),
    session?.user?.id
      ? prisma.matchTip.findMany({
          where: { userId: session.user.id },
          select: { matchId: true, homeScore: true, awayScore: true },
        })
      : Promise.resolve([]),
  ]);

  const userTips = Object.fromEntries(
    userTipsRaw.map((t) => [t.matchId, { homeScore: t.homeScore, awayScore: t.awayScore }])
  );

  // Serialise dates to ISO strings for the client component.
  const serialisedMatches = matches.map((m) => ({
    ...m,
    date: m.date.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 Match Tips</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predict scores for each match. Tips lock{" "}
            <strong>at kickoff</strong> (shown in Melbourne time).
            Knockout tips score on the 90-minute result only.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground hidden sm:block">
          <p>5 pts — exact score</p>
          <p>3 pts — correct result</p>
        </div>
      </div>

      {!session ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to submit your match tips.</p>
            <Link href="/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <TipsList matches={serialisedMatches} userTips={userTips} nowMs={Date.now()} />
      )}
    </div>
  );
}
