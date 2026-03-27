'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Heart,
  Palette,
  Shield,
  Sparkles,
  Trash2,
  Type,
  Volume2,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LogoMark } from '@/components/Logo'
import { Toggle } from '@/components/ui/Toggle'
import { getSettings, getUser, saveSettings } from '@/lib/storage'
import type { UserSettings } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/cn'

function SettingRow({
  icon: Icon,
  label,
  sublabel,
  labelClassName,
  trailing,
  onClick,
}: {
  icon: LucideIcon
  label: string
  sublabel?: string
  labelClassName?: string
  trailing: ReactNode
  onClick?: () => void
}) {
  const left = (
    <div className="flex min-w-0 flex-1 items-center gap-3 pr-3">
      <Icon className="size-[18px] shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
      <div className="min-w-0">
        <p className={cn('text-sm font-medium text-text-primary', labelClassName)}>{label}</p>
        {sublabel ? <p className="mt-0.5 text-xs text-text-muted">{sublabel}</p> : null}
      </div>
    </div>
  )

  const rowClass =
    'flex w-full items-center justify-between border-b border-border py-3.5 text-left transition-colors'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(rowClass, 'hover:bg-surface-alt/40')}>
        {left}
        {trailing}
      </button>
    )
  }

  return <div className={rowClass}>{left}{trailing}</div>
}

function ChevronValue({ value }: { value: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {value ? (
        <span className="max-w-[140px] truncate text-xs text-text-muted sm:max-w-[180px]">
          {value}
        </span>
      ) : null}
      <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
    </div>
  )
}

function densitySublabel(settings: UserSettings): string {
  if (settings.density === 'Calm Mode') return 'Calm Mode — 1 task at a time'
  return settings.density
}

function fontSublabel(settings: UserSettings): string {
  if (settings.font === 'DM Sans') return 'DM Sans (default) · OpenDyslexic optional'
  return `${settings.font} · OpenDyslexic optional`
}

function checkInLabel(settings: UserSettings): string {
  const n = settings.checkInInterval
  return n === 1 ? 'Every 1 min' : `Every ${n} min`
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    setSettings(getSettings())
    const u = getUser()
    if (u?.name?.trim()) setUserName(u.name)
  }, [])

  const patchSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  return (
    <div className="min-h-full pb-8">
      <header className="px-5 pt-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          PREFERENCES
        </p>
        <h1 className="font-display text-[26px] text-text-primary">Your Setup</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {userName || 'Signed in locally'}
        </p>
      </header>

      <section className="mt-4 px-5">
        <div className="rounded-card bg-text-primary p-4 text-white">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-base font-semibold">ReSpark Pro</span>
          </div>
          <p className="mt-1 text-sm text-white/60">Founding Member · $99 lifetime</p>
        </div>
      </section>

      <section className="mt-6 px-5">
        <h2 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          EXPERIENCE
        </h2>
        <SettingRow
          icon={Palette}
          label="Color Palette"
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value={settings.colorPalette} />}
        />
        <SettingRow
          icon={Type}
          label="Information Density"
          sublabel={densitySublabel(settings)}
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value={settings.density} />}
        />
        <SettingRow
          icon={Type}
          label="Font"
          sublabel={fontSublabel(settings)}
          onClick={() => router.push('/settings')}
          trailing={
            <ChevronValue
              value={settings.font === 'DM Sans' ? 'DM Sans (default)' : settings.font}
            />
          }
        />
        <SettingRow
          icon={Eye}
          label="Reduce Motion"
          trailing={
            <Toggle
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => patchSettings({ reduceMotion: checked })}
              aria-label="Reduce motion"
            />
          }
        />
      </section>

      <section className="px-5">
        <h2 className="mb-1 mt-6 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          FOCUS SESSIONS
        </h2>
        <SettingRow
          icon={Clock}
          label="Spark Buddy check-ins"
          sublabel={checkInLabel(settings)}
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value={checkInLabel(settings)} />}
        />
        <SettingRow
          icon={Sparkles}
          label="Check-in style"
          sublabel={settings.checkInStyle}
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value={settings.checkInStyle} />}
        />
        <SettingRow
          icon={Volume2}
          label="Ambient Sound"
          sublabel="Rain, Lo-fi, Brown Noise, White Noise"
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value={settings.ambientSound} />}
        />
      </section>

      <section className="px-5">
        <h2 className="mb-1 mt-6 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          NOTIFICATIONS
        </h2>
        <SettingRow
          icon={Shield}
          label="Shame-free only"
          trailing={
            <Toggle
              checked={settings.shameFreeOnly}
              onCheckedChange={(checked) => patchSettings({ shameFreeOnly: checked })}
              aria-label="Shame-free notifications only"
            />
          }
        />
        <p className="text-[10px] text-text-muted">
          No streak guilt, no &apos;you haven&apos;t opened the app&apos; messages
        </p>
        <SettingRow
          icon={Bell}
          label="Renewal reminders"
          trailing={
            <Toggle
              checked={settings.renewalReminders}
              onCheckedChange={(checked) => patchSettings({ renewalReminders: checked })}
              aria-label="Renewal reminders"
            />
          }
        />
        <SettingRow
          icon={Bell}
          label="Session reminders"
          trailing={
            <Toggle
              checked={settings.sessionReminders}
              onCheckedChange={(checked) => patchSettings({ sessionReminders: checked })}
              aria-label="Session reminders"
            />
          }
        />
      </section>

      <section className="px-5">
        <h2 className="mb-1 mt-6 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          ACCOUNT
        </h2>
        <SettingRow
          icon={Download}
          label="Export my data"
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value="" />}
        />
        <SettingRow
          icon={Trash2}
          label="Delete account"
          labelClassName="text-red-500"
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value="" />}
        />
        <SettingRow
          icon={Heart}
          label="Financial assistance"
          sublabel={"If cost is a barrier, we've got you."}
          onClick={() => router.push('/settings')}
          trailing={<ChevronValue value="" />}
        />
      </section>

      <footer className="mt-6 px-5 pb-8">
        <p className="text-xs text-text-muted">Version 0.1.0 — Early Access</p>
        <p className="mt-1 text-xs text-text-muted">
          Built by a solo founder with ADHD, for everyone who gets it.
        </p>
        <p className="mt-2 text-xs text-text-muted">Privacy Policy | Terms</p>
      </footer>
    </div>
  )
}
