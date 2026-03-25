import { ReactNode } from 'react'

import BottomNav from './_components/BottomNav'
import { requireAuth } from '@/lib/auth/requireAuth'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAuth()

  return (
    <div className="appShell">
      <main className="appMain">
        <div className="appContent">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}

