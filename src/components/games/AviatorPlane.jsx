import { useId } from 'react'

// Side-view airliner used by the Aviator game, drawn in the style of a classic
// crash-game plane: red livery, white belly and a gold cheatline. The nose
// points right so the artwork can be rotated along the flight path.
export default function AviatorPlane({ className }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <svg
      viewBox="0 0 160 80"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8f1414" />
          <stop offset="26%" stopColor="#c62828" />
          <stop offset="44%" stopColor="#e53935" />
          <stop offset="49.5%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#a9b5c6" />
        </linearGradient>
        <linearGradient id={`fin-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e53935" />
          <stop offset="100%" stopColor="#8f1414" />
        </linearGradient>
        <linearGradient id={`tail-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c62828" />
          <stop offset="100%" stopColor="#8f1414" />
        </linearGradient>
        <linearGradient id={`wing-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#e8eef6" />
          <stop offset="55%" stopColor="#c3cedd" />
          <stop offset="100%" stopColor="#8e9db2" />
        </linearGradient>
        <linearGradient id={`engine-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6ecf4" />
          <stop offset="45%" stopColor="#c3cedd" />
          <stop offset="100%" stopColor="#7b8a9e" />
        </linearGradient>
        <linearGradient id={`cockpit-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e4d78" />
          <stop offset="55%" stopColor="#0f2f4f" />
          <stop offset="100%" stopColor="#071c2e" />
        </linearGradient>
      </defs>

      {/* Vertical stabiliser */}
      <path d="M41 34 L33 9 L25 12 L15 34 Z" fill={`url(#fin-${uid})`} />
      <path d="M33 9 L36.5 13 L21 33 L17 33 Z" fill="#ffc107" opacity="0.92" />
      <path d="M36.5 13 L39 16 L24 33 L21 33 Z" fill="#ffffff" opacity="0.55" />
      <path d="M41 34 C45 33 48 32 51 32 L41 27 Z" fill="#a71b1b" />

      {/* Horizontal stabiliser */}
      <path d="M44 43 L46 48 L16 54 L12 49 Z" fill={`url(#tail-${uid})`} />
      <path d="M43 44 L44 46 L15 52 L14 50 Z" fill="#ffffff" opacity="0.18" />

      {/* Fuselage */}
      <path
        d="M16 33 C40 27 80 26 118 27 C134 27.5 147 32 154 40 C147 48 134 52.5 118 53 C80 54 40 53 16 47 C14 42 14 38 16 33 Z"
        fill={`url(#body-${uid})`}
      />

      {/* Gold cheatline */}
      <path
        d="M17 40 C58 38.6 108 38.6 153 40"
        fill="none"
        stroke="#ffc107"
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      {/* Cockpit glazing */}
      <path
        d="M128 31.2 C136 31.2 143 34.1 148.5 37.6 L131.5 37.6 Z"
        fill={`url(#cockpit-${uid})`}
      />
      <path d="M131 33.3 C135 33.3 138 34.3 140.4 35.6 L132 35.6 Z" fill="#ffffff" opacity="0.28" />
      <path d="M136.5 32.1 L136.5 37.6 M142.5 35 L142.5 37.6" stroke="#dbe6f2" strokeWidth="0.7" opacity="0.55" />

      {/* Cabin windows */}
      {Array.from({ length: 11 }).map((_, i) => (
        <rect
          key={i}
          x={50 + i * 6.4}
          y={36.1}
          width={3.2}
          height={2.3}
          rx={1.1}
          fill="#1e293b"
          opacity="0.85"
        />
      ))}

      {/* Doors */}
      <rect x="43.5" y="32.2" width="3.6" height="13.6" rx="1.8" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="0.6" />
      <rect x="122" y="32.4" width="3.4" height="12.6" rx="1.7" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="0.6" />

      {/* Main wing */}
      <path
        d="M112 46 L115 52 C100 61 78 68 60 73 L54 69 C68 60 88 52 112 46 Z"
        fill={`url(#wing-${uid})`}
      />
      <path d="M111 47.6 C88 53 69 61 56 70" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" />
      <path d="M54 69 L60 73 L57.5 67.5 Z" fill="#e53935" />

      {/* Engine nacelle */}
      <g transform="rotate(-4 100 59.5)">
        <rect x="82" y="53" width="38" height="13" rx="6.5" fill={`url(#engine-${uid})`} />
        <rect x="110" y="53" width="4.5" height="13" fill="#e53935" opacity="0.9" />
        <ellipse cx="119" cy="59.5" rx="3" ry="6.5" fill="#263445" />
        <ellipse cx="119" cy="59.5" rx="1.5" ry="4" fill="#0f172a" />
        <ellipse cx="85" cy="59.5" rx="2.2" ry="5" fill="#94a3b8" />
        <path d="M86 55.2 H114" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
      </g>

      {/* Airframe highlights and panel lines */}
      <path
        d="M22 32.4 C56 28.4 96 27.3 127 28.6"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.34"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M30 49.6 C70 51.8 110 51.6 138 48.2"
        fill="none"
        stroke="#64748b"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M40 28.5 C40 34 40 39 40 44" stroke="#7f1d1d" strokeOpacity="0.45" strokeWidth="0.6" />

      {/* Navigation lights */}
      <circle cx="56" cy="71" r="1.5" fill="#f87171" />
      <circle cx="16.5" cy="33.5" r="1.2" fill="#ffffff" opacity="0.85" />
    </svg>
  )
}
