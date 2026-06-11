"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminSyncButton() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [detail, setDetail] = useState("");

  async function handleSync() {
    setState("loading");
    setDetail("");
    try {
      const res = await fetch("/api/admin/sync-scores", { method: "POST" });
      const data = (await res.json()) as { checked?: number; error?: string };
      if (!res.ok) {
        setState("error");
        setDetail(data.error ?? "Unknown error");
        return;
      }
      setState("ok");
      setDetail(`Checked ${data.checked ?? "?"} match(es) — page will refresh`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setState("error");
      setDetail(String(e));
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        onClick={handleSync}
        disabled={state === "loading"}
        variant={state === "error" ? "destructive" : "default"}
        size="sm"
      >
        {state === "loading" ? "Syncing…" : "⚡ Sync Scores Now"}
      </Button>
      {detail && (
        <span className={`text-xs ${state === "error" ? "text-red-400" : "text-green-400"}`}>
          {state === "ok" ? "✓ " : "✗ "}{detail}
        </span>
      )}
    </div>
  );
}
