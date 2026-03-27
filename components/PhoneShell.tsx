'use client'

import { useEffect, useState, type ReactNode } from 'react'

type PhoneShellProps = {
  children: ReactNode
}

function StatusBarIcons() {
  const barHeights = [3, 5, 7, 9]
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <svg width="18" height="11" viewBox="0 0 18 11" fill="none" className="text-text-primary">
        {barHeights.map((h, i) => (
          <rect key={i} x={1 + i * 4} y={10 - h} width="2.5" height={h} rx="0.5" fill="currentColor" />
        ))}
      </svg>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-text-primary">
        <path
          d="M7.5 2.5c2.2 0 4 1.4 4.5 3.3.1.3 0 .6-.3.7h-8.4a.5.5 0 0 1-.3-.7c.5-1.9 2.3-3.3 4.5-3.3Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M2 8.5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <svg width="24" height="11" viewBox="0 0 24 11" fill="none" className="text-text-primary">
        <rect x="1" y="2" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="20" y="4" width="2" height="3" rx="0.5" fill="currentColor" />
        <rect x="2.5" y="3.5" width="12" height="4" rx="0.5" fill="currentColor" />
      </svg>
    </div>
  )
}

function PhoneShell({ children }: PhoneShellProps) {
  const [showShell, setShowShell] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setShowShell(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!showShell) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0EEE8]">
      <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[44px] border-2 border-border bg-bg shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between bg-bg px-6">
          <span className="text-sm font-semibold text-text-primary">9:41</span>
          <StatusBarIcons />
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-11">{children}</div>
        </div>
      </div>
    </div>
  )
}

export { PhoneShell }
export default PhoneShell
