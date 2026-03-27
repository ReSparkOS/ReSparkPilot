'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Mic, Plus } from 'lucide-react'
import { TaskCard } from '@/components/TaskCard'
import { EnergyBadge } from '@/components/EnergyBadge'
import { LogoLockup } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import {
  addTask,
  toggleTask,
  generateId,
  getEnergy,
  getTasks,
  setEnergy as persistEnergy,
} from '@/lib/storage'
import { getNextAction } from '@/lib/mock-ai'
import type { EnergyLevel, Task } from '@/lib/types'
import { ENERGY_CONFIG } from '@/lib/types'

const ENERGY_ORDER: EnergyLevel[] = ['god', 'fine', 'existing', 'fumes']

function formatTodayLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()
  return `${weekday}, ${month} ${day}`
}

const fadeInUpClass =
  'animate-fade-in-up opacity-0 [animation-fill-mode:forwards]'

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [energy, setEnergy] = useState<EnergyLevel>('fine')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [energySheetOpen, setEnergySheetOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddText, setQuickAddText] = useState('')
  const [recommendedTask, setRecommendedTask] = useState<Task | null>(null)

  useEffect(() => {
    setTasks(getTasks())
    const stored = getEnergy()
    setEnergy(stored?.level ?? 'fine')
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next = await getNextAction(tasks, energy)
      if (!cancelled) setRecommendedTask(next)
    })()
    return () => {
      cancelled = true
    }
  }, [tasks, energy])

  const sortedTasks = useMemo(() => {
    const relevant = tasks.filter((t) => t.status === 'active' || t.status === 'done')
    return [...relevant].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      return 0
    })
  }, [tasks])

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    const wasDone = task?.status === 'done'
    toggleTask(id)
    setTasks(getTasks())
    setExpandedTaskId((cur) => (cur === id ? null : cur))
    toast(wasDone ? 'Spark restored' : 'Spark completed ✓')
  }

  const handleExpand = (id: string) => {
    setExpandedTaskId((cur) => (cur === id ? null : id))
  }

  const handleEnergySelect = (level: EnergyLevel) => {
    persistEnergy(level)
    setEnergy(level)
    setEnergySheetOpen(false)
  }

  const handleNotNow = async () => {
    if (!recommendedTask) return
    const masked = tasks.map((t) =>
      t.id === recommendedTask.id ? { ...t, status: 'archived' as const } : t
    )
    const next = await getNextAction(masked, energy)
    setRecommendedTask(next)
  }

  const handleStartFocus = () => {
    router.push('/focus')
  }

  const handleQuickAddSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = quickAddText.trim()
    if (!text) return
    addTask({
      id: generateId(),
      text,
      tag: 'Other',
      energyCost: 'medium',
      priority: 'soon',
      status: 'active',
      createdAt: new Date().toISOString(),
    })
    setQuickAddText('')
    setQuickAddOpen(false)
    setTasks(getTasks())
    toast('Spark caught ✓')
  }

  return (
    <div className="relative min-h-full pb-28">
      <header className="flex items-start justify-between px-5 pb-3 pt-5">
        <div>
          <LogoLockup size={28} />
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            {formatTodayLabel(new Date())}
          </p>
        </div>
        <div className="flex items-center">
          <EnergyBadge energy={energy} onClick={() => setEnergySheetOpen(true)} />
        </div>
      </header>

      <BottomSheet
        open={energySheetOpen}
        onClose={() => setEnergySheetOpen(false)}
        title="How's your brain right now?"
      >
        <div className="mt-2 flex flex-col gap-3">
          {ENERGY_ORDER.map((level) => {
            const cfg = ENERGY_CONFIG[level]
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleEnergySelect(level)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-card-sm border border-border bg-surface p-4 text-left transition-colors hover:border-accent/30"
              >
                <span className="text-2xl" aria-hidden>
                  {cfg.emoji}
                </span>
                <span className="text-sm font-medium text-text-primary">{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </BottomSheet>

      <section className="mt-2 px-5">
        <Card
          variant="accent"
          className={`${fadeInUpClass}`}
          style={{ animationDelay: '0ms' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
            ✦ YOUR ONE SPARK RIGHT NOW
          </p>
          {recommendedTask ? (
            <>
              <p className="mt-2 text-[15px] font-semibold text-text-primary">
                {recommendedTask.text}
              </p>
              <div className="mt-4 flex gap-3">
                <Button variant="primary" size="sm" type="button" onClick={handleStartFocus}>
                  Start →
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => void handleNotNow()}>
                  Not now
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[15px] font-semibold text-text-primary">
              Your mind is clear. Enjoy it, or add something.
            </p>
          )}
        </Card>
      </section>

      <section className="mt-6 px-5">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          ALL SPARKS — {sortedTasks.length}
        </h2>

        {sortedTasks.length === 0 ? (
          <div
            className={`mx-auto mt-10 flex max-w-xs flex-col items-center text-center ${fadeInUpClass}`}
            style={{ animationDelay: '50ms' }}
          >
            <span className="text-3xl" aria-hidden>
              ✨
            </span>
            <p className="mt-3 text-sm text-text-secondary">
              No sparks yet. Tap Dump to add what&apos;s on your mind.
            </p>
            <Link
              href="/dump"
              className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Go to Dump
            </Link>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {sortedTasks.map((task, index) => (
              <li
                key={task.id}
                className={fadeInUpClass}
                style={{ animationDelay: `${(1 + index) * 50}ms` }}
              >
                <TaskCard
                  task={task}
                  onComplete={handleToggle}
                  onExpand={handleExpand}
                  expanded={expandedTaskId === task.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        className="absolute bottom-20 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-opacity hover:opacity-90"
        aria-label="Quick add spark"
      >
        <Plus size={24} strokeWidth={2.25} aria-hidden />
      </button>

      <BottomSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)}>
        <form onSubmit={handleQuickAddSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Input
                placeholder="What's one thing?"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary"
              aria-label="Voice input (coming soon)"
            >
              <Mic size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <Button variant="primary" size="full" type="submit">
            Catch this spark →
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
