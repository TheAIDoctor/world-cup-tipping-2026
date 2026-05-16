"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AdminResultFormProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  existingHomeScore?: number;
  existingAwayScore?: number;
}

export function AdminResultForm({
  matchId,
  homeTeam,
  awayTeam,
  existingHomeScore,
  existingAwayScore,
}: AdminResultFormProps) {
  const [homeScore, setHomeScore] = useState(
    existingHomeScore !== undefined ? String(existingHomeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    existingAwayScore !== undefined ? String(existingAwayScore) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Please enter valid scores");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore: h, awayScore: a }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch {
      setError("Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium flex-1 truncate">{homeTeam}</span>
        <Input
          type="number"
          min={0}
          max={20}
          value={homeScore}
          onChange={(e) => {
            setHomeScore(e.target.value);
            setSaved(false);
          }}
          className="w-14 text-center px-1"
          placeholder="0"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          min={0}
          max={20}
          value={awayScore}
          onChange={(e) => {
            setAwayScore(e.target.value);
            setSaved(false);
          }}
          className="w-14 text-center px-1"
          placeholder="0"
        />
        <span className="text-sm font-medium flex-1 truncate text-right">
          {awayTeam}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs">
          {saved && <span className="text-green-500">✓ Saved & points recalculated</span>}
          {error && <span className="text-destructive">{error}</span>}
        </span>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save Result"}
        </Button>
      </div>
    </form>
  );
}
