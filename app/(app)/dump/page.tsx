'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Edit2, Mic, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { parseBrainDump } from '@/lib/mock-ai'
import { addTask, generateId, getEnergy, getTasks } from '@/lib/storage'
import { TAG_COLORS, type ParsedTask, type Task, type TaskPriority } from '@/lib/types'

const DRAFT_KEY = 'respark_brain_dump_draft'

const PROCESSING_TAGS = [
  'Taxes 🔴 Urgent',
  'Dentist 📞 Easy',
  'Proposal 🧠 High focus',
  'Text mom 💚 2 minutes',
] as const

const PRIORITY_BADGE: Record<
  TaskPriority,
  { label: string; color: string }
> = {
  urgent: { label: 'Urgent', color: '#DC2626' },
  soon: { label: 'Soon', color: '#CA8A04' },
  whenever: { label: 'Whenever', color: '#78716C' },
}

const ENERGY_LABEL: Record<ParsedTask['energyCost'], string> = {
  low: 'Low energy',
  medium: 'Medium focus',
  high: 'High focus',
}

function parsedToTask(p: ParsedTask, now: string): Task {
  return {
    id: generateId(),
    text: p.text,
    tag: p.tag,
    energyCost: p.energyCost,
    priority: p.priority,
    status: 'active',
    createdAt: now,
    ...(p.subSteps?.length ? { subSteps: p.subSteps } : {}),
  }
}

