'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { isSharedSectionEnabled } from '@/lib/featureFlags'

const NAV_ITEMS = [
  { href: '/feed',    icon: '📜', label: 'Лента' },
  { href: '/objects', icon: '🏡', label: 'Подопечные' },
  { href: '/shared',  icon: '🌿', label: 'Вместе', feature: 'shared' as const },
  { href: '/adminka', icon: '🛠️', label: 'Админка', adminOnly: true as const },
  { href: '/profile', icon: '☀️', label: 'Профиль' },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const sharedOn = isSharedSectionEnabled()
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')

  useEffect(() => {
    // BottomNav is client-side; we keep server-side protection in `adminka` page as well.
    // This is only for hiding the menu item.
    fetch('/api/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user?.role === 'ADMIN') setRole('ADMIN')
      })
      .catch(() => {})
  }, [])

  const items = NAV_ITEMS.filter((item) => {
    if (item.feature === 'shared' && !sharedOn) return false
    if ((item as any).adminOnly && role !== 'ADMIN') return false
    return true
  })

  return (
    <nav className="bottomNav" aria-label="Основная навигация">
      {items.map(({ href, icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={`bottomNavItem${active ? ' bottomNavItemActive' : ''}`}
          >
            <span className="bottomNavIcon">{icon}</span>
            <span className="bottomNavLabel">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
