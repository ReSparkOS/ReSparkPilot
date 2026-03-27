'use client'

import type { EnergyLevel } from '@/lib/types'
import { ENERGY_CONFIG } from '@/lib/types'

const BADGE_STYLE: Record<EnergyLevel, { bg: string; fg: string }> = {
  god:      { bg: '#FDF0EB', fg: '#E8714A' },
  fine:     { bg: '#FEF5E7', fg: '#F0A030' },
  existing: { bg: '#FEF5E7', fg: '#F0A030' },
  fumes:    { bg: '#EEF1F8', fg: '#8B9FC4' },
}

type EnergyBadgeProps = {
  energy: EnergyLevel
  onClick?: () => void
}

export function EnergyBadge({ energy, onClick }: EnergyBadgeProps) {
  const config = ENERGY_CONFIG[energy]
  const colors = BADGE_STYLE[energy]
  const style = { backgroundColor: colors.bg, color: colors.fg }

  const content = (
    <>
      <span aria-hidden>{config.emoji}</span>
      <span>{config.label}</span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={style}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
      >
        {content}
      </button>
    )
  }

  return (
    <span
      style={style}
      className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium"
    >
      {content}
    </span>
  )
}