export default function BrainDumpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const taskListRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<'input' | 'processing' | 'results'>('input')
  const [dumpText, setDumpText] = useState('')
  const [resultTasks, setResultTasks] = useState<ParsedTask[]>([])
  const [recommendedId, setRecommendedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_KEY) : null
      if (raw) setDumpText(raw)
    } catch {
      /* ignore */
    }
  }, [])

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(140, el.scrollHeight)}px`
  }, [])

  useEffect(() => {
    if (phase === 'input') resizeTextarea()
  }, [dumpText, phase, resizeTextarea])

  useEffect(() => {
    if (phase !== 'processing') return

    let cancelled = false
    ;(async () => {
      const energy = getEnergy()?.level ?? 'fine'
      const existing = getTasks().filter(t => t.status === 'active').map(t => t.text)
      const { tasks, recommendedFirst } = await parseBrainDump(dumpText, energy, existing)
      if (cancelled) return
      setResultTasks(tasks)
      setRecommendedId(recommendedFirst.id)
      setPhase('results')
    })()

    return () => {
      cancelled = true
    }
  }, [phase, dumpText])

  const recommended = recommendedId
    ? resultTasks.find((t) => t.id === recommendedId) ?? null
    : null

  const toggleIncluded = (id: string) => {
    setResultTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, included: !t.included } : t)),
    )
  }

  const startEdit = (t: ParsedTask) => {
    setEditingId(t.id)
    setEditDraft(t.text)
  }

  const commitEdit = () => {
    if (!editingId) return
    setResultTasks((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, text: editDraft.trim() || t.text } : t)),
    )
    setEditingId(null)
    setEditDraft('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem(DRAFT_KEY, dumpText)
    } catch {
      /* ignore */
    }
    toast('Saved for later')
  }

  const handleAddAll = () => {
    const included = resultTasks.filter((t) => t.included)
    const now = new Date().toISOString()
    for (const p of included) {
      addTask(parsedToTask(p, now))
    }
    toast(`${included.length} sparks added to today`)
    router.push('/home')
  }

  const scrollToTasks = () => {
    taskListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (phase === 'processing') {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-5">
        <Card variant="spark" className="w-full max-w-sm">
          <div className="p-6 text-center">
            <span
              className="inline-block animate-pulse-gentle text-2xl text-spark"
              aria-hidden
            >
              ✦
            </span>
            <p className="mt-3 text-sm font-medium text-text-primary">
              ReSpark AI is sorting this...
            </p>
            <div className="mt-5 flex flex-col gap-2 text-left">
              {PROCESSING_TAGS.map((label, i) => (
                <p
                  key={label}
                  className="animate-fade-in text-xs text-text-secondary opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${300 + i * 300}ms` }}
                >
                  {label}
                </p>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'results') {
    const n = resultTasks.length
    return (
      <div className="pb-6">
        <header className="px-5 pt-5">
          <Sparkles className="h-6 w-6 text-accent" strokeWidth={2} aria-hidden />
          <h1 className="mt-2 font-display text-xl text-text-primary">
            Found {n} sparks in your dump
          </h1>
        </header>

        <div ref={taskListRef} className="mt-4 flex flex-col gap-3 px-5">
          {resultTasks.map((task, i) => (
            <div
              key={task.id}
              className="animate-fade-in-up flex gap-3 rounded-card-sm border border-border bg-surface p-3 opacity-0 [animation-fill-mode:forwards]"
              style={{ animationDelay: `${80 + i * 70}ms` }}
            >
              <button
                type="button"
                onClick={() => toggleIncluded(task.id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
                  task.included
                    ? 'border-accent bg-accent'
                    : 'border-border-strong bg-transparent'
                }`}
                aria-pressed={task.included}
                aria-label={task.included ? 'Exclude from today' : 'Include in today'}
              >
                {task.included ? (
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} aria-hidden />
                ) : null}
              </button>

              <div className="min-w-0 flex-1">
                {editingId === task.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="min-h-[72px] w-full resize-none rounded-card-sm border border-border bg-bg p-2 text-sm text-text-primary"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-pill p-1.5 text-text-muted hover:bg-surface-alt"
                        aria-label="Cancel edit"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={commitEdit}
                        className="rounded-pill p-1.5 text-accent hover:bg-accent-light"
                        aria-label="Save edit"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">{task.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge color={TAG_COLORS[task.tag]} size="sm">
                        {task.tag}
                      </Badge>
                      <Badge color={PRIORITY_BADGE[task.priority].color} size="sm">
                        {PRIORITY_BADGE[task.priority].label}
                      </Badge>
                      <span className="text-[10px] text-text-muted">
                        {ENERGY_LABEL[task.energyCost]}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {editingId !== task.id ? (
                <button
                  type="button"
                  onClick={() => startEdit(task)}
                  className="shrink-0 self-start text-text-muted hover:text-text-primary"
                  aria-label="Edit task"
                >
                  <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : (
                <span className="w-3.5 shrink-0" aria-hidden />
              )}
            </div>
          ))}
        </div>

        {recommended ? (
          <div className="mt-4 px-5">
            <Card variant="accent" className="p-4">
              <p className="text-xs text-text-secondary">
                Based on your current energy, start with:
              </p>
              <p className="mt-1 text-[15px] font-semibold text-text-primary">
                {recommended.text}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                It&apos;s low energy and takes under 5 minutes
              </p>
            </Card>
          </div>
        ) : null}

        <div className="mt-6 px-5 pb-6">
          <Button variant="primary" size="full" onClick={handleAddAll}>
            Add all to Today →
          </Button>
          <Button variant="ghost" size="full" className="mt-2" onClick={scrollToTasks}>
            Let me pick and choose
          </Button>
        </div>
      </div>
    )
  }

  /* input */
  return (
    <div>
      <header className="px-5 pt-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          BRAIN DUMP
        </p>
        <h1 className="font-display text-[26px] text-text-primary">
          What&apos;s in your head?
        </h1>
        <p className="mt-1 max-w-[300px] text-sm text-text-secondary">
          Say it, type it. Everything. We&apos;ll sort it out.
        </p>
      </header>

      <div className="mt-4 px-5">
        <textarea
          ref={textareaRef}
          value={dumpText}
          onChange={(e) => {
            setDumpText(e.target.value)
            requestAnimationFrame(resizeTextarea)
          }}
          placeholder="Type everything that's on your mind... work stuff, personal stuff, that thing you keep forgetting, all of it."
          rows={4}
          className="min-h-[140px] w-full resize-none rounded-card-sm border border-border bg-surface p-4 text-sm text-text-primary placeholder:text-text-muted"
        />
        <p className="mt-3 text-right text-[10px] text-text-muted">{dumpText.length} characters</p>

        <div className="mx-auto mt-4 flex w-14 flex-col items-center">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-accent"
            aria-label="Voice input (coming soon)"
          >
            <Mic className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
          <p className="mt-2 text-center text-xs text-text-muted">
            Or just speak it — tap the mic
          </p>
        </div>
      </div>

      <div className="mt-6 px-5">
        <Button
          variant="primary"
          size="full"
          onClick={() => setPhase('processing')}
        >
          ReSpark this →
        </Button>
        <Button variant="ghost" size="full" className="mt-2" onClick={handleSaveDraft}>
          Save for later
        </Button>
      </div>
    </div>
  )
}
