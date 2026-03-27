'use client'

import { type ReactNode, useEffect } from 'react'
import { cn } from '@/lib/cn'

export type BottomSheetProps = {
  open: boolean
  onClose: () => void
  children?: ReactNode
  title?: string
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" aria-modal role="dialog">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-surface animate-slide-up',
          className
        )}
      >
        <div
          className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border-strong"
          aria-hidden
        />
        {title ? (
          <h2 className="px-6 pt-4 text-base font-medium text-text-primary">
            {title}
          </h2>
        ) : null}
        <div className="safe-bottom px-6 pb-8 pt-2">{children}</div>
      </div>
    </div>
  )
}
