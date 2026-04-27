'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isSharedSectionEnabled } from '@/lib/featureFlags'

const NAV_ITEMS = [
  { href: '/feed', icon: '📜', label: 'Лента' },
  { href: '/objects', icon: '🏡', label: 'Подопечные' },
  { href: '/shared', icon: '🌿', label: 'Вместе', feature: 'shared' as const },
  { href: '/profile', icon: '☀️', label: 'Профиль' },
] as const

export default function BottomNavClient({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const sharedOn = isSharedSectionEnabled()

  const items = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: '/adminka', icon: '🛠️', label: 'Админка' }] : []),
  ] as const

  const filtered = items.filter((item: any) => item.feature !== 'shared' || sharedOn)

  return (
    <nav className="bottomNav" aria-label="Основная навигация">
      {filtered.map((item: any) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottomNavItem${active ? ' bottomNavItemActive' : ''}`}
          >
            <span className="bottomNavIcon">{item.icon}</span>
            <span className="bottomNavLabel">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

