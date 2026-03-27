'use client'

import { useEffect } from 'react'
import PhoneShell from '@/components/PhoneShell'
import BottomNav from '@/components/BottomNav'
import { seedDemoData, updateLastOpen } from '@/lib/storage'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedDemoData()
    updateLastOpen()
  }, [])

  return (
    <PhoneShell>
      <div className="relative flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-[74px] scrollbar-hide">
          {children}
        </div>
        <BottomNav />
      </div>
    </PhoneShell>
  )
}
