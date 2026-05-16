import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TipsForm } from "@/components/tips-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TipsPage() {
  const session = await auth();

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [{ date: "asc" }, { matchNumber: "asc" }],
  });

  let userTips: Record<string, { homeScore: number; awayScore: number }> = {};
  if (session?.user?.id) {
    const tips = await prisma.matchTip.findMany({
      where: { userId: session.user.id },
    });
    userTips = Object.fromEntries(
      tips.map((t) => [t.matchId, { homeScore: t.homeScore, awayScore: t.awayScore }])
    );
  }

  // Group by group letter (from the teams)
  const groupedMatches: Record<string, typeof matches> = {};
  for (const match of matches) {
    const group = match.homeTeam?.group || match.awayTeam?.group || "Other";
    if (!groupedMatches[group]) groupedMatches[group] = [];
    groupedMatches[group].push(match);
  }

  const sortedGroups = Object.keys(groupedMatches).sort();
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 Match Tips</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predict scores for each match. Tips lock when the match kicks off.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>5 pts — exact score</p>
          <p>3 pts — correct result</p>
        </div>
      </div>

      {!session && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to submit your match tips.
            </p>
            <Link href="/api/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {session && (
        <div className="space-y-8">
          {sortedGroups.map((group) => (
            <div key={group}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="outline">Group {group}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedMatches[group].map((match) => {
                  const locked = match.date <= now;
                  const existingTip = userTips[match.id];
                  return (
                    <Card
                      key={match.id}
                      className={locked ? "opacity-70" : ""}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Match #{match.matchNumber}
                          </span>
                          <div className="flex items-center gap-2">
                            {locked && (
                              <Badge variant="secondary" className="text-xs">
                                🔒 Locked
                              </Badge>
                            )}
                            {match.homeScore !== null && match.awayScore !== null && (
                              <Badge className="text-xs">
                                Result: {match.homeScore}–{match.awayScore}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.date).toLocaleString("en-AU", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZoneName: "short",
                          })}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <TipsForm
                          matchId={match.id}
                          homeTeam={
                            match.homeTeam
                              ? `${match.homeTeam.flagEmoji} ${match.homeTeam.name}`
                              : "TBD"
                          }
                          awayTeam={
                            match.awayTeam
                              ? `${match.awayTeam.flagEmoji} ${match.awayTeam.name}`
                              : "TBD"
                          }
                          existingHomeScore={existingTip?.homeScore}
                          existingAwayScore={existingTip?.awayScore}
                          locked={locked}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
