'use client'

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, id, ...props }, ref) {
    const autoId = useId()
    const inputId = id ?? props.name ?? autoId
    const errorId = `${inputId}-error`

    return (
      <div className="w-full">
        {label != null && label !== '' && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-card-sm border bg-surface px-4 py-3 text-sm text-text-primary transition-all duration-200',
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

Input.displayName = 'Input'
