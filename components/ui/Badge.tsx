import { type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Matches `globals.css` --text-muted for hex alpha suffix `${color}20`. */
const DEFAULT_COLOR = '#A09D97'

export type BadgeProps = {
  children?: ReactNode
  color?: string
  size?: 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
} as const

export function Badge({
  children,
  color = DEFAULT_COLOR,
  size = 'md',
  className,
}: BadgeProps) {
  const style: CSSProperties = {
    backgroundColor: `${color}20`,
    color,
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-pill',
        sizeClasses[size],
        className
      )}
      style={style}
    >
      {children}
    </span>
  )
}
