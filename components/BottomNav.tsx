'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Archive, ArrowDownToLine, LayoutGrid, Target, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/home', label: 'Today', Icon: LayoutGrid },
  { href: '/dump', label: 'Dump', Icon: ArrowDownToLine },
  { href: '/focus', label: 'Focus', Icon: Target },
  { href: '/archive', label: 'Archive', Icon: Archive },
  { href: '/settings', label: 'You', Icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-20 flex h-[58px] items-stretch border-t border-border bg-surface/80 backdrop-blur-xl"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive =
          href === '/home'
            ? pathname === '/home' || pathname === '/'
            : pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium"
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted'}`}
              strokeWidth={isActive ? 2.25 : 2}
              aria-hidden
            />
            <span className={`relative ${isActive ? 'text-accent' : 'text-text-muted'}`}>
              {label}
              {isActive ? (
                <span className="absolute -bottom-0.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-accent" />
              ) : null}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
