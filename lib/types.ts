export type EnergyLevel = 'god' | 'fine' | 'existing' | 'fumes'

export type TaskTag = 'Work' | 'Personal' | 'Health' | 'Finance' | 'Home' | 'Other'

export type TaskPriority = 'urgent' | 'soon' | 'whenever'

export type TaskStatus = 'active' | 'done' | 'archived'

export type EnergyCost = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  text: string
  tag: TaskTag
  energyCost: EnergyCost
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  completedAt?: string
  archivedAt?: string
  subSteps?: string[]
}

export interface ParsedTask extends Omit<Task, 'status' | 'createdAt'> {
  included: boolean
}

export interface User {
  name: string
  onboardingComplete: boolean
  joinedAt: string
}

export interface Energy {
  level: EnergyLevel
  setAt: string
}

export interface FocusSession {
  id: string
  taskId: string
  taskText: string
  duration: number
  startedAt: string
  endedAt?: string
  completedSteps?: string[]
  nextStep?: string
}

export interface UserSettings {
  colorPalette: string
  density: string
  font: string
  reduceMotion: boolean
  checkInInterval: number
  checkInStyle: string
  ambientSound: string
  shameFreeOnly: boolean
  renewalReminders: boolean
  sessionReminders: boolean
}

export const ENERGY_CONFIG: Record<EnergyLevel, { emoji: string; label: string; color: string }> = {
  god: { emoji: '⚡', label: "I could fight God", color: 'var(--energy-high)' },
  fine: { emoji: '😐', label: "I'm fine", color: 'var(--warning)' },
  existing: { emoji: '🌫️', label: 'Just existing', color: 'var(--energy-mid)' },
  fumes: { emoji: '🪫', label: 'Running on fumes', color: 'var(--energy-low)' },
}

export const TAG_COLORS: Record<TaskTag, string> = {
  Work: '#E8714A',
  Personal: '#7B6EAB',
  Health: '#4CAF7D',
  Finance: '#F0A030',
  Home: '#8B9FC4',
  Other: '#A09D97',
}

export const DEFAULT_SETTINGS: UserSettings = {
  colorPalette: 'Warm Neutral',
  density: 'Calm Mode',
  font: 'DM Sans',
  reduceMotion: false,
  checkInInterval: 15,
  checkInStyle: 'Gentle nudges',
  ambientSound: 'Off',
  shameFreeOnly: true,
  renewalReminders: true,
  sessionReminders: false,
}
