/** Decorative SVG art for the home page hero — WC trophy + FIFA WC 2026 badge. */

export function WCTrophy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 210"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trophyGold" x1="10" y1="0" x2="110" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="25%" stopColor="#FFD700" />
          <stop offset="65%" stopColor="#F9A825" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <linearGradient id="trophySheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.1" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="trophyGlow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </radialGradient>
        <filter id="trophyShadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FFD700" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Ambient glow beneath trophy */}
      <ellipse cx="60" cy="195" rx="48" ry="12" fill="url(#trophyGlow)" />

      {/* Malachite base — 3 tiers */}
      <rect x="10" y="196" width="100" height="11" rx="3" fill="#1B5E20" />
      <rect x="4"  y="184" width="112" height="14" rx="3" fill="#2E7D32" />
      <rect x="16" y="175" width="88"  height="11" rx="2" fill="#388E3C" />
      {/* Malachite sheen */}
      <rect x="16" y="175" width="88" height="3" rx="2" fill="rgba(255,255,255,0.12)" />

      {/* Stem */}
      <rect x="46" y="136" width="28" height="42" rx="4" fill="url(#trophyGold)" />
      <rect x="36" y="130" width="48" height="10"  rx="3" fill="url(#trophyGold)" />

      {/* Cup body */}
      <g filter="url(#trophyShadow)">
        <path d="M 16 60 L 12 108 Q 20 136 60 136 Q 100 136 108 108 L 104 60 Z" fill="url(#trophyGold)" />
      </g>

      {/* Cup rim */}
      <ellipse cx="60" cy="60" rx="45" ry="9" fill="#FFD700" stroke="#F9A825" strokeWidth="1.5" />

      {/* Left handle */}
      <path d="M 16 76 Q -4 90 -1 108 Q 2 122 16 117" fill="none" stroke="#FFD700" strokeWidth="9" strokeLinecap="round" />
      <path d="M 16 76 Q -4 90 -1 108 Q 2 122 16 117" fill="none" stroke="#FFFDE7" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.35" />

      {/* Right handle */}
      <path d="M 104 76 Q 124 90 121 108 Q 118 122 104 117" fill="none" stroke="#FFD700" strokeWidth="9" strokeLinecap="round" />
      <path d="M 104 76 Q 124 90 121 108 Q 118 122 104 117" fill="none" stroke="#FFFDE7" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.35" />

      {/* Two abstract human figures with arms raised */}
      {/* Left figure body */}
      <path d="M 44 60 Q 38 48 40 34 Q 42 22 52 17" fill="none" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      {/* Left figure arm (raised outward) */}
      <path d="M 40 42 Q 30 35 24 30" fill="none" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />

      {/* Right figure body */}
      <path d="M 76 60 Q 82 48 80 34 Q 78 22 68 17" fill="none" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      {/* Right figure arm (raised outward) */}
      <path d="M 80 42 Q 90 35 96 30" fill="none" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />

      {/* Globe */}
      <circle cx="60" cy="22" r="22" fill="url(#trophyGold)" stroke="#F9A825" strokeWidth="1.5" />
      {/* Globe grid */}
      <ellipse cx="60" cy="22" rx="22" ry="10" fill="none" stroke="#E65100" strokeWidth="0.9" strokeOpacity="0.65" />
      <ellipse cx="60" cy="22" rx="14" ry="22" fill="none" stroke="#E65100" strokeWidth="0.9" strokeOpacity="0.65" />
      <line x1="38" y1="22" x2="82" y2="22" stroke="#E65100" strokeWidth="0.9" strokeOpacity="0.65" />
      {/* Globe outer ring highlight */}
      <circle cx="60" cy="22" r="22" fill="none" stroke="#FFFDE7" strokeWidth="1" strokeOpacity="0.3" />

      {/* Cup sheen */}
      <ellipse cx="38" cy="96" rx="6" ry="22" fill="url(#trophySheen)" transform="rotate(-8, 38, 96)" />
      {/* Globe sheen */}
      <ellipse cx="50" cy="14" rx="5" ry="9" fill="rgba(255,255,255,0.32)" transform="rotate(-20, 50, 14)" />
    </svg>
  );
}

