// Team badge. Renders the club's external crest when a logo URL is available,
// otherwise falls back to a deterministic initial-based badge. Picks a stable
// accent + soft background from the team name so the same team always renders
// the same fallback badge.

import { useState } from 'react'
import { teamLogoUrl } from '../../utils/teamLogos'

const ACCENTS = ['#0D47A1', '#1E88E5', '#FFC107', '#E09B00', '#4CAF50', '#F44336']

function hashOf(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function TeamCrest({ name, size = 44, className = '' }) {
  const accent = ACCENTS[hashOf(name) % ACCENTS.length]
  const [logoFailed, setLogoFailed] = useState(false)
  const src = logoFailed ? '' : teamLogoUrl(name)

  if (src) {
    return (
      <span
        className={`inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className="h-full w-full rounded-full object-cover"
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-black ring-2 ring-white/10 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${accent}22`,
        color: accent,
        fontSize: size * 0.36,
        boxShadow: `0 0 ${size / 3}px ${accent}33`,
      }}
    >
      {initials(name)}
    </span>
  )
}
