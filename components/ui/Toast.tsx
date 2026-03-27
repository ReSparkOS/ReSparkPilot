'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

type ToastContextValue = {
  toast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DISMISS_MS = 3000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const toast = useCallback(
    (next: string) => {
      clearTimer()
      setMessage(next)
      timeoutRef.current = setTimeout(() => {
        setMessage(null)
        timeoutRef.current = null
      }, DISMISS_MS)
    },
    [clearTimer]
  )

  useEffect(() => () => clearTimer(), [clearTimer])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 safe-bottom"
          style={{ paddingBottom: 'max(5.5rem, env(safe-area-inset-bottom))' }}
          aria-live="polite"
        >
          <div
            className={cn(
              'pointer-events-auto mb-4 max-w-md rounded-card-sm bg-text-primary px-4 py-3 text-sm font-medium text-white shadow-lg animate-slide-up'
            )}
          >
            {message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
