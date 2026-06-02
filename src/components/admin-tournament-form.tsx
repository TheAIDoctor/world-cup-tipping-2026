"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TeamOption {
  id: string;
  name: string;
  flagEmoji: string;
}

interface TournamentResult {
  champion?: string | null;
  runnerUp?: string | null;
  third?: string | null;
  fourth?: string | null;
  topScorer1?: string | null;
  topScorer2?: string | null;
  topScorer3?: string | null;
}

interface AdminTournamentFormProps {
  teams: TeamOption[];
  existing?: TournamentResult;
}

export function AdminTournamentForm({ teams, existing }: AdminTournamentFormProps) {
  const [champion, setChampion] = useState<string>(existing?.champion || "");
  const [runnerUp, setRunnerUp] = useState<string>(existing?.runnerUp || "");
  const [third, setThird] = useState<string>(existing?.third || "");
  const [fourth, setFourth] = useState<string>(existing?.fourth || "");
  const [scorer1, setScorer1] = useState<string>(existing?.topScorer1 || "");
  const [scorer2, setScorer2] = useState<string>(existing?.topScorer2 || "");
  const [scorer3, setScorer3] = useState<string>(existing?.topScorer3 || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/tournament-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          champion: champion || null,
          runnerUp: runnerUp || null,
          third: third || null,
          fourth: fourth || null,
          topScorer1: scorer1 || null,
          topScorer2: scorer2 || null,
          topScorer3: scorer3 || null,
        }),
      });
      if (res.ok) {
        setMsg("Tournament results saved. Leaderboard updated instantly.");
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to save.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const teamSelector = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    pts: string
  ) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} <span className="text-[10px] font-normal" style={{ color: "#ffcd57" }}>({pts} pts)</span>
      </label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
      >
        <option value="">— Not set —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.name}>
            {t.flagEmoji} {t.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Card>
      <CardContent className="space-y-5 pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teamSelector("🏆 Champion", champion, setChampion, "15")}
          {teamSelector("🥈 Runner-up", runnerUp, setRunnerUp, "10")}
          {teamSelector("🥉 3rd Place", third, setThird, "5")}
          {teamSelector("4️⃣ 4th Place", fourth, setFourth, "3")}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            ⚽ Top Scorers <span className="font-normal" style={{ color: "#ffcd57" }}>(5 pts each if correct)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Top Scorer 1", value: scorer1, set: setScorer1 },
              { label: "Top Scorer 2", value: scorer2, set: setScorer2 },
              { label: "Top Scorer 3", value: scorer3, set: setScorer3 },
            ].map(({ label, value, set }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input
                  placeholder="Player name"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {msg && <p className="text-sm" style={{ color: "rgb(134 239 172)" }}>{msg}</p>}
        {error && <p className="text-sm" style={{ color: "rgb(252 165 165)" }}>{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Tournament Results"}
        </Button>
      </CardContent>
    </Card>
  );
}
