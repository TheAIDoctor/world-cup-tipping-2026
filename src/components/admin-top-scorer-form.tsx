"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Team = { name: string; flagEmoji: string };
type Scorer = { id: string; name: string; team: string; flagEmoji: string; goals: number };

export function AdminTopScorerForm({
  teams,
  scorers: initialScorers,
}: {
  teams: Team[];
  scorers: Scorer[];
}) {
  const [scorers, setScorers] = useState<Scorer[]>(initialScorers);
  const [name, setName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [goals, setGoals] = useState("0");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setSelectedTeam(null);
    setGoals("0");
    setEditingId(null);
    setError("");
  };

  const startEdit = (s: Scorer) => {
    setEditingId(s.id);
    setName(s.name);
    setGoals(String(s.goals));
    const t = teams.find((t) => t.name === s.team) ?? null;
    setSelectedTeam(t);
    setError("");
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Player name required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/top-scorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId ?? undefined,
          name: name.trim(),
          team: selectedTeam?.name ?? "",
          flagEmoji: selectedTeam?.flagEmoji ?? "",
          goals: parseInt(goals) || 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: Scorer = await res.json();
      setScorers((prev) => {
        const existing = prev.find((s) => s.id === updated.id);
        return existing
          ? prev.map((s) => (s.id === updated.id ? updated : s)).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
          : [...prev, updated].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
      });
      resetForm();
    } catch (e) {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this scorer?")) return;
    setSaving(true);
    try {
      await fetch("/api/admin/top-scorer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setScorers((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add / Edit form */}
      <div className="rounded-lg border p-4 space-y-3" style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
        <p className="text-sm font-semibold">{editingId ? "✏️ Edit Scorer" : "➕ Add Scorer"}</p>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
          {/* Player name */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Player Name</label>
            <Input
              placeholder="e.g. Harry Kane"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Goals */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Goals</label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-20 text-center font-bold"
            />
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving…" : editingId ? "Update" : "Add"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline" size="sm">
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Team selector */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Team (optional — for flag)</label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedTeam(null)}
              className={
                "text-xs px-2 py-1 rounded border transition-colors " +
                (!selectedTeam
                  ? "border-purple-500 bg-purple-900/30 text-white"
                  : "border-transparent text-muted-foreground hover:border-purple-500/50")
              }
            >
              None
            </button>
            {teams.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTeam(t)}
                className={
                  "text-xs px-2 py-1 rounded border transition-colors " +
                  (selectedTeam?.name === t.name
                    ? "border-purple-500 bg-purple-900/30 text-white"
                    : "border-transparent text-muted-foreground hover:border-purple-500/50")
                }
              >
                {t.flagEmoji} {t.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Current scorers table */}
      {scorers.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--cm-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground" style={{ borderColor: "var(--cm-border)" }}>
                <th className="text-left px-3 py-2">Player</th>
                <th className="text-left px-3 py-2 hidden sm:table-cell">Team</th>
                <th className="text-center px-3 py-2 w-16">⚽ Goals</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--cm-border)" }}>
              {scorers.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors hover:bg-purple-900/10"
                  style={editingId === s.id ? { background: "rgba(193,15,255,0.08)" } : undefined}
                >
                  <td className="px-3 py-2 font-medium">
                    <span className="text-sm mr-1 text-muted-foreground tabular-nums">#{i + 1}</span>
                    {s.flagEmoji && <span className="mr-1">{s.flagEmoji}</span>}
                    {s.name}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{s.team || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-extrabold tabular-nums" style={{ color: "#ffcd57" }}>
                      {s.goals}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => startEdit(s)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-400 border-red-400/30 hover:bg-red-900/20"
                        onClick={() => handleDelete(s.id)}
                        disabled={saving}
                      >
                        ✕
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scorers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No scorers added yet. Add players above as goals are scored.
        </p>
      )}
    </div>
  );
}
