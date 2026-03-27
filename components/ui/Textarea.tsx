'use client'

import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, ...props }, ref) {
    const autoId = useId()
    const areaId = id ?? props.name ?? autoId
    const errorId = `${areaId}-error`

    return (
      <div className="w-full">
        {label != null && label !== '' && (
          <label
            htmlFor={areaId}
            className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-text-muted"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'min-h-[140px] w-full resize-none rounded-card-sm border bg-surface px-4 py-3 text-sm text-text-primary transition-all duration-200',
            'placeholder:text-text-muted',
            'focus:border-accent focus:ring-2 focus:ring-accent/10',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
              : 'border-border',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error ? (
          <p
            id={errorId}
            className="mt-1 text-xs text-red-500"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
