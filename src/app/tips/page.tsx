import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TipsForm } from "@/components/tips-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatKickoff } from "@/lib/format";
import { isMatchLocked, formatLockTime } from "@/lib/tips-lock";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";

const KNOCKOUT_ORDER = STAGE_ORDER.filter((s) => s !== "group");

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

  const now = new Date();

  // Partition matches into group (by group letter) and knockout (by stage).
  const groupStageMatches: Record<string, typeof matches> = {};
  const knockoutByStage: Record<string, typeof matches> = {};
  for (const match of matches) {
    if (match.stage === "group") {
      const group = match.homeTeam?.group ?? match.awayTeam?.group ?? "?";
      (groupStageMatches[group] ??= []).push(match);
    } else {
      (knockoutByStage[match.stage] ??= []).push(match);
    }
  }

  const sortedGroups = Object.keys(groupStageMatches).sort();
  const activeKnockoutStages = KNOCKOUT_ORDER.filter((s) => knockoutByStage[s]?.length);

  const renderMatchCard = (match: (typeof matches)[number]) => {
    const teamsAssigned = !!match.homeTeamId && !!match.awayTeamId;
    const locked = isMatchLocked(match.date, teamsAssigned, now);
    const existingTip = userTips[match.id];
    const hasResult = match.homeScore !== null && match.awayScore !== null;

    return (
      <Card
        key={match.id}
        id={`match-${match.matchNumber}`}
        className={"scroll-mt-20 " + (locked ? "opacity-70" : "")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">
              Match #{match.matchNumber}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {!teamsAssigned && (
                <Badge variant="outline" className="text-xs">Teams TBD</Badge>
              )}
              {teamsAssigned && locked && (
                <Badge variant="secondary" className="text-xs">🔒 Locked</Badge>
              )}
              {hasResult && (
                <Badge className="text-xs">
                  Result: {match.homeScore}–{match.awayScore}
                  {match.penaltyHomeScore !== null && match.penaltyAwayScore !== null && (
                    <> (pens {match.penaltyHomeScore}–{match.penaltyAwayScore})</>
                  )}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{formatKickoff(match.date)}</p>
          {teamsAssigned && !locked && (
            <p className="text-[11px]" style={{ color: "var(--cm-muted)" }}>
              {formatLockTime(match.date)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <TipsForm
            matchId={match.id}
            homeTeam={match.homeTeam ? `${match.homeTeam.flagEmoji} ${match.homeTeam.name}` : "TBD"}
            awayTeam={match.awayTeam ? `${match.awayTeam.flagEmoji} ${match.awayTeam.name}` : "TBD"}
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
            Predict scores for each match. Tips lock{" "}
            <strong>24 hours before kickoff</strong> (shown in Melbourne time).
            Knockout tips score on the 90-minute result only.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground hidden sm:block">
          <p>5 pts — exact score</p>
          <p>3 pts — correct result</p>
        </div>
      </div>

      {!session && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to submit your match tips.</p>
            <Link href="/signin">
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
                    <Badge variant="outline">{STAGE_LABELS[stage]}</Badge>
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
