"use client";

import { useState, useEffect } from "react";

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [pageUrl, setPageUrl] = useState("");
  const [userAgent, setUserAgent] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
    setUserAgent(navigator.userAgent);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, pageUrl, userAgent }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setDescription("");
      }, 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setStatus("idle"); setDescription(""); }}
        title="Report a bug"
        className="fixed bottom-24 right-3 md:bottom-8 md:right-5 z-40 flex items-center gap-1.5 px-2 py-2 md:px-3 rounded-full text-xs font-semibold shadow-lg transition-opacity hover:opacity-90"
        style={{
          background: "rgba(193,15,255,0.18)",
          border: "1px solid rgba(193,15,255,0.45)",
          color: "#e0aaff",
          backdropFilter: "blur(8px)",
        }}
      >
        <span>🐛</span>
        <span className="hidden md:inline">Report a bug</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4"
            style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">🐛 Report a bug</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Auto-captured context */}
            <div
              className="text-xs rounded-lg px-3 py-2 space-y-1"
              style={{ background: "var(--cm-card-deep, rgba(13,0,96,0.3))", color: "var(--cm-muted)" }}
            >
              <div><span className="font-semibold">Page:</span> {pageUrl}</div>
              <div><span className="font-semibold">Browser:</span> {userAgent.split(" ").slice(-2).join(" ")}</div>
            </div>

            {status === "sent" ? (
              <div className="text-center py-6 text-green-400 font-semibold">
                ✅ Bug report sent — thanks!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="bug-description"
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--cm-muted)" }}
                  >
                    What went wrong?
                  </label>
                  <textarea
                    id="bug-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={5}
                    placeholder="Describe the issue — what you did, what you expected, and what actually happened..."
                    className="w-full rounded-lg px-4 py-3 text-sm border outline-none resize-none transition-all focus:ring-2 ring-offset-0"
                    style={{
                      background: "var(--cm-card-deep, rgba(13,0,96,0.3))",
                      borderColor: "var(--cm-border)",
                      color: "var(--cm-foreground)",
                    }}
                    autoFocus
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-400">Failed to send — please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending" || !description.trim()}
                  className="w-full py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
                >
                  {status === "sending" ? "Sending…" : "Send bug report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
