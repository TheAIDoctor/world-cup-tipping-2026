export function calcMatchPoints(
  tipHome: number,
  tipAway: number,
  resultHome: number,
  resultAway: number
): number {
  if (tipHome === resultHome && tipAway === resultAway) return 5; // exact score
  const tipResult =
    tipHome > tipAway ? "H" : tipHome < tipAway ? "A" : "D";
  const actualResult =
    resultHome > resultAway ? "H" : resultHome < resultAway ? "A" : "D";
  return tipResult === actualResult ? 3 : 0;
}

export function calcTournamentPoints(
  prediction: { champion: string; runnerUp: string; third: string; fourth: string },
  result: { champion?: string | null; runnerUp?: string | null; third?: string | null; fourth?: string | null }
): number {
  let pts = 0;
  if (result.champion && prediction.champion === result.champion) pts += 15;
  if (result.runnerUp && prediction.runnerUp === result.runnerUp) pts += 10;
  if (result.third && prediction.third === result.third) pts += 5;
  if (result.fourth && prediction.fourth === result.fourth) pts += 3;
  return pts;
}

export function calcTopScorerPoints(
  prediction: { scorer1: string; scorer2: string; scorer3: string },
  result: { topScorer1?: string | null; topScorer2?: string | null; topScorer3?: string | null }
): number {
  const actual = [result.topScorer1, result.topScorer2, result.topScorer3].filter(Boolean) as string[];
  if (actual.length === 0) return 0;
  const picks = [prediction.scorer1, prediction.scorer2, prediction.scorer3];
  return picks.filter((p) => p && actual.includes(p)).length * 5;
}
