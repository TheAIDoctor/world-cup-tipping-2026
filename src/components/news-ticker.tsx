"use client";

import { useEffect, useState, useRef } from "react";

const REFRESH_MS = 30 * 60 * 1000; // re-fetch every 30 min
const SEP = "   ·   "; // separator between headlines

export function NewsTicker() {
  const [items, setItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/news-ticker");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
        setLoaded(true);
      }
    } catch {
      // silent fail — ticker just stays hidden
    }
  };

  useEffect(() => {
    fetchItems();
    const id = setInterval(fetchItems, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  if (!loaded || items.length === 0) return null;

  // Build one long string and duplicate it so the loop is seamless
  const band = items.join(SEP) + SEP;

  return (
    <div
      className="w-full overflow-hidden relative flex items-center"
      style={{
        height: "36px",
        background: "rgba(7,0,58,0.92)",
        borderBottom: "1px solid rgba(193,15,255,0.25)",
        borderTop: "1px solid rgba(193,15,255,0.15)",
      }}
    >
      {/* Label chip — pinned left, masks the scroll behind it */}
      <div
        className="relative z-10 shrink-0 flex items-center gap-1.5 self-stretch px-3 text-xs font-extrabold uppercase tracking-widest select-none"
        style={{
          background: "linear-gradient(90deg, #c10fff 0%, rgba(193,15,255,0.85) 80%, transparent 100%)",
          color: "#fff",
          letterSpacing: "0.12em",
          paddingRight: "1.5rem",
          marginRight: "-0.75rem",
          clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
        }}
      >
        ⚽ WC26
      </div>

      {/* Scrolling track */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        {/* Fade-in gradient on the left edge (hides content emerging from under the chip) */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none w-8"
          style={{ background: "linear-gradient(90deg, rgba(7,0,58,0.9), transparent)" }}
        />
        {/* Fade-out gradient on the right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none w-12"
          style={{ background: "linear-gradient(270deg, rgba(7,0,58,0.95), transparent)" }}
        />

        {/*
          The track contains the band twice so the CSS animation can loop
          seamlessly: when the first copy exits left the second is already
          on-screen, and the browser restarts the animation at 0 (= first copy).
        */}
        <div
          className="flex items-center whitespace-nowrap animate-ticker will-change-transform"
          style={{ animationDuration: `${Math.max(60, items.length * 12)}s` }}
        >
          <span className="text-xs text-slate-200 pr-4">{band}</span>
          {/* Duplicate for seamless loop */}
          <span className="text-xs text-slate-200 pr-4" aria-hidden>{band}</span>
        </div>
      </div>
    </div>
  );
}
