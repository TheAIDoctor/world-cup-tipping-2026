"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
  flagEmoji: string;
  group: string;
}

interface PredictFormProps {
  teams: Team[];
  existingTournament: {
    champion: string;
    runnerUp: string;
    third: string;
    fourth: string;
  } | null;
  existingTopScorers: {
    scorer1: string;
    scorer2: string;
    scorer3: string;
  } | null;
  locked: boolean;
}

export function PredictForm({
  teams,
  existingTournament,
  existingTopScorers,
  locked,
}: PredictFormProps) {
  const [champion, setChampion] = useState(
    existingTournament?.champion || ""
  );
  const [runnerUp, setRunnerUp] = useState(
    existingTournament?.runnerUp || ""
  );
  const [third, setThird] = useState(existingTournament?.third || "");
  const [fourth, setFourth] = useState(existingTournament?.fourth || "");
  const [scorer1, setScorer1] = useState(
    existingTopScorers?.scorer1 || ""
  );
  const [scorer2, setScorer2] = useState(
    existingTopScorers?.scorer2 || ""
  );
  const [scorer3, setScorer3] = useState(
    existingTopScorers?.scorer3 || ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!champion || !runnerUp || !third || !fourth) {
      setError("Please select all four finalists");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament: { champion, runnerUp, third, fourth },
          topScorers: scorer1 || scorer2 || scorer3
            ? {
                scorer1: scorer1 || "",
                scorer2: scorer2 || "",
                scorer3: scorer3 || "",
              }
            : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const teamOption = (t: Team) => `${t.flagEmoji} ${t.name}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {locked && (
        <div className="bg-muted rounded-md px-4 py-3 text-sm text-muted-foreground">
          🔒 Predictions are locked. The tournament has started.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🏆 Tournament Finalists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { label: "🥇 Champion", value: champion, setter: setChampion },
              { label: "🥈 Runner-up", value: runnerUp, setter: setRunnerUp },
              { label: "🥉 3rd Place", value: third, setter: setThird },
              { label: "4️⃣ 4th Place", value: fourth, setter: setFourth },
            ] as { label: string; value: string; setter: (v: string) => void }[]
          ).map(({ label, value, setter }) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
            >
              <span className="text-sm font-medium sm:w-28 shrink-0">
                {label}
              </span>
              <Select
                value={value}
                onValueChange={(v) => {
                  setter(v ?? "");
                  setSaved(false);
                }}
                disabled={locked}
              >
                <SelectTrigger className="flex-1 w-full">
                  <SelectValue placeholder="Select a team…" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {teamOption(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚽ Top 3 Scorers (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "1st Scorer", value: scorer1, setter: setScorer1 },
            { label: "2nd Scorer", value: scorer2, setter: setScorer2 },
            { label: "3rd Scorer", value: scorer3, setter: setScorer3 },
          ].map(({ label, value, setter }) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
            >
              <span className="text-sm font-medium sm:w-28 shrink-0">
                {label}
              </span>
              <Input
                value={value}
                onChange={(e) => {
                  setter(e.target.value);
                  setSaved(false);
                }}
                disabled={locked}
                placeholder="Player name…"
                className="flex-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {!locked && (
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {saved && <span className="text-green-500">✓ Predictions saved!</span>}
            {error && <span className="text-destructive">{error}</span>}
          </span>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Predictions"}
          </Button>
        </div>
      )}
    </form>
  );
}
