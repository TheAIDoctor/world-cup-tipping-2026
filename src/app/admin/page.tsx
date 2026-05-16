import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminResultForm } from "@/components/admin-result-form";

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    redirect("/");
  }

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      tips: { select: { id: true } },
    },
    orderBy: [{ date: "asc" }, { matchNumber: "asc" }],
  });

  const now = new Date();
  const playedMatches = matches.filter((m) => m.date <= now);
  const upcomingMatches = matches.filter((m) => m.date > now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter match results to calculate points.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{matches.length}</p>
            <p className="text-sm text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">
              {matches.filter((m) => m.homeScore !== null).length}
            </p>
            <p className="text-sm text-muted-foreground">Results Entered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">
              {matches.reduce((sum, m) => sum + m.tips.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Tips</p>
          </CardContent>
        </Card>
      </div>

      {playedMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Played Matches — Enter Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playedMatches.map((match) => (
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
                    existingHomeScore={match.homeScore ?? undefined}
                    existingAwayScore={match.awayScore ?? undefined}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            Upcoming Matches ({upcomingMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {upcomingMatches.slice(0, 12).map((match) => (
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
            {upcomingMatches.length > 12 && (
              <div className="text-sm text-muted-foreground flex items-center justify-center">
                +{upcomingMatches.length - 12} more upcoming
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
