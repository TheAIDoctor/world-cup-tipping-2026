"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UserInfo {
  email: string;
  name: string | null;
  role: string;
}

interface AdminPasswordResetFormProps {
  users: UserInfo[];
}

export function AdminPasswordResetForm({ users }: AdminPasswordResetFormProps) {
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmail || !newPassword) return;
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedEmail, newPassword }),
      });
      if (res.ok) {
        setMsg(`Password reset for ${selectedEmail}.`);
        setNewPassword("");
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to reset password.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              User
            </label>
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="">— Select user —</option>
              {users.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                  {u.role === "admin" ? " [admin]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Password
            </label>
            <Input
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {msg && <p className="text-sm" style={{ color: "rgb(134 239 172)" }}>{msg}</p>}
          {error && <p className="text-sm" style={{ color: "rgb(252 165 165)" }}>{error}</p>}

          <Button type="submit" disabled={saving || !selectedEmail}>
            {saving ? "Resetting…" : "Reset Password"}
          </Button>
        </form>

        {/* User list */}
        <div className="mt-5 pt-4 border-t">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Registered Users ({users.length})
          </p>
          <div className="space-y-1">
            {users.map((u) => (
              <div key={u.email} className="flex items-center justify-between text-sm py-1">
                <span>{u.name || <span className="text-muted-foreground italic">No name</span>}</span>
                <span className="text-muted-foreground text-xs flex items-center gap-2">
                  {u.email}
                  {u.role === "admin" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(255,205,87,0.2)", color: "#ffcd57" }}>
                      admin
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
