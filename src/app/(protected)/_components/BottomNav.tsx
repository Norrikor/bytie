'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isSharedSectionEnabled } from '@/lib/featureFlags'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const NAV_ITEMS = [
  { href: '/feed',    icon: '📜', label: 'Лента' },
  { href: '/objects', icon: '🏡', label: 'Подопечные' },
  { href: '/shared',  icon: '🌿', label: 'Вместе', feature: 'shared' as const },
  { href: '/adminka', icon: '🛠️', label: 'Админка', role: 'ADMIN' as const },
  { href: '/profile', icon: '☀️', label: 'Профиль' },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const sharedOn = isSharedSectionEnabled()

  // BottomNav is a client component. We can only hide client-side if we know the user's role.
  // The route itself is protected server-side via `requireAdmin()` in `src/app/(protected)/adminka/page.tsx`.
  // So here we keep it permissive and rely on server-side guard.
  const items = NAV_ITEMS.filter((item) => item.feature !== 'shared' || sharedOn)

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
