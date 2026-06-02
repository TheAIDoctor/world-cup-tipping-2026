"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileFormProps {
  currentName: string;
  currentEmail: string;
}

export function ProfileForm({ currentName, currentEmail }: ProfileFormProps) {
  const [name, setName] = useState(currentName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const inputStyle = {
    background: "var(--cm-card-deep, rgba(13,0,96,0.3))",
    borderColor: "var(--cm-border)",
    color: "var(--cm-foreground)",
  };

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setNameMsg("Name updated! It will show on your next sign-in.");
      } else {
        const d = await res.json();
        setNameMsg(d.error ?? "Failed to update name.");
      }
    } catch {
      setNameMsg("Network error.");
    } finally {
      setNameSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwMsg("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const d = await res.json();
        setPwError(d.error ?? "Failed to change password.");
      }
    } catch {
      setPwError("Network error.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Display name */}
      <Card style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
        <CardHeader>
          <CardTitle className="text-base">Display Name</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveName} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                Email
              </label>
              <input
                type="text"
                disabled
                value={currentEmail}
                className="w-full rounded-lg px-4 py-3 text-sm border opacity-50 cursor-not-allowed"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                Name shown on leaderboard
              </label>
              <input
                id="display-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2"
                style={inputStyle}
              />
            </div>
            {nameMsg && (
              <p className="text-sm" style={{ color: nameMsg.startsWith("Name") ? "rgb(134 239 172)" : "rgb(252 165 165)" }}>
                {nameMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={nameSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
            >
              {nameSaving ? "Saving…" : "Save Name"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current-pw" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                Current Password
              </label>
              <input
                id="current-pw"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-pw" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-pw" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cm-muted)" }}>
                Confirm New Password
              </label>
              <input
                id="confirm-pw"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2"
                style={inputStyle}
              />
            </div>
            {pwError && <p className="text-sm" style={{ color: "rgb(252 165 165)" }}>{pwError}</p>}
            {pwMsg && <p className="text-sm" style={{ color: "rgb(134 239 172)" }}>{pwMsg}</p>}
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
            >
              {pwSaving ? "Saving…" : "Change Password"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
