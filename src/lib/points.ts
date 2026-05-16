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
