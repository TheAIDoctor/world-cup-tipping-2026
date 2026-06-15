"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TipsForm } from "@/components/tips-form";
import {
  formatKickoff,
  formatKickoffLongDate,
  kickoffDateKey,
} from "@/lib/format";
import { isMatchLocked, formatLockTime } from "@/lib/tips-lock";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";

const KNOCKOUT_ORDER = STAGE_ORDER.filter((s) => s !== "group");

type TeamLite = { name: string; code: string; flagEmoji: string; group: string } | null;

export type TipMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  date: string; // ISO string
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: TeamLite;
  awayTeam: TeamLite;
};

type Tip = { homeScore: number; awayScore: number };

/**
 * The tips list with two layouts:
 *  - "chrono" (default): every match in kickoff order, grouped under
 *    Melbourne-local date headers — same mental model as the schedule, so you
 *    can see what comes before/after while you predict.
 *  - "group": the classic by-group / by-knockout-stage layout.
 *
 * `nowMs` is the server render time, passed in so lock states are computed
 * identically on the server and the client (no hydration mismatch). The page
 * is force-dynamic and refreshes periodically, keeping it current.
 */
export function TipsList({
  matches,
  userTips,
  nowMs,
}: {
  matches: TipMatch[];
  userTips: Record<string, Tip>;
  nowMs: number;
}) {
  const [view, setView] = useState<"chrono" | "group">("chrono");
  const now = new Date(nowMs);

  const renderMatchCard = (match: TipMatch) => {
    const teamsAssigned = !!match.homeTeamId && !!match.awayTeamId;
    const locked = isMatchLocked(new Date(match.date), teamsAssigned, now);
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
              {match.stage === "group" && match.homeTeam?.group && (
                <> · Group {match.homeTeam.group}</>
              )}
              {match.stage !== "group" && <> · {STAGE_LABELS[match.stage] ?? match.stage}</>}
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
              {formatLockTime(new Date(match.date))}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <TipsForm
            matchId={match.id}
            homeTeam={match.homeTeam ? { code: match.homeTeam.code, name: match.homeTeam.name, flagEmoji: match.homeTeam.flagEmoji } : null}
            awayTeam={match.awayTeam ? { code: match.awayTeam.code, name: match.awayTeam.name, flagEmoji: match.awayTeam.flagEmoji } : null}
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
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
          View
        </span>
        <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: "var(--cm-border)", background: "var(--cm-card-deep)" }}>
          {([
            { key: "chrono", label: "📅 Chronological" },
            { key: "group", label: "🅰️ By Group" },
          ] as const).map((opt) => {
            const active = view === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setView(opt.key)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #060097, #c10fff)", color: "#fff" }
                    : { background: "transparent", color: "var(--cm-muted)" }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "chrono" ? (
        <ChronoView matches={matches} renderCard={renderMatchCard} nowKey={kickoffDateKey(now)} />
      ) : (
        <GroupView matches={matches} renderCard={renderMatchCard} />
      )}
    </div>
  );
}

// ── Chronological: matches grouped by Melbourne-local date ──────────────────
function ChronoView({
  matches,
  renderCard,
  nowKey,
}: {
  matches: TipMatch[];
  renderCard: (m: TipMatch) => React.ReactNode;
  nowKey: string;
}) {
  // matches arrive date-ascending from the server.
  const byDate = new Map<string, TipMatch[]>();
  for (const m of matches) {
    const key = kickoffDateKey(m.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  const dateKeys = Array.from(byDate.keys());
  const upcomingKey = dateKeys.find((k) => k >= nowKey) ?? dateKeys[dateKeys.length - 1];

  return (
    <div className="space-y-6">
      {upcomingKey && (
        <a
          href={`#date-${upcomingKey}`}
          className="inline-block text-xs font-semibold px-3 py-2 rounded-full border transition-colors"
          style={{ background: "rgba(255,205,87,0.12)", color: "#ffcd57", borderColor: "rgba(255,205,87,0.35)" }}
        >
          {upcomingKey === nowKey ? "Jump to today ↓" : "Jump to next matchday ↓"}
        </a>
      )}

      {Array.from(byDate.entries()).map(([dateKey, dayMatches]) => {
        const isToday = dateKey === nowKey;
        const isPast = dateKey < nowKey;
        return (
          <section key={dateKey} id={`date-${dateKey}`} className="scroll-mt-20">
            <div
              className="sticky top-16 z-30 -mx-4 px-4 py-2 backdrop-blur-md border-b mb-3"
              style={{
                background: "var(--cm-sticky-bg)",
                borderColor: isToday ? "rgba(255,205,87,0.45)" : "rgba(193,15,255,0.18)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  className="text-sm sm:text-base font-bold tracking-wide"
                  style={{ color: isToday ? "#ffcd57" : isPast ? "rgb(148 163 184)" : "#fff" }}
                >
                  {isToday && (
                    <span
                      className="mr-2 text-[11px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(255,205,87,0.2)", color: "#ffcd57" }}
                    >
                      Today
                    </span>
                  )}
                  {formatKickoffLongDate(dayMatches[0].date)}
                </h2>
                <span className="text-xs text-slate-500 tabular-nums shrink-0">
                  {dayMatches.length} match{dayMatches.length === 1 ? "" : "es"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayMatches.map(renderCard)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── By group / knockout stage (the classic layout) ──────────────────────────
function GroupView({
  matches,
  renderCard,
}: {
  matches: TipMatch[];
  renderCard: (m: TipMatch) => React.ReactNode;
}) {
  const groupStageMatches: Record<string, TipMatch[]> = {};
  const knockoutByStage: Record<string, TipMatch[]> = {};
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

  return (
    <div className="space-y-10">
      <section className="space-y-8">
        <h2 className="text-xl font-bold border-b pb-2">Group Stage</h2>
        {sortedGroups.map((group) => (
          <div key={group}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">Group {group}</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupStageMatches[group].map(renderCard)}
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
                {knockoutByStage[stage].map(renderCard)}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
