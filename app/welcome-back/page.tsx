'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneShell from '@/components/PhoneShell'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/Logo'
import {
  getDaysSinceLastOpen,
  getTasks,
  getUser,
  archiveTask,
  updateLastOpen,
} from '@/lib/storage'

const THREE_DAYS_MS = 3 * 86_400_000

function countAndArchiveStaleTasks(): number {
  const tasks = getTasks()
  const threshold = Date.now() - THREE_DAYS_MS
  let n = 0
  for (const t of tasks) {
    if (t.status !== 'active') continue
    const created = Date.parse(t.createdAt)
    if (!Number.isNaN(created) && created < threshold) {
      archiveTask(t.id)
      n += 1
    }
  }
  return n
}

export default function WelcomeBackPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<{ days: number | null; archived: number } | null>(null)
  const [displayName, setDisplayName] = useState('friend')

  useEffect(() => {
    const u = getUser()
    if (u?.name?.trim()) setDisplayName(u.name)
    const days = getDaysSinceLastOpen()
    const archived = countAndArchiveStaleTasks()
    updateLastOpen()
    setMetrics({ days, archived })
  }, [])

  const daysAtOpen = metrics?.days ?? null
  const archivedQuietly = metrics?.archived ?? 0
  const useFallbackStats = metrics == null || daysAtOpen == null || daysAtOpen === 0
  const daysPhrase = useFallbackStats
    ? 'a few days ago'
    : `${daysAtOpen} day${daysAtOpen === 1 ? '' : 's'} ago`
  const archivedDisplay = useFallbackStats ? 4 : archivedQuietly

  return (
    <PhoneShell>
      <div className="flex min-h-[calc(100dvh-2.75rem)] flex-col items-center justify-center px-8 pb-12 pt-8 text-center">
        <LogoMark size={40} />
        <h1 className="font-display mt-6 max-w-[320px] text-[28px] leading-tight text-text-primary">
          Welcome back, {displayName}.
        </h1>
        <p className="text-text-secondary mx-auto mt-4 max-w-[300px] text-base leading-relaxed">
          No judgment. We quietly archived anything stale while you were gone. Clean slate.
        </p>

        <div className="bg-surface-alt rounded-card-sm mt-6 w-full max-w-[320px] p-4 text-left">
          <p className="text-text-muted text-[10px] font-medium uppercase tracking-wider">Last time you were here</p>
          <p className="text-text-secondary mt-1 text-sm">
            {daysPhrase} · {archivedDisplay} task{archivedDisplay === 1 ? '' : 's'} archived quietly
          </p>
        </div>

        <div className="mt-6 flex w-full max-w-[320px] flex-col gap-3">
          <Button type="button" variant="primary" size="full" onClick={() => router.push('/dump')}>
            What&apos;s on my mind now →
          </Button>
          <Button type="button" variant="secondary" size="full" onClick={() => router.push('/home')}>
            Pick up where I left off
          </Button>
          <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => router.push('/archive')}>
            Show me the archive
          </Button>
        </div>
      </div>
    </PhoneShell>
  )
}
