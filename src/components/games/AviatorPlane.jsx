import { useId } from 'react'

// Top-down jet artwork used by the Aviator game. Drawn as SVG so it stays
// crisp at any size and can rotate with the flight path without an image load.
export default function AviatorPlane({ className }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e9eff7" />
          <stop offset="100%" stopColor="#93a6bd" />
        </linearGradient>
        <linearGradient id={`wing-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfdbe9" />
          <stop offset="60%" stopColor="#9db1c8" />
          <stop offset="100%" stopColor="#6f839c" />
        </linearGradient>
        <linearGradient id={`tail-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c90a8" />
          <stop offset="100%" stopColor="#d3dfec" />
        </linearGradient>
        <linearGradient id={`stripe-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e09b00" />
          <stop offset="50%" stopColor="#ffc107" />
          <stop offset="100%" stopColor="#ffd54f" />
        </linearGradient>
        <linearGradient id={`cockpit-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a5f8f" />
          <stop offset="60%" stopColor="#12314f" />
          <stop offset="100%" stopColor="#08192a" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffd54f" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff8f00" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Engine glow */}
      <circle cx="54" cy="35" r="10" fill={`url(#glow-${uid})`} opacity="0.5" />
      <circle cx="54" cy="85" r="10" fill={`url(#glow-${uid})`} opacity="0.5" />

      {/* Main wings */}
      <path d="M60 53 L78 53 L46 8 L31 14 Z" fill={`url(#wing-${uid})`} />
      <path d="M60 67 L78 67 L46 112 L31 106 Z" fill={`url(#wing-${uid})`} />
      <path d="M46 8 L31 14 L35 21 L48 14 Z" fill={`url(#stripe-${uid})`} opacity="0.9" />
      <path d="M46 112 L31 106 L35 99 L48 106 Z" fill={`url(#stripe-${uid})`} opacity="0.9" />

      {/* Tail stabilisers */}
      <path d="M20 54 L31 54 L20 36 L11 40 Z" fill={`url(#tail-${uid})`} />
      <path d="M20 66 L31 66 L20 84 L11 80 Z" fill={`url(#tail-${uid})`} />
      <path d="M20 36 L11 40 L13 44 L21 41 Z" fill={`url(#stripe-${uid})`} opacity="0.75" />
      <path d="M20 84 L11 80 L13 76 L21 79 Z" fill={`url(#stripe-${uid})`} opacity="0.75" />

      {/* Engine nacelles */}
      <g transform="rotate(-19 70 34)">
        <rect x="57" y="28" width="26" height="12" rx="6" fill="#42586f" />
        <rect x="72" y="28" width="11" height="12" rx="6" fill="#243546" />
        <ellipse cx="56" cy="34" rx="3.4" ry="4.6" fill="#ffb300" opacity="0.9" />
      </g>
      <g transform="rotate(19 70 86)">
        <rect x="57" y="80" width="26" height="12" rx="6" fill="#42586f" />
        <rect x="72" y="80" width="11" height="12" rx="6" fill="#243546" />
        <ellipse cx="56" cy="86" rx="3.4" ry="4.6" fill="#ffb300" opacity="0.9" />
      </g>

      {/* Fuselage */}
      <path
        d="M20 60 C26 53 40 49 58 49 H88 C100 49 109 54 113 60 C109 66 100 71 88 71 H58 C40 71 26 67 20 60 Z"
        fill={`url(#body-${uid})`}
      />
      <path
        d="M24 60 H111"
        stroke={`url(#stripe-${uid})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Cockpit glass */}
      <path d="M92 55 C98 55 104 57 108 60 C104 63 98 65 92 65 Z" fill={`url(#cockpit-${uid})`} />
      <path d="M94 56.5 C98 56.5 101 58 103 60 L94 60 Z" fill="#ffffff" opacity="0.35" />

      {/* Roof highlight and panel lines */}
      <path d="M30 53 H84" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      <path d="M38 67 H78" stroke="#5d7188" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <circle cx="36" cy="60" r="1.5" fill="#5d7188" opacity="0.55" />
      <circle cx="45" cy="60" r="1.5" fill="#5d7188" opacity="0.55" />

      {/* Tail fin along the spine */}
      <path d="M20 60 L34 56 L34 60 L34 64 Z" fill={`url(#stripe-${uid})`} opacity="0.85" />
    </svg>
  )
}
