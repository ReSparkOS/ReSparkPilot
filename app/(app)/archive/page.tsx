'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { getTasks, saveTasks, updateTask } from '@/lib/storage'
import type { Task } from '@/lib/types'

type TabId = 'completed' | 'aside'

function dateKeyFromIso(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return d.toDateString()
}

function formatGroupHeader(dateKey: string): string {
  if (dateKey === 'unknown') return 'Earlier'
  const d = new Date(dateKey)
  if (Number.isNaN(d.getTime())) return 'Earlier'
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

function formatTaskDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ArchivePage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<TabId>('completed')
  const [tasks, setTasks] = useState<Task[]>([])

  const refresh = useCallback(() => {
    setTasks(getTasks())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const completed = useMemo(
    () => tasks.filter((t) => t.status === 'done'),
    [tasks]
  )
  const archived = useMemo(
    () => tasks.filter((t) => t.status === 'archived'),
    [tasks]
  )

  const completedByDate = useMemo(() => {
    const sorted = [...completed].sort((a, b) => {
      const ta = new Date(a.completedAt ?? a.createdAt).getTime()
      const tb = new Date(b.completedAt ?? b.createdAt).getTime()
      return tb - ta
    })
    const map = new Map<string, Task[]>()
    for (const task of sorted) {
      const key = dateKeyFromIso(task.completedAt ?? task.createdAt)
      const list = map.get(key)
      if (list) list.push(task)
      else map.set(key, [task])
    }
    return Array.from(map.entries())
  }, [completed])

  const handleRestore = (id: string) => {
    updateTask(id, { status: 'active', archivedAt: undefined })
    refresh()
    toast('Spark restored ✓')
  }

  const handleClearArchived = () => {
    const next = getTasks().filter((t) => t.status !== 'archived')
    saveTasks(next)
    refresh()
  }

  return (
    <div className="min-h-full pb-6">
      <header className="px-5 pt-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          ARCHIVE
        </p>
        <h1 className="font-display text-[26px] text-text-primary">Your History</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tasks you completed and ones we quietly set aside.
        </p>
      </header>

      <div className="mt-4 flex gap-0 border-b border-border px-5">
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'completed'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-muted'
          }`}
        >
          Completed ✓
        </button>
        <button
          type="button"
          onClick={() => setTab('aside')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'aside'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-muted'
          }`}
        >
          Set Aside
        </button>
      </div>

      {tab === 'completed' ? (
        <div className="mt-4 px-5">
          {completed.length === 0 ? (
            <p className="text-center text-sm text-text-muted">
              Nothing yet — your first completed spark will show up here.
            </p>
          ) : (
            <div className="opacity-80">
              {completedByDate.map(([dateKey, group], groupIndex) => (
                <section key={dateKey}>
                  <h2
                    className={`text-xs font-medium uppercase text-text-muted ${
                      groupIndex === 0 ? 'mt-0' : 'mt-4'
                    }`}
                  >
                    {formatGroupHeader(dateKey)}
                  </h2>
                  <ul>
                    {group.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                      >
                        <Check
                          size={16}
                          className="shrink-0 text-success"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 text-sm text-text-secondary">
                          {task.text}
                        </span>
                        <span className="shrink-0 text-[10px] text-text-muted">
                          {formatTaskDate(task.completedAt ?? task.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 px-5">
          <p className="rounded-sm bg-surface-alt p-3 text-xs text-text-secondary">
            These were archived when you came back after a break. No guilt. Restore anything
            that&apos;s still relevant.
          </p>

          {archived.length === 0 ? (
            <p className="mt-8 text-center text-sm text-text-muted">
              All clear. Nothing was set aside.
            </p>
          ) : (
            <>
              <ul className="mt-4">
                {archived.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between border-b border-border py-3 last:border-0"
                  >
                    <span className="min-w-0 flex-1 pr-3 text-sm text-text-primary">
                      {task.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleRestore(task.id)}
                    >
                      Restore →
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-text-muted"
                  onClick={handleClearArchived}
                >
                  Clear all
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
