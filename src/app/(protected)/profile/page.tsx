import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import SignOutButton from './SignOutButton'

export default async function ProfilePage() {
  const current = await getCurrentUser()
  if (!current?.user?.name) redirect('/onboarding/1')

  return (
    <div className="pageSection">
      <div className="pageHeader">
        <h1>Профиль</h1>
        <p className="pageLead">Ваша страничка.</p>
      </div>

      <div className="card">
        <div className="filtersPanelLabel" style={{ marginBottom: 6 }}>Как вас зовут</div>
        <div className="profileName">{current.user.name}</div>
      </div>

      <div className="card">
        <div className="filtersPanelLabel" style={{ marginBottom: 6 }}>Почта</div>
        <div style={{ fontSize: 15, color: 'var(--textSoft)' }}>{current.user.email ?? '—'}</div>
      </div>

      <SignOutButton />
    </div>
  )
}
