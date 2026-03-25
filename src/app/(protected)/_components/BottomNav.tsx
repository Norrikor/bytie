'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/feed',    icon: '📜', label: 'Лента'  },
  { href: '/objects', icon: '🏡', label: 'Забота' },
  { href: '/shared',  icon: '🌿', label: 'Вместе' },
  { href: '/profile', icon: '☀️', label: 'Я'      },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottomNav" aria-label="Основная навигация">
      {NAV_ITEMS.map(({ href, icon, label }) => {
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
