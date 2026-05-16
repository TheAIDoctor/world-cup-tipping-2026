import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: {
      matchTips: { select: { points: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const leaderboard = users
    .map((user, _idx) => {
      const matchPts = user.matchTips.reduce(
        (sum, t) => sum + (t.points ?? 0),
        0
      );
      // Tournament and top scorer points would require final results
      // For now they're 0 until admin sets them
      const tournamentPts = 0;
      const topScorerPts = 0;
      const total = matchPts + tournamentPts + topScorerPts;
      return {
        id: user.id,
        name: user.name || user.email || "Unknown",
        email: user.email,
        matchPts,
        tournamentPts,
        topScorerPts,
        total,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rankings updated in real-time as results are entered.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Points Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
            <span>
              <Badge variant="outline" className="mr-1">
                5 pts
              </Badge>
              Exact score
            </span>
            <span>
              <Badge variant="outline" className="mr-1">
                3 pts
              </Badge>
              Correct result (W/D/L)
            </span>
            <span>
              <Badge variant="outline" className="mr-1">
                0 pts
              </Badge>
              Wrong result
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Match Tips</TableHead>
                <TableHead className="text-right">Tournament</TableHead>
                <TableHead className="text-right">Top Scorer</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No participants yet.
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((player, idx) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {medals[idx] || idx + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        {player.email !== player.name && (
                          <p className="text-xs text-muted-foreground">
                            {player.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{player.matchPts}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.tournamentPts}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.topScorerPts}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {player.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