export function FIFABadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 180"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="badgeBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a0050" />
          <stop offset="100%" stopColor="#07003a" />
        </radialGradient>
        <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F9A825" />
        </linearGradient>
        <linearGradient id="hostColors" x1="0%" y1="0%" x2="100%" y2="0%">
          {/* USA blue | Mexico green | Canada red */}
          <stop offset="0%"   stopColor="#003087" />
          <stop offset="33%"  stopColor="#006847" />
          <stop offset="66%"  stopColor="#FF0000" />
          <stop offset="100%" stopColor="#FF0000" />
        </linearGradient>
        <clipPath id="badgeCircle">
          <circle cx="90" cy="90" r="84" />
        </clipPath>
      </defs>

      {/* Background disc */}
      <circle cx="90" cy="90" r="87" fill="url(#badgeBg)" />

      {/* Host-nation colour band at bottom */}
      <rect x="6" y="148" width="168" height="30" fill="url(#hostColors)" clipPath="url(#badgeCircle)" opacity="0.55" />

      {/* Outer gold ring */}
      <circle cx="90" cy="90" r="87" fill="none" stroke="url(#badgeGold)" strokeWidth="3" />
      {/* Inner decorative ring */}
      <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,215,0,0.22)" strokeWidth="1" />

      {/* "FIFA" */}
      <text x="90" y="38" textAnchor="middle" fontSize="15" fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif" fill="#FFD700" letterSpacing="5">
        FIFA
      </text>

      {/* Decorative line under FIFA */}
      <line x1="46" y1="44" x2="134" y2="44" stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* "WORLD CUP" */}
      <text x="90" y="58" textAnchor="middle" fontSize="10" fontWeight="700"
        fontFamily="Arial, sans-serif" fill="rgba(255,215,0,0.85)" letterSpacing="3.5">
        WORLD CUP
      </text>

      {/* Mini trophy silhouette (scaled-down, centered) */}
      <g transform="translate(66, 62) scale(0.4)">
        {/* Cup */}
        <path d="M 16 60 L 12 108 Q 20 130 60 130 Q 100 130 108 108 L 104 60 Z" fill="#FFD700" opacity="0.9" />
        <ellipse cx="60" cy="60" rx="45" ry="9" fill="#FFD700" />
        {/* Handles */}
        <path d="M 16 76 Q -2 90 0 108 Q 3 120 16 117" fill="none" stroke="#FFD700" strokeWidth="9" strokeLinecap="round" />
        <path d="M 104 76 Q 122 90 120 108 Q 117 120 104 117" fill="none" stroke="#FFD700" strokeWidth="9" strokeLinecap="round" />
        {/* Globe */}
        <circle cx="60" cy="22" r="22" fill="#FFD700" />
        <ellipse cx="60" cy="22" rx="22" ry="10" fill="none" stroke="#F9A825" strokeWidth="1.5" />
        <line x1="38" y1="22" x2="82" y2="22" stroke="#F9A825" strokeWidth="1.5" />
        {/* Stem */}
        <rect x="46" y="130" width="28" height="32" rx="4" fill="#FFD700" />
        <rect x="36" y="124" width="48" height="10" rx="3" fill="#FFD700" />
        {/* Base */}
        <rect x="14" y="160" width="92" height="9" rx="2" fill="#2E7D32" />
        <rect x="6"  y="167" width="108" height="11" rx="3" fill="#1B5E20" />
      </g>

      {/* "2026" */}
      <text x="90" y="152" textAnchor="middle" fontSize="30" fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif" fill="#FFD700" letterSpacing="1">
        2026
      </text>

      {/* Host countries label */}
      <text x="90" y="168" textAnchor="middle" fontSize="7.5" fontWeight="600"
        fontFamily="Arial, sans-serif" fill="rgba(255,255,255,0.7)" letterSpacing="2.5">
        USA · MEXICO · CANADA
      </text>

      {/* Stars decoration */}
      <text x="90" y="29" textAnchor="middle" fontSize="8" fill="#FFD700" letterSpacing="6" fontFamily="Arial">
        ★ ★ ★
      </text>
    </svg>
  );
}
