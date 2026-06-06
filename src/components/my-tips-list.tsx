"use client";

import { useState } from "react";
import Link from "next/link";
import { formatKickoffDate, formatKickoffTime } from "@/lib/format";
import { TeamModal } from "@/components/team-modal";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";

type Team = { code: string; name: string; flagEmoji: string; group: string };

type Tip = {
  id: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
  match: {
    id: string;
    stage: string;
    date: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: Team | null;
    awayTeam: Team | null;
  };
};

type TournamentPrediction = {
  champion: string;
  runnerUp: string;
  third: string;
  fourth: string;
} | null;

type TopScorerPrediction = {
  scorer1: string;
  scorer2: string;
  scorer3: string;
} | null;

type PlayerScore = {
  tournamentPts: number;
};

export function MyTipsList({
  tips,
  tournamentPrediction,
  topScorerPrediction,
  myScore,
}: {
  tips: Tip[];
  tournamentPrediction: TournamentPrediction;
  topScorerPrediction: TopScorerPrediction;
  myScore: PlayerScore | undefined;
}) {
  const [selectedTeam, setSelectedTeam] = useState<{ name: string; code: string; flagEmoji: string } | null>(null);

  const byStage = new Map<string, Tip[]>();
  for (const t of tips) {
    const stage = t.match.stage;
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage)!.push(t);
  }
  const stagesWithTips = STAGE_ORDER.filter((s) => byStage.has(s));

  const openTeam = (team: Team | null) => {
    if (team) setSelectedTeam(team);
  };

  return (
    <>
      <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />

      {/* No tips yet */}
      {tips.length === 0 && (
        <div className="rounded-xl border p-8 text-center space-y-3" style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
          <p className="text-4xl">📋</p>
          <p className="font-semibold text-lg">No tips submitted yet</p>
          <p className="text-sm" style={{ color: "var(--cm-muted)" }}>
            Head to the Tips page to predict match scores and start earning points.
          </p>
          <Link
            href="/tips"
            className="inline-block mt-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
          >
            Submit Tips →
          </Link>
        </div>
      )}

      {/* Tips by stage */}
      {stagesWithTips.map((stage) => {
        const stageTips = byStage.get(stage)!;
        const stagePoints = stageTips.reduce((s, t) => s + (t.points ?? 0), 0);
        const stageScored = stageTips.filter((t) => t.points !== null).length;

        return (
          <section key={stage} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{STAGE_LABELS[stage] ?? stage}</h2>
              <span className="text-xs tabular-nums" style={{ color: "var(--cm-muted)" }}>
                {stageScored > 0
                  ? `${stagePoints} pts from ${stageScored} scored`
                  : `${stageTips.length} tips · not yet scored`}
              </span>
            </div>

            <div className="space-y-2">
              {stageTips.map((tip) => {
                const m = tip.match;
                const played = m.homeScore !== null && m.awayScore !== null;
                const scored = tip.points !== null;

                let resultLabel = "";
                let resultColor = "var(--cm-muted)";
                if (scored) {
                  if (tip.points === 5)      { resultLabel = "Exact score";    resultColor = "#ffcd57"; }
                  else if (tip.points === 3) { resultLabel = "Correct result"; resultColor = "rgb(134 239 172)"; }
                  else                        { resultLabel = "Wrong result";   resultColor = "rgb(252 165 165)"; }
                }

                return (
                  <div
                    key={tip.id}
                    className="rounded-lg border px-4 py-3"
                    style={{
                      background: "var(--cm-card-bg)",
                      borderColor:
                        tip.points === 5 ? "rgba(255,205,87,0.35)"
                        : tip.points === 3 ? "rgba(134,239,172,0.25)"
                        : scored && tip.points === 0 ? "rgba(252,165,165,0.2)"
                        : "var(--cm-border)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-[11px]" style={{ color: "var(--cm-muted)" }}>
                          {formatKickoffDate(m.date)} · {formatKickoffTime(m.date)}
                          {m.homeTeam?.group && stage === "group" ? ` · Group ${m.homeTeam.group}` : ""}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <button
                            onClick={() => openTeam(m.homeTeam)}
                            className="flex items-center gap-1 hover:opacity-75 transition-opacity bg-transparent border-0 p-0"
                            aria-label={`View ${m.homeTeam?.name ?? "TBD"} profile`}
                          >
                            <span>{m.homeTeam?.flagEmoji ?? "❓"}</span>
                            <span>{m.homeTeam?.code ?? "TBD"}</span>
                          </button>
                          <span className="tabular-nums font-extrabold text-base" style={{ color: "#ffcd57" }}>
                            {tip.homeScore}–{tip.awayScore}
                          </span>
                          <button
                            onClick={() => openTeam(m.awayTeam)}
                            className="flex items-center gap-1 hover:opacity-75 transition-opacity bg-transparent border-0 p-0"
                            aria-label={`View ${m.awayTeam?.name ?? "TBD"} profile`}
                          >
                            <span>{m.awayTeam?.code ?? "TBD"}</span>
                            <span>{m.awayTeam?.flagEmoji ?? "❓"}</span>
                          </button>
                        </div>
                        {played ? (
                          <div className="text-xs" style={{ color: "var(--cm-muted)" }}>
                            Result: <span className="font-semibold" style={{ color: "var(--cm-foreground)" }}>{m.homeScore}–{m.awayScore}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] italic" style={{ color: "var(--cm-muted)" }}>Not played yet</div>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {scored ? (
                          <div>
                            <div className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: resultColor }}>
                              {tip.points}
                            </div>
                            <div className="text-[10px] font-semibold mt-0.5" style={{ color: resultColor }}>
                              {resultLabel}
                            </div>
                          </div>
                        ) : played ? (
                          <span className="text-[11px] font-medium" style={{ color: "var(--cm-muted)" }}>Pending</span>
                        ) : (
                          <span className="text-[11px]" style={{ color: "var(--cm-muted)" }}>–</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Tournament predictions */}
      {(tournamentPrediction || topScorerPrediction) && (
        <section className="space-y-2">
          <h2 className="text-base font-bold">Tournament Predictions</h2>
          <div className="rounded-lg border px-4 py-4 space-y-3" style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
            {tournamentPrediction && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: "🏆 Champion", value: tournamentPrediction.champion, pts: myScore?.tournamentPts },
                  { label: "🥈 Runner-up", value: tournamentPrediction.runnerUp },
                  { label: "🥉 3rd Place", value: tournamentPrediction.third },
                  { label: "4️⃣ 4th Place", value: tournamentPrediction.fourth },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                      {item.label}
                    </div>
                    <div className="font-semibold mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
            {topScorerPrediction && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--cm-muted)" }}>
                  ⚽ Top Scorers
                </div>
                <div className="text-sm space-y-0.5">
                  <div>{topScorerPrediction.scorer1}</div>
                  <div>{topScorerPrediction.scorer2}</div>
                  <div>{topScorerPrediction.scorer3}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-4">
        <Link
          href="/tips"
          className="px-4 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
        >
          {tips.length > 0 ? "Update Tips →" : "Submit Tips →"}
        </Link>
        <Link
          href="/leaderboard"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
          style={{ borderColor: "var(--cm-border)", color: "var(--cm-foreground)" }}
        >
          View Leaderboard
        </Link>
      </div>
    </>
  );
}
