"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/tips", icon: "📋", label: "Tips" },
  { href: "/bracket", icon: "🏆", label: "Bracket" },
  { href: "/leaderboard", icon: "📊", label: "Leaders" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden backdrop-blur-md border-t pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "rgba(7,0,58,0.92)",
        borderColor: "rgba(193,15,255,0.2)",
      }}
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors"
                style={{
                  color: active ? "#ffcd57" : "rgb(203 213 225 / 0.85)",
                }}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{
                    textShadow: active
                      ? "0 0 12px rgba(255,205,87,0.45)"
                      : undefined,
                  }}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
