import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminResultForm } from "@/components/admin-result-form";

const KNOCKOUT_ORDER = ["R32", "R16", "QF", "SF", "3P", "F"] as const;
const STAGE_LABELS: Record<string, string> = {
  group: "Group",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3P": "Third-place playoff",
  F: "Final",
};

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    redirect("/");
  }

  const [matches, allTeams] = await Promise.all([
    prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        tips: { select: { id: true } },
      },
      orderBy: [{ date: "asc" }, { matchNumber: "asc" }],
    }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
  ]);

  const teamOptions = allTeams.map((t) => ({
    id: t.id,
    name: t.name,
    flagEmoji: t.flagEmoji,
  }));

  const groupMatches = matches.filter((m) => m.stage === "group");
  const knockoutMatches = matches.filter((m) => m.stage !== "group");
  const knockoutByStage: Record<string, typeof matches> = {};
  for (const m of knockoutMatches) {
    if (!knockoutByStage[m.stage]) knockoutByStage[m.stage] = [];
    knockoutByStage[m.stage].push(m);
  }

  const now = new Date();
  const playedGroupMatches = groupMatches.filter((m) => m.date <= now);
  const upcomingGroupMatches = groupMatches.filter((m) => m.date > now);

  const stats = {
    total: matches.length,
    resultsEntered: matches.filter((m) => m.homeScore !== null).length,
    totalTips: matches.reduce((sum, m) => sum + m.tips.length, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter group-stage results and 90′ scores. For knockout matches,
          assign teams as they qualify, then enter the result (plus penalty
          scores if drawn at 90′). Winners advance automatically.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{stats.resultsEntered}</p>
            <p className="text-sm text-muted-foreground">Results Entered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{stats.totalTips}</p>
            <p className="text-sm text-muted-foreground">Total Tips</p>
          </CardContent>
        </Card>
      </div>

      {playedGroupMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Group Stage — Played Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playedGroupMatches.map((match) => (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Match #{match.matchNumber} — Group {match.homeTeam?.group}
                    </span>
                    <div className="flex gap-1">
                      {match.homeScore !== null ? (
                        <Badge className="text-xs">
                          ✓ {match.homeScore}–{match.awayScore}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Pending
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {match.tips.length} tips
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminResultForm
                    matchId={match.id}
                    stage={match.stage}
                    homeTeam={
                      match.homeTeam
                        ? {
                            id: match.homeTeam.id,
                            name: match.homeTeam.name,
                            flagEmoji: match.homeTeam.flagEmoji,
                          }
                        : null
                    }
                    awayTeam={
                      match.awayTeam
                        ? {
                            id: match.awayTeam.id,
                            name: match.awayTeam.name,
                            flagEmoji: match.awayTeam.flagEmoji,
                          }
                        : null
                    }
                    existingHomeScore={match.homeScore ?? undefined}
                    existingAwayScore={match.awayScore ?? undefined}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Knockout Stage</h2>
        <div className="space-y-6">
          {KNOCKOUT_ORDER.map((stage) => {
            const stageMatches = knockoutByStage[stage] ?? [];
            if (stageMatches.length === 0) return null;
            return (
              <div key={stage}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">{STAGE_LABELS[stage]}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stageMatches.map((match) => (
                    <Card key={match.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Match #{match.matchNumber}
                          </span>
                          <div className="flex gap-1">
                            {match.homeScore !== null ? (
                              <Badge className="text-xs">
                                ✓ {match.homeScore}–{match.awayScore}
                                {match.penaltyHomeScore !== null &&
                                  match.penaltyAwayScore !== null && (
                                    <> (pens {match.penaltyHomeScore}–
                                      {match.penaltyAwayScore})</>
                                  )}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Pending
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {match.tips.length} tips
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(match.date).toLocaleDateString("en-AU", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <AdminResultForm
                          matchId={match.id}
                          stage={match.stage}
                          homeTeam={
                            match.homeTeam
                              ? {
                                  id: match.homeTeam.id,
                                  name: match.homeTeam.name,
                                  flagEmoji: match.homeTeam.flagEmoji,
                                }
                              : null
                          }
                          awayTeam={
                            match.awayTeam
                              ? {
                                  id: match.awayTeam.id,
                                  name: match.awayTeam.name,
                                  flagEmoji: match.awayTeam.flagEmoji,
                                }
                              : null
                          }
                          existingHomeScore={match.homeScore ?? undefined}
                          existingAwayScore={match.awayScore ?? undefined}
                          existingPenaltyHomeScore={match.penaltyHomeScore ?? undefined}
                          existingPenaltyAwayScore={match.penaltyAwayScore ?? undefined}
                          teamOptions={teamOptions}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {upcomingGroupMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            Group Stage — Upcoming ({upcomingGroupMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {upcomingGroupMatches.slice(0, 12).map((match) => (
              <Card key={match.id} className="opacity-60">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground">
                    #{match.matchNumber}
                  </p>
                  <p className="text-sm font-medium">
                    {match.homeTeam?.flagEmoji} {match.homeTeam?.name} vs{" "}
                    {match.awayTeam?.flagEmoji} {match.awayTeam?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(match.date).toLocaleDateString("en-AU", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
            {upcomingGroupMatches.length > 12 && (
              <div className="text-sm text-muted-foreground flex items-center justify-center">
                +{upcomingGroupMatches.length - 12} more upcoming
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
