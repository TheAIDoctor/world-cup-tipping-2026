"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — don't render until client knows the theme.
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-base"
      style={{
        background: isDark ? "rgba(193,15,255,0.15)" : "rgba(193,15,255,0.1)",
        border: "1px solid rgba(193,15,255,0.3)",
        color: isDark ? "#ffcd57" : "#6d28d9",
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
