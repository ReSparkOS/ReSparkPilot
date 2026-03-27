import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type CardVariant =
  | 'default'
  | 'accent'
  | 'spark'
  | 'success'
  | 'warning'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
  children?: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface border border-border rounded-card shadow-sm',
  accent:
    'bg-accent-light border-[1.5px] border-accent-mid rounded-card',
  spark: 'bg-spark-light border border-spark/20 rounded-card',
  success: 'bg-success-light border border-success/20 rounded-card',
  warning: 'bg-warning-light border border-warning/20 rounded-card',
}

export function Card({
  variant = 'default',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'p-4 transition-all duration-200',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
