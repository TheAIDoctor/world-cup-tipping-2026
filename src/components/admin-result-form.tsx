"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamOption {
  id: string;
  name: string;
  flagEmoji: string;
}

interface AdminResultFormProps {
  matchId: string;
  stage: string; // "group" | "R32" | "R16" | "QF" | "SF" | "3P" | "F"
  homeTeam: TeamOption | null;
  awayTeam: TeamOption | null;
  existingHomeScore?: number;
  existingAwayScore?: number;
  existingPenaltyHomeScore?: number;
  existingPenaltyAwayScore?: number;
  // Provided for knockout matches so admin can assign teams when they're TBD.
  // Omitted for group matches (teams are pre-seeded).
  teamOptions?: TeamOption[];
}

export function AdminResultForm({
  matchId,
  stage,
  homeTeam,
  awayTeam,
  existingHomeScore,
  existingAwayScore,
  existingPenaltyHomeScore,
  existingPenaltyAwayScore,
  teamOptions,
}: AdminResultFormProps) {
  const isKnockout = stage !== "group";

  const [homeTeamId, setHomeTeamId] = useState(homeTeam?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(awayTeam?.id ?? "");
  const [homeScore, setHomeScore] = useState(
    existingHomeScore !== undefined ? String(existingHomeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    existingAwayScore !== undefined ? String(existingAwayScore) : ""
  );
  const [penaltyHome, setPenaltyHome] = useState(
    existingPenaltyHomeScore !== undefined ? String(existingPenaltyHomeScore) : ""
  );
  const [penaltyAway, setPenaltyAway] = useState(
    existingPenaltyAwayScore !== undefined ? String(existingPenaltyAwayScore) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload: Record<string, unknown> = { matchId };

    if (isKnockout) {
      payload.homeTeamId = homeTeamId || null;
      payload.awayTeamId = awayTeamId || null;
    }

    const hsRaw = homeScore.trim();
    const asRaw = awayScore.trim();
    if (hsRaw !== "" || asRaw !== "") {
      const h = parseInt(hsRaw);
      const a = parseInt(asRaw);
      if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
        setError("Enter valid 90′ scores");
        return;
      }
      payload.homeScore = h;
      payload.awayScore = a;

      if (isKnockout) {
        const phRaw = penaltyHome.trim();
        const paRaw = penaltyAway.trim();
        if (phRaw !== "" || paRaw !== "") {
          const ph = parseInt(phRaw);
          const pa = parseInt(paRaw);
          if (isNaN(ph) || isNaN(pa) || ph < 0 || pa < 0) {
            setError("Enter valid penalty scores");
            return;
          }
          payload.penaltyHomeScore = ph;
          payload.penaltyAwayScore = pa;
        } else if (h === a) {
          setError("Knockout match drawn at 90′ — enter penalty scores to decide winner");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const renderTeamSlot = (
    value: string,
    setValue: (v: string) => void,
    placeholder: string,
    fallback: TeamOption | null
  ) => {
    if (!isKnockout || !teamOptions?.length) {
      return (
        <span className="text-sm font-medium flex-1 truncate">
          {fallback ? `${fallback.flagEmoji} ${fallback.name}` : "TBD"}
        </span>
      );
    }
    return (
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v ?? "");
          setSaved(false);
        }}
      >
        <SelectTrigger className="flex-1 h-8 text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {teamOptions.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.flagEmoji} {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        {renderTeamSlot(homeTeamId, setHomeTeamId, "Home team…", homeTeam)}
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
        {renderTeamSlot(awayTeamId, setAwayTeamId, "Away team…", awayTeam)}
      </div>

      {isKnockout && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-12 text-right shrink-0">Pens</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={penaltyHome}
            onChange={(e) => {
              setPenaltyHome(e.target.value);
              setSaved(false);
            }}
            className="w-14 text-center px-1"
            placeholder="—"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={penaltyAway}
            onChange={(e) => {
              setPenaltyAway(e.target.value);
              setSaved(false);
            }}
            className="w-14 text-center px-1"
            placeholder="—"
          />
          <span className="text-muted-foreground text-[10px]">
            (only if 90′ drawn)
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs">
          {saved && <span className="text-green-500">✓ Saved</span>}
          {error && <span className="text-destructive">{error}</span>}
        </span>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
