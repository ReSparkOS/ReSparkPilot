import {
  DEFAULT_SETTINGS,
  type Energy,
  type EnergyLevel,
  type FocusSession,
  type Task,
  type User,
  type UserSettings,
} from '@/lib/types'

const KEYS = {
  user: 'respark_user',
  tasks: 'respark_tasks',
  energy: 'respark_energy',
  lastOpen: 'respark_last_open',
  sessions: 'respark_sessions',
  settings: 'respark_settings',
} as const

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readRaw(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Quota or privacy mode — ignore
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const raw = readRaw(key)
  if (raw == null || raw === '') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Random 8-character lowercase hex id (works in SSR and browser). */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(4)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export function getUser(): User | null {
  return readJSON<User | null>(KEYS.user, null)
}

export function saveUser(user: User): void {
  writeRaw(KEYS.user, JSON.stringify(user))
}

export function getTasks(): Task[] {
  const tasks = readJSON<Task[] | null>(KEYS.tasks, null)
  return Array.isArray(tasks) ? tasks : []
}

export function saveTasks(tasks: Task[]): void {
  writeRaw(KEYS.tasks, JSON.stringify(tasks))
}

export function addTask(task: Task): void {
  const tasks = getTasks()
  saveTasks([...tasks, task])
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return
  const next = [...tasks]
  next[idx] = { ...next[idx], ...updates }
  saveTasks(next)
}

export function completeTask(id: string): void {
  const now = new Date().toISOString()
  updateTask(id, {
    status: 'done',
    completedAt: now,
    archivedAt: undefined,
  })
}

export function toggleTask(id: string): void {
  const tasks = getTasks()
  const task = tasks.find((t) => t.id === id)
  if (!task) return
  if (task.status === 'done') {
    updateTask(id, { status: 'active', completedAt: undefined })
  } else if (task.status === 'active') {
    updateTask(id, { status: 'done', completedAt: new Date().toISOString() })
  }
}

export function archiveTask(id: string): void {
  const now = new Date().toISOString()
  updateTask(id, {
    status: 'archived',
    archivedAt: now,
  })
}

export function getEnergy(): Energy | null {
  return readJSON<Energy | null>(KEYS.energy, null)
}

export function setEnergy(level: EnergyLevel): void {
  const energy: Energy = { level, setAt: new Date().toISOString() }
  writeRaw(KEYS.energy, JSON.stringify(energy))
}

export function getLastOpen(): string | null {
  const raw = readRaw(KEYS.lastOpen)
  return raw && raw.length > 0 ? raw : null
}

export function updateLastOpen(): void {
  writeRaw(KEYS.lastOpen, new Date().toISOString())
}

export function getSessions(): FocusSession[] {
  const sessions = readJSON<FocusSession[] | null>(KEYS.sessions, null)
  return Array.isArray(sessions) ? sessions : []
}

export function saveSessions(sessions: FocusSession[]): void {
  writeRaw(KEYS.sessions, JSON.stringify(sessions))
}

export function addSession(session: FocusSession): void {
  saveSessions([...getSessions(), session])
}

export function getSettings(): UserSettings {
  const parsed = readJSON<Partial<UserSettings> | null>(KEYS.settings, null)
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...parsed }
}

export function saveSettings(settings: UserSettings): void {
  writeRaw(KEYS.settings, JSON.stringify(settings))
}

/** Seeds demo tasks on first run; ensures default user and settings exist when missing. */
export function seedDemoData(): void {
  if (!isBrowser()) return

  if (readRaw(KEYS.tasks) == null) {
    const now = new Date().toISOString()
    const demoTasks: Task[] = [
      {
        id: generateId(),
        text: 'Reply to client email about proposal',
        tag: 'Work',
        energyCost: 'high',
        priority: 'urgent',
        status: 'active',
        createdAt: now,
        subSteps: ['Open email thread', 'Draft response', 'Review and send'],
      },
      {
        id: generateId(),
        text: 'Schedule dentist appointment',
        tag: 'Health',
        energyCost: 'low',
        priority: 'soon',
        status: 'active',
        createdAt: now,
        subSteps: ['Look up dentist number', 'Call and book'],
      },
      {
        id: generateId(),
        text: 'Review bank statement',
        tag: 'Finance',
        energyCost: 'medium',
        priority: 'soon',
        status: 'active',
        createdAt: now,
        subSteps: ['Download statement', 'Check transactions', 'Flag anything weird'],
      },
      {
        id: generateId(),
        text: 'Text mom back',
        tag: 'Personal',
        energyCost: 'low',
        priority: 'soon',
        status: 'done',
        createdAt: now,
        completedAt: now,
      },
    ]
    saveTasks(demoTasks)
  }

  if (readRaw(KEYS.user) == null) {
    const user: User = {
      name: '',
      onboardingComplete: false,
      joinedAt: new Date().toISOString(),
    }
    saveUser(user)
  }

  if (readRaw(KEYS.settings) == null) {
    saveSettings({ ...DEFAULT_SETTINGS })
  }
}

/** Whole days between `getLastOpen()` and now; `null` if never opened or invalid date. */
export function getDaysSinceLastOpen(): number | null {
  const last = getLastOpen()
  if (!last) return null
  const then = Date.parse(last)
  if (Number.isNaN(then)) return null
  const diffMs = Date.now() - then
  return Math.floor(diffMs / 86_400_000)
}
