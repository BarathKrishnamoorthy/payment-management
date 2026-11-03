import React from 'react';

// 3D Purple Wallet with sparkles
export const PurpleWalletIllustration = () => (
  <svg width="68" height="52" viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <defs>
      <linearGradient id="walletBody" x1="0" y1="0" x2="60" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="walletFlap" x1="10" y1="10" x2="68" y2="35" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D8B4FE" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>
      <filter id="walletShadow" x="-4" y="0" width="76" height="56" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.25" />
      </filter>
    </defs>
    <g filter="url(#walletShadow)">
      {/* Wallet Back */}
      <rect x="4" y="6" width="56" height="38" rx="8" fill="url(#walletBody)" />
      {/* Wallet Front Flap */}
      <path
        d="M 4 18 Q 4 10 12 10 L 52 10 Q 60 10 60 18 L 60 36 Q 60 44 52 44 L 12 44 Q 4 44 4 36 Z"
        fill="url(#walletFlap)"
      />
      {/* Clasp */}
      <rect x="46" y="20" width="16" height="12" rx="4" fill="#F3E8FF" />
      <circle cx="53" cy="26" r="2.5" fill="#7C3AED" />
      {/* Sparkle */}
      <path
        d="M 22 2 L 23.5 5.5 L 27 7 L 23.5 8.5 L 22 12 L 20.5 8.5 L 17 7 L 20.5 5.5 Z"
        fill="#DDD6FE"
      />
    </g>
  </svg>
);

// Smooth Green Wave for Income Card
export const GreenWaveBackground = () => (
  <svg
    viewBox="0 0 160 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute right-0 bottom-0 h-full w-36 pointer-events-none opacity-80"
    preserveAspectRatio="none"
  >
    <path
      d="M 0 45 C 40 25, 70 65, 110 35 C 130 20, 145 28, 160 15 L 160 70 L 0 70 Z"
      fill="url(#greenGrad)"
    />
    <path
      d="M 0 52 C 40 35, 75 60, 110 40 C 130 28, 145 32, 160 20"
      stroke="#34D399"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="greenGrad" x1="80" y1="20" x2="80" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
      </linearGradient>
    </defs>
  </svg>
);

// Smooth Pink/Red Wave for Expenses Card
export const PinkWaveBackground = () => (
  <svg
    viewBox="0 0 160 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute right-0 bottom-0 h-full w-36 pointer-events-none opacity-80"
    preserveAspectRatio="none"
  >
    <path
      d="M 0 42 C 40 55, 75 25, 110 45 C 130 55, 145 40, 160 48 L 160 70 L 0 70 Z"
      fill="url(#pinkGrad)"
    />
    <path
      d="M 0 42 C 40 55, 75 25, 110 45 C 130 55, 145 40, 160 48"
      stroke="#F43F5E"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="pinkGrad" x1="80" y1="25" x2="80" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" />
      </linearGradient>
    </defs>
  </svg>
);

// 3D Glass Jar with Gold Coins
export const MoneyJarIllustration = () => (
  <svg width="58" height="60" viewBox="0 0 58 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <defs>
      <linearGradient id="jarGlass" x1="10" y1="12" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#C084FC" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="jarLid" x1="16" y1="6" x2="42" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7E22CE" />
        <stop offset="100%" stopColor="#581C87" />
      </linearGradient>
    </defs>
    {/* Jar Lid */}
    <rect x="18" y="6" width="22" height="6" rx="3" fill="url(#jarLid)" />
    <rect x="16" y="11" width="26" height="3" rx="1.5" fill="#A855F7" />
    {/* Jar Body */}
    <rect x="12" y="13" width="34" height="42" rx="10" fill="url(#jarGlass)" stroke="#A855F7" strokeWidth="1.5" />
    {/* Glass shine reflection */}
    <path d="M 16 18 Q 16 35 18 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    {/* Gold Coins inside */}
    <ellipse cx="29" cy="48" rx="8" ry="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    <ellipse cx="23" cy="44" rx="7" ry="3.5" fill="#FDE047" stroke="#D97706" strokeWidth="1" />
    <ellipse cx="33" cy="42" rx="7" ry="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
    <ellipse cx="28" cy="38" rx="6.5" ry="3" fill="#FDE047" stroke="#D97706" strokeWidth="1" />
    {/* Gold coin outside leaning */}
    <ellipse cx="44" cy="50" rx="6" ry="7" fill="#F59E0B" stroke="#B45309" strokeWidth="1" transform="rotate(-15 44 50)" />
  </svg>
);

// Clipboard with Checklist & Magnifying Glass (Empty State)
export const EmptyCategoryIllustration = () => (
  <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="boardGrad" x1="20" y1="10" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F5F3FF" />
        <stop offset="100%" stopColor="#EDE9FE" />
      </linearGradient>
    </defs>
    {/* Clipboard Base */}
    <rect x="25" y="12" width="50" height="66" rx="8" fill="url(#boardGrad)" stroke="#DDD6FE" strokeWidth="1.5" />
    {/* Clip at top */}
    <rect x="38" y="8" width="24" height="8" rx="3" fill="#C084FC" />
    <rect x="44" y="6" width="12" height="4" rx="2" fill="#7C3AED" />
    {/* Checklist lines */}
    <rect x="34" y="26" width="18" height="3" rx="1.5" fill="#A855F7" />
    <rect x="34" y="34" width="26" height="3" rx="1.5" fill="#D8B4FE" />
    <rect x="34" y="42" width="22" height="3" rx="1.5" fill="#D8B4FE" />
    {/* Mini bar chart on paper */}
    <rect x="34" y="58" width="4" height="10" rx="1" fill="#C084FC" />
    <rect x="41" y="52" width="4" height="16" rx="1" fill="#A855F7" />
    <rect x="48" y="55" width="4" height="13" rx="1" fill="#7C3AED" />
    {/* Magnifying Glass */}
    <circle cx="64" cy="52" r="13" fill="#FAF5FF" stroke="#7C3AED" strokeWidth="2.5" />
    <path d="M 73 61 L 83 72" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
    {/* Sparkles */}
    <circle cx="18" cy="30" r="1.5" fill="#C084FC" />
    <circle cx="82" cy="24" r="2" fill="#A855F7" />
    <circle cx="22" cy="65" r="1.5" fill="#DDD6FE" />
  </svg>
);
