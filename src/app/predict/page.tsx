export const dynamic = "force-dynamic";

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictForm } from "@/components/predict-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PREDICTION_DEADLINE } from "@/lib/constants";

export default async function PredictPage() {
  await connection(); // ensure this page is never prerendered
  const session = await auth();

  const teamsRaw = await prisma.team.findMany();
  const teams = teamsRaw.sort((a, b) => a.name.localeCompare(b.name));

  let existingTournament = null;
  let existingTopScorers = null;

  if (session?.user?.id) {
    [existingTournament, existingTopScorers] = await Promise.all([
      prisma.tournamentPrediction.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.topScorerPrediction.findUnique({
        where: { userId: session.user.id },
      }),
    ]);
  }

  const locked = new Date() > PREDICTION_DEADLINE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔮 Tournament Predictions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pick your finalists and top scorers. Predictions lock on June 11, 2026
          at midnight UTC.
        </p>
      </div>

      {!session && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to submit your predictions.
            </p>
            <Link href="/api/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {session && (
        <PredictForm
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            flagEmoji: t.flagEmoji,
            group: t.group,
          }))}
          existingTournament={
            existingTournament
              ? {
                  champion: existingTournament.champion,
                  runnerUp: existingTournament.runnerUp,
                  third: existingTournament.third,
                  fourth: existingTournament.fourth,
                }
              : null
          }
          existingTopScorers={
            existingTopScorers
              ? {
                  scorer1: existingTopScorers.scorer1,
                  scorer2: existingTopScorers.scorer2,
                  scorer3: existingTopScorers.scorer3,
                }
              : null
          }
          locked={locked}
        />
      )}
    </div>
  );
}
