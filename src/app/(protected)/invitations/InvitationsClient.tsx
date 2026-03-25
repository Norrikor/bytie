'use client'

import { useRouter } from 'next/navigation'

type Invitation = {
  id: string
  objectCareId: string
  objectCareName: string
  inviterName: string | null
  invitedEmail: string
  permission: string
  createdAt: string
}

export default function InvitationsClient({ invitations }: { invitations: Invitation[] }) {
  const router = useRouter()

  async function accept(invitationId: string) {
    await fetch(`/api/invitations/${invitationId}/accept`, { method: 'POST' })
    router.refresh()
  }

  async function decline(invitationId: string) {
    await fetch(`/api/invitations/${invitationId}/decline`, { method: 'POST' })
    router.refresh()
  }

  if (invitations.length === 0) {
    return (
      <div className="emptyState">
        <span className="emptyStateIcon">📬</span>
        <p className="emptyStateText">
          Пока нет приглашений.<br />
          Когда кто-то позовёт вас в общую ленту — появится здесь.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {invitations.map((inv) => (
        <div key={inv.id} className="inviteCard">
          <div>
            <div className="filtersPanelLabel" style={{ marginBottom: 4 }}>Приглашение</div>
            <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 500 }}>{inv.inviterName ?? 'Кто-то'}</span> хочет вместе следить за{' '}
              <span style={{ color: 'var(--ochre)', fontWeight: 500 }}>«{inv.objectCareName}»</span>
            </p>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{inv.invitedEmail}</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => accept(inv.id)}
              className="btnPrimary"
              style={{ flex: 1 }}
            >
              Принять
            </button>
            <button
              type="button"
              onClick={() => decline(inv.id)}
              className="btnGhost"
              style={{ flex: 1 }}
            >
              Отказать
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
