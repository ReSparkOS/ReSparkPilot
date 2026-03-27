'use client'

import type { KeyboardEvent } from 'react'
import type { EnergyCost, Task } from '@/lib/types'
import { TAG_COLORS } from '@/lib/types'

const ENERGY_DOT: Record<EnergyCost, string> = {
  high: 'var(--energy-high)',
  medium: 'var(--energy-mid)',
  low: 'var(--energy-low)',
}

function TagBadge({ tag }: { tag: Task['tag'] }) {
  const hex = TAG_COLORS[tag]
  return (
    <span
      className="max-w-[5.5rem] truncate rounded-pill px-2 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: hex }}
    >
      {tag}
    </span>
  )
}

type TaskCardProps = {
  task: Task
  onComplete: (id: string) => void
  onExpand?: (id: string) => void
  expanded?: boolean
  variant?: 'default' | 'hero'
}

export function TaskCard({
  task,
  onComplete,
  onExpand,
  expanded = false,
  variant = 'default',
}: TaskCardProps) {
  const done = task.status === 'done'
  const hasSteps = Boolean(task.subSteps?.length)

  const shellClass =
    variant === 'default'
      ? 'rounded-card-sm border border-border bg-surface p-3'
      : ''

  const handleBodyClick = () => {
    if (!onExpand) return
    onExpand(task.id)
  }

  const handleBodyKeyDown = (e: KeyboardEvent) => {
    if (!onExpand) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onExpand(task.id)
    }
  }

  return (
    <div className={shellClass}>
      <div
        className={`flex gap-3 ${onExpand ? 'cursor-pointer' : ''}`}
        onClick={onExpand ? handleBodyClick : undefined}
        onKeyDown={onExpand ? handleBodyKeyDown : undefined}
        role={onExpand ? 'button' : undefined}
        tabIndex={onExpand ? 0 : undefined}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onComplete(task.id)
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
            done ? 'border-success bg-success' : 'border-border-strong bg-transparent'
          }`}
          aria-pressed={done}
          aria-label={done ? 'Mark task not done' : 'Mark task done'}
        >
          {done ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>

        <p
          className={`min-w-0 flex-1 text-sm font-medium text-text-primary ${
            done ? 'line-through opacity-50' : ''
          }`}
        >
          {task.text}
        </p>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TagBadge tag={task.tag} />
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: ENERGY_DOT[task.energyCost] }}
            title={task.energyCost}
            aria-hidden
          />
        </div>
      </div>

      {hasSteps ? (
        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            expanded ? 'max-h-[2000px]' : 'max-h-0'
          }`}
        >
          <ol className="mt-3 space-y-1.5 border-t border-border pt-3 pl-1">
            {task.subSteps!.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted/70"
                  aria-hidden
                />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
