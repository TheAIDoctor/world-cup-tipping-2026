"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.push("/signin?registered=1&email=" + encodeURIComponent(email.trim()));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--cm-card-deep, rgba(13,0,96,0.3))",
    borderColor: "var(--cm-border)",
    color: "var(--cm-foreground)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="text-sm text-center px-4 py-3 rounded-lg border"
          style={{
            background: "rgba(239,68,68,0.1)",
            borderColor: "rgba(239,68,68,0.35)",
            color: "rgb(252 165 165)",
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--cm-muted)" }}
        >
          Display Name
        </label>
        <input
          id="name"
          type="text"
          required
          autoFocus
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2 ring-offset-0"
          style={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--cm-muted)" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@cloudmarc.com.au"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2 ring-offset-0"
          style={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--cm-muted)" }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2 ring-offset-0"
          style={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm"
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--cm-muted)" }}
        >
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2 ring-offset-0"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
      >
        {loading ? "Creating account…" : "Create Account →"}
      </button>
    </form>
  );
}
