"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TeamModal } from "@/components/team-modal";

type Team = { code: string; name: string; flagEmoji: string } | null;

interface TipsFormProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  existingHomeScore?: number;
  existingAwayScore?: number;
  locked: boolean;
}

export function TipsForm({
  matchId,
  homeTeam,
  awayTeam,
  existingHomeScore,
  existingAwayScore,
  locked,
}: TipsFormProps) {
  const [homeScore, setHomeScore] = useState(
    existingHomeScore !== undefined ? String(existingHomeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    existingAwayScore !== undefined ? String(existingAwayScore) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(
    existingHomeScore !== undefined && existingAwayScore !== undefined
  );
  const [error, setError] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<{ code: string; name: string; flagEmoji: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Please enter valid scores");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tips: [{ matchId, homeScore: h, awayScore: a }],
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch {
      setError("Failed to save tip");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => homeTeam && setSelectedTeam(homeTeam)}
            disabled={!homeTeam}
            className="text-sm font-medium flex-1 min-w-0 leading-tight break-words text-left bg-transparent border-0 p-0 hover:opacity-75 transition-opacity disabled:cursor-default disabled:hover:opacity-100"
            aria-label={homeTeam ? `View ${homeTeam.name} profile` : undefined}
          >
            {homeTeam ? `${homeTeam.flagEmoji} ${homeTeam.name}` : "TBD"}
          </button>
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => {
              setHomeScore(e.target.value);
              setSaved(false);
            }}
            disabled={locked}
            className="w-14 text-center px-1 font-bold text-lg shrink-0"
            placeholder="0"
          />
          <span className="text-muted-foreground shrink-0">–</span>
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => {
              setAwayScore(e.target.value);
              setSaved(false);
            }}
            disabled={locked}
            className="w-14 text-center px-1 font-bold text-lg shrink-0"
            placeholder="0"
          />
          <button
            type="button"
            onClick={() => awayTeam && setSelectedTeam(awayTeam)}
            disabled={!awayTeam}
            className="text-sm font-medium flex-1 min-w-0 text-right leading-tight break-words bg-transparent border-0 p-0 hover:opacity-75 transition-opacity disabled:cursor-default disabled:hover:opacity-100"
            aria-label={awayTeam ? `View ${awayTeam.name} profile` : undefined}
          >
            {awayTeam ? `${awayTeam.flagEmoji} ${awayTeam.name}` : "TBD"}
          </button>
        </div>
        {!locked && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {saved ? "✓ Saved" : ""}
              {error ? <span className="text-destructive">{error}</span> : ""}
            </span>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </form>
    </>
  );
}
