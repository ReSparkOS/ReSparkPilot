'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getDaysSinceLastOpen, seedDemoData } from '@/lib/storage'
import { LogoMark } from '@/components/Logo'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    seedDemoData()

    const user = getUser()
    if (!user || !user.onboardingComplete) {
      router.replace('/onboarding')
      return
    }

    const daysSinceOpen = getDaysSinceLastOpen()
    if (daysSinceOpen !== null && daysSinceOpen >= 3) {
      router.replace('/welcome-back')
      return
    }

    router.replace('/home')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="animate-pulse-gentle">
        <LogoMark size={48} />
      </div>
    </div>
  )
}
