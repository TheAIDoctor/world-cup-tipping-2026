import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TipsForm } from "@/components/tips-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatKickoff } from "@/lib/format";

const KNOCKOUT_ORDER = ["R32", "R16", "QF", "SF", "3P", "F"] as const;
const KNOCKOUT_LABELS: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3P": "Third-place playoff",
  F: "Final",
};

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

  // Group-stage matches grouped by group letter A..L; knockout matches by stage.
  // Knockout teams are NULL until admin assigns them, so we can't derive group
  // from teams for those — we group by Match.stage.
  const groupStageMatches: Record<string, typeof matches> = {};
  const knockoutByStage: Record<string, typeof matches> = {};
  for (const match of matches) {
    if (match.stage === "group") {
      const group = match.homeTeam?.group || match.awayTeam?.group || "Other";
      if (!groupStageMatches[group]) groupStageMatches[group] = [];
      groupStageMatches[group].push(match);
    } else {
      if (!knockoutByStage[match.stage]) knockoutByStage[match.stage] = [];
      knockoutByStage[match.stage].push(match);
    }
  }

  const sortedGroups = Object.keys(groupStageMatches).sort();
  const activeKnockoutStages = KNOCKOUT_ORDER.filter((s) => knockoutByStage[s]?.length);
  const now = new Date();

  const renderMatchCard = (match: (typeof matches)[number]) => {
    const teamsAssigned = !!match.homeTeam && !!match.awayTeam;
    const locked = match.date <= now || !teamsAssigned;
    const existingTip = userTips[match.id];
    return (
      <Card key={match.id} id={`match-${match.matchNumber}`} className={"scroll-mt-20 " + (locked ? "opacity-70" : "")}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Match #{match.matchNumber}
            </span>
            <div className="flex items-center gap-2">
              {!teamsAssigned && (
                <Badge variant="outline" className="text-xs">
                  Teams TBD
                </Badge>
              )}
              {teamsAssigned && locked && (
                <Badge variant="secondary" className="text-xs">
                  🔒 Locked
                </Badge>
              )}
              {match.homeScore !== null && match.awayScore !== null && (
                <Badge className="text-xs">
                  Result: {match.homeScore}–{match.awayScore}
                  {match.penaltyHomeScore !== null && match.penaltyAwayScore !== null && (
                    <> (pens {match.penaltyHomeScore}–{match.penaltyAwayScore})</>
                  )}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatKickoff(match.date)}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 Match Tips</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predict scores for each match. Tips lock when the match kicks off.
            Knockout tips are scored on the 90-minute result — penalty
            shootouts only decide who advances.
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
        <div className="space-y-10">
          <section className="space-y-8">
            <h2 className="text-xl font-bold border-b pb-2">Group Stage</h2>
            {sortedGroups.map((group) => (
              <div key={group}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Group {group}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupStageMatches[group].map(renderMatchCard)}
                </div>
              </div>
            ))}
          </section>

          {activeKnockoutStages.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-xl font-bold border-b pb-2">Knockout Stage</h2>
              {activeKnockoutStages.map((stage) => (
                <div key={stage}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline">{KNOCKOUT_LABELS[stage]}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {knockoutByStage[stage].map(renderMatchCard)}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
