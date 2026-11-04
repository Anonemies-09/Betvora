import { cn } from '../../utils/cn'

import logoUrl from '../../assets/betvora-logo.png'

export default function Logo({ withText = true, size = 36, className, imgClassName }) {
  return (
    <span className={cn('inline-flex items-center leading-none', className)}>
      <img
        src={logoUrl}
        alt="BETVORA"
        title={withText ? 'BETVORA' : undefined}
        style={{ height: size, width: 'auto' }}
        className={cn('object-contain select-none glow-gold', imgClassName)}
        draggable={false}
      />
    </span>
  )
}
