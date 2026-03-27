import type { EnergyLevel, ParsedTask, Task } from '@/lib/types'

const FALLBACK_TASKS: ParsedTask[] = [
  {
    id: 'fb-1',
    text: 'Reply to client email',
    tag: 'Work',
    energyCost: 'medium',
    priority: 'urgent',
    subSteps: ['Open email', 'Write 2-3 sentences', 'Hit send'],
    included: true,
  },
  {
    id: 'fb-2',
    text: 'Schedule dentist appointment',
    tag: 'Health',
    energyCost: 'low',
    priority: 'soon',
    subSteps: ['Find the number', 'Call or book online'],
    included: true,
  },
  {
    id: 'fb-3',
    text: 'Text mom back',
    tag: 'Personal',
    energyCost: 'low',
    priority: 'soon',
    subSteps: ['Open messages', 'Send a reply'],
    included: true,
  },
]

export async function parseBrainDump(
  text: string,
  energyLevel: EnergyLevel = 'fine',
  existingTasks: string[] = [],
): Promise<{ tasks: ParsedTask[]; recommendedFirst: ParsedTask; summary: string }> {
  try {
    const res = await fetch('/api/ai/parse-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, energyLevel, existingTasks }),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()
    if (data.fallback) return fallbackDump()

    return {
      tasks: data.tasks,
      recommendedFirst: data.recommendedFirst,
      summary: data.summary,
    }
  } catch (err) {
    console.error('parseBrainDump failed, using fallback:', err)
    return fallbackDump()
  }
}

function fallbackDump() {
  return {
    tasks: FALLBACK_TASKS,
    recommendedFirst: FALLBACK_TASKS[1],
    summary: 'Caught a few sparks from your dump.',
  }
}

export async function getNextAction(
  tasks: Task[],
  energy: EnergyLevel,
): Promise<Task | null> {
  const active = tasks.filter((t) => t.status === 'active')
  if (active.length === 0) return null

  try {
    const res = await fetch('/api/ai/next-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: active, energyLevel: energy }),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()
    if (data.fallback) return fallbackNextAction(active, energy)

    const found = active.find((t) => t.id === data.task?.id)
    return found ?? fallbackNextAction(active, energy)
  } catch (err) {
    console.error('getNextAction failed, using fallback:', err)
    return fallbackNextAction(active, energy)
  }
}

function fallbackNextAction(active: Task[], energy: EnergyLevel): Task | null {
  if (active.length === 0) return null
  if (energy === 'fumes' || energy === 'existing') {
    return active.find((t) => t.energyCost === 'low') ?? active[0]
  }
  return active.find((t) => t.priority === 'urgent') ?? active[0]
}

export async function getCheckIn(
  taskName: string,
  minutesElapsed: number,
  lastResponse?: string,
): Promise<string> {
  try {
    const res = await fetch('/api/ai/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskName, minutesElapsed, lastResponse }),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()
    if (data.fallback) return fallbackCheckIn(taskName, minutesElapsed)

    return data.message
  } catch (err) {
    console.error('getCheckIn failed, using fallback:', err)
    return fallbackCheckIn(taskName, minutesElapsed)
  }
}

function fallbackCheckIn(taskName: string, minutes: number): string {
  const msgs = [
    `Still on ${taskName}? ${minutes} min in — solid. 👍`,
    `How's ${taskName} going? You've been focused.`,
    `${minutes} minutes on ${taskName}. Nice flow.`,
    `Quick check — still with ${taskName}?`,
  ]
  return msgs[Math.floor(Math.random() * msgs.length)]
}
