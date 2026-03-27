'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SparkBuddy } from '@/components/SparkBuddy'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { addSession, generateId, getTasks } from '@/lib/storage'
import { getCheckIn } from '@/lib/mock-ai'
import type { Task } from '@/lib/types'

type SessionState = 'idle' | 'active' | 'complete'

const DEMO_CHECK_IN_INTERVAL_SEC = 30

const DURATION_PRESETS = [15, 25, 45] as const

function formatMmSs(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : ''
  const s = Math.abs(Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${sign}${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export default function FocusPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [topTasks, setTopTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [customTaskText, setCustomTaskText] = useState('')
  const [duration, setDuration] = useState(25)
  const [durationIsCustom, setDurationIsCustom] = useState(false)
  const [customDurationText, setCustomDurationText] = useState('')
  const [checkInEnabled, setCheckInEnabled] = useState(true)

  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [plannedSeconds, setPlannedSeconds] = useState(0)
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string>('')
  const [activeTaskText, setActiveTaskText] = useState('')
  const [activeSubSteps, setActiveSubSteps] = useState<string[] | undefined>(undefined)
  const [currentSubStep, setCurrentSubStep] = useState(1)

  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')
  const [checkInSidetracked, setCheckInSidetracked] = useState(false)
  const [lastCheckInResponse, setLastCheckInResponse] = useState<string | undefined>(undefined)

  const [showHyperfocusWarning, setShowHyperfocusWarning] = useState(false)
  const [timerEnded, setTimerEnded] = useState(false)
  const [completedFocusMinutes, setCompletedFocusMinutes] = useState(0)
  const [completionNotes, setCompletionNotes] = useState('')
  const [nextStep, setNextStep] = useState('')

  const focusedElapsedRef = useRef(0)
  const lastCheckInAtFocusedRef = useRef(0)
  const timerEndedRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const effectiveTaskText = useMemo(() => {
    if (selectedTask) return selectedTask.text
    return customTaskText.trim()
  }, [selectedTask, customTaskText])

  const canStart = effectiveTaskText.length > 0

  const effectiveDurationMinutes = useMemo(() => {
    if (durationIsCustom) {
      const n = parseInt(customDurationText, 10)
      return Number.isFinite(n) && n > 0 ? Math.min(n, 240) : 25
    }
    return duration
  }, [duration, durationIsCustom, customDurationText])

  useEffect(() => {
    setTopTasks(getTasks().filter((t) => t.status === 'active').slice(0, 3))
  }, [sessionState])

  const clearTimer = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const startSession = useCallback(() => {
    if (!canStart) return

    const text = effectiveTaskText
    const taskId = selectedTask?.id ?? generateId()
    const subSteps = selectedTask?.subSteps
    const totalSec = effectiveDurationMinutes * 60

    setActiveTaskId(taskId)
    setActiveTaskText(text)
    setActiveSubSteps(subSteps)
    setCurrentSubStep(subSteps && subSteps.length > 0 ? 1 : 1)
    setPlannedSeconds(totalSec)
    setTimeRemaining(totalSec)
    setIsPaused(false)
    setSessionStartedAt(new Date().toISOString())
    timerEndedRef.current = false
    focusedElapsedRef.current = 0
    lastCheckInAtFocusedRef.current = 0
    setShowCheckIn(false)
    setCheckInSidetracked(false)
    setCheckInMessage('')
    setSessionState('active')
  }, [canStart, effectiveDurationMinutes, effectiveTaskText, selectedTask])

  useEffect(() => {
    if (sessionState !== 'active') {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        focusedElapsedRef.current += 1

        setTimeRemaining((prev) => {
          const next = prev - 1
          if (next === 0) {
            timerEndedRef.current = true
            setTimerEnded(true)
          }
          return next
        })

        if (checkInEnabled && !showCheckIn) {
          const delta = focusedElapsedRef.current - lastCheckInAtFocusedRef.current
          if (delta >= DEMO_CHECK_IN_INTERVAL_SEC) {
            lastCheckInAtFocusedRef.current = focusedElapsedRef.current
            const mins = Math.max(1, Math.floor(focusedElapsedRef.current / 60))
            void getCheckIn(activeTaskText, mins, lastCheckInResponse).then((msg) => {
              setCheckInMessage(msg)
              setCheckInSidetracked(false)
              setShowCheckIn(true)
            })
          }
        }
      }

    }, 1000)

    return () => clearTimer()
  }, [
    sessionState,
    isPaused,
    checkInEnabled,
    showCheckIn,
    activeTaskText,
    sessionStartedAt,
    plannedSeconds,
    clearTimer,
  ])

  const progressPct = useMemo(() => {
    if (plannedSeconds <= 0) return 0
    const elapsed = plannedSeconds - timeRemaining
    return Math.min(100, Math.max(0, (elapsed / plannedSeconds) * 100))
  }, [plannedSeconds, timeRemaining])

  const handleCheckInResponse = (response: string) => {
    if (response.includes('Got sidetracked')) {
      setLastCheckInResponse('distracted')
      setCheckInSidetracked(true)
      setCheckInMessage('No worries. Want to come back to it, or switch tasks?')
      return
    }
    if (checkInSidetracked) {
      setLastCheckInResponse('on-track')
      setShowCheckIn(false)
      setCheckInSidetracked(false)
      return
    }
    if (response.includes('Done with step')) {
      setLastCheckInResponse('done-step')
      if (activeSubSteps && currentSubStep < activeSubSteps.length) {
        setCurrentSubStep((s) => s + 1)
      }
    } else {
      setLastCheckInResponse('on-track')
    }
    setShowCheckIn(false)
    setCheckInSidetracked(false)
  }

  const goToComplete = useCallback(() => {
    clearTimer()
    const mins = Math.max(1, Math.round(focusedElapsedRef.current / 60))
    setCompletedFocusMinutes(mins)
    setShowCheckIn(false)
    setSessionState('complete')
  }, [clearTimer])

  useEffect(() => {
    if (sessionState !== 'active' || !timerEnded) return
    if (timeRemaining <= -60 && !showHyperfocusWarning) {
      setShowHyperfocusWarning(true)
    }
  }, [sessionState, timerEnded, timeRemaining, showHyperfocusWarning])

  const endSession = () => {
    goToComplete()
  }

  const saveAndRest = () => {
    if (!sessionStartedAt) return
    addSession({
      id: generateId(),
      taskId: activeTaskId,
      taskText: activeTaskText,
      duration: effectiveDurationMinutes,
      startedAt: sessionStartedAt,
      endedAt: new Date().toISOString(),
      completedSteps: completionNotes.trim() ? [completionNotes.trim()] : undefined,
      nextStep: nextStep.trim() || undefined,
    })
    toast('Session saved. Nice work.')
    router.push('/home')
  }

  if (sessionState === 'complete') {
    return (
      <div className="flex min-h-full flex-col bg-[var(--surface-focus)] px-5 pb-8 pt-12 text-white">
        <div className="mx-auto flex w-full max-w-[320px] flex-col items-center text-center">
          <span className="text-5xl" aria-hidden>
            ✨
          </span>
          <h1 className="font-display mt-4 text-[24px] text-white">Session complete!</h1>
          <p className="mt-1 text-sm text-white/60">
            {completedFocusMinutes} minutes of focus
          </p>
          <div className="mt-8 w-full space-y-4 text-left">
            <Textarea
              placeholder="What did you get done?"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
            />
            <Input
              placeholder="What&apos;s the next tiny thing when you come back?"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
            />
          </div>
          <Button variant="primary" size="full" className="mt-6" onClick={saveAndRest}>
            Save and rest
          </Button>
        </div>
      </div>
    )
  }

  if (sessionState === 'active') {
    return (
      <div className="relative flex min-h-full flex-col bg-[var(--surface-focus)] pb-36 text-white">
        <header className="px-5 pt-6 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-accent">Spark session</p>
          <p className={`font-display mt-2 text-[48px] tabular-nums ${timerEnded ? 'text-accent' : 'text-white'}`}>
            {timerEnded ? `+${formatMmSs(Math.abs(timeRemaining))}` : formatMmSs(timeRemaining)}
          </p>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="h-5 w-5" fill="currentColor" /> : <Pause className="h-5 w-5" />}
          </button>
        </header>

        <section className="mt-6 px-5">
          <div className="rounded-card border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Working on</p>
            <p className="mt-1 text-lg font-semibold text-white">{activeTaskText}</p>
            {activeSubSteps && activeSubSteps.length > 0 ? (
              <p className="mt-1 text-sm text-white/60">
                Step {currentSubStep} of {activeSubSteps.length} ·{' '}
                {activeSubSteps[Math.min(currentSubStep, activeSubSteps.length) - 1]}
              </p>
            ) : null}
          </div>
        </section>

        {checkInEnabled && showCheckIn ? (
          <section className="mt-6 px-5">
            <div
              className="[&>div]:border-white/15 [&>div]:bg-white/[0.08] [&_button]:border-white/15 [&_button]:bg-white/10 [&_button]:text-white/90 [&_button:hover]:border-accent/40 [&_p]:text-white/90 [&_span.text-spark]:text-accent [&_span.text-xs]:text-accent"
            >
              <SparkBuddy
                message={checkInMessage}
                onResponse={handleCheckInResponse}
                responses={
                  checkInSidetracked
                    ? ['Come back to it', 'Switch tasks']
                    : ['👍 Still going', '🐿️ Got sidetracked', '✅ Done with step']
                }
              />
            </div>
          </section>
        ) : null}

        {showHyperfocusWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="mx-5 max-w-[300px] rounded-card border border-white/10 bg-[var(--surface-focus)] p-6 text-center">
              <p className="text-base font-medium text-white">
                Heads up — you&apos;ve been at this for {Math.round(focusedElapsedRef.current / 60)} minutes.
              </p>
              <p className="mt-2 text-sm text-white/60">
                Do you have anything coming up?
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="w-full !text-white/70 hover:!text-white"
                  onClick={() => setShowHyperfocusWarning(false)}
                >
                  I&apos;m good, keep going
                </Button>
                <Button
                  variant="primary"
                  size="full"
                  onClick={endSession}
                >
                  Good call, wrapping up
                </Button>
              </div>
            </div>
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[var(--surface-focus)] px-5 pt-3 backdrop-blur-md"
          style={{
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="h-1 w-full rounded-full bg-white/10">
            <div
              className="h-1 rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <Button
            variant="ghost"
            className="mt-4 w-full !text-sm !text-white/60 hover:!text-white/90"
            onClick={endSession}
          >
            End session
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--surface-focus)] pb-8 text-white">
      <header className="px-5 pt-8 text-center">
        <h1 className="font-display text-[28px] text-white">Ready to spark?</h1>
        <p className="mx-auto mt-2 max-w-[280px] text-sm text-white/60">
          Start a focus session and I&apos;ll check in every 15 minutes.
        </p>
      </header>

      <section className="mt-8 px-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">What are you working on?</p>
        <div className="mt-3 flex flex-col gap-2">
          {topTasks.map((task) => {
            const selected = selectedTask?.id === task.id
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  setSelectedTask(task)
                  setCustomTaskText('')
                }}
                className={`cursor-pointer rounded-card-sm border p-3 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                }`}
              >
                <span className="text-sm text-white/90">{task.text}</span>
              </button>
            )
          })}
        </div>
        <Input
          placeholder="Or type something else"
          value={customTaskText}
          onChange={(e) => {
            setCustomTaskText(e.target.value)
            if (e.target.value.trim()) setSelectedTask(null)
          }}
          className="mt-3 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
        />
      </section>

      <section className="mt-6 px-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Duration</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((m) => {
            const selected = !durationIsCustom && duration === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setDurationIsCustom(false)
                  setDuration(m)
                }}
                className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-transparent bg-accent text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white/80'
                }`}
              >
                {m} min
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setDurationIsCustom(true)}
            className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
              durationIsCustom
                ? 'border-transparent bg-accent text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:text-white/80'
            }`}
          >
            Custom
          </button>
        </div>
        {durationIsCustom ? (
          <Input
            placeholder="Minutes"
            inputMode="numeric"
            value={customDurationText}
            onChange={(e) => setCustomDurationText(e.target.value.replace(/\D/g, ''))}
            className="mt-3 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
          />
        ) : null}
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-white/80">Check in on me (every 15 min)</span>
          <Toggle
            checked={checkInEnabled}
            onCheckedChange={setCheckInEnabled}
            aria-label="Enable check-ins"
            className={checkInEnabled ? 'bg-accent' : 'bg-white/20'}
          />
        </div>
      </section>

      <div className="mt-8 px-5">
        <Button variant="primary" size="full" disabled={!canStart} onClick={startSession}>
          Start Session →
        </Button>
      </div>
    </div>
  )
}
