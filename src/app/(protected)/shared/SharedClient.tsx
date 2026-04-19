'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Member = { userId: string; name: string | null }
type PendingInvitation = { id: string; invitedEmail: string; invitedUserId: string | null }
type SharedObject = {
  objectId: string
  objectName: string
  kind: string | null
  meRole: string
  members: Member[]
  pendingInvitations: PendingInvitation[]
}

export default function SharedClient({ objects, currentUserId }: { objects: SharedObject[]; currentUserId: string }) {
  const router = useRouter()
  const [inviteEmailByObject, setInviteEmailByObject] = useState<Record<string, string>>({})
  const [inviteNoteByObjectId, setInviteNoteByObjectId] = useState<Record<string, string>>({})

  async function invite(objectId: string) {
    const invitedEmail = (inviteEmailByObject[objectId] ?? '').trim()
    if (!invitedEmail) return

    try {
      const res = await fetch(`/api/objects/${objectId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setInviteNoteByObjectId((prev) => ({
          ...prev,
          [objectId]: json?.error ? `Ошибка: ${json.error}` : 'Не удалось отправить',
        }))
        return
      }

      const json = (await res.json().catch(() => null)) as any
      const email = json?.email
      if (email?.sent) {
        setInviteNoteByObjectId((prev) => ({ ...prev, [objectId]: 'Приглашение отправлено на почту.' }))
      } else {
        setInviteNoteByObjectId((prev) => ({
          ...prev,
          [objectId]: 'Приглашение создано. Пусть человек откроет раздел «Вместе» в приложении.',
        }))
      }

      setInviteEmailByObject((prev) => ({ ...prev, [objectId]: '' }))
      router.refresh()
    } catch {
      setInviteNoteByObjectId((prev) => ({ ...prev, [objectId]: 'Не удалось подключиться' }))
    }
  }

  async function revokeMember(objectId: string, memberUserId: string, memberLabel: string | null) {
    const label = memberLabel?.trim() ? ` («${memberLabel.trim()}»)` : ''
    const ok = confirm(
      `Убрать участника из объекта${label}? Человек потеряет доступ к этой «заботе».`,
    )
    if (!ok) return

    try {
      const res = await fetch(`/api/objects/${objectId}/members/${memberUserId}`, { method: 'DELETE' })
      if (!res.ok) return
      router.refresh()
    } catch {
      // тихо
    }
  }

  async function revokeInvitation(invitationId: string) {
    const ok = confirm('Отозвать приглашение?')
    if (!ok) return
    await fetch(`/api/invitations/${invitationId}/revoke`, { method: 'POST' })
    router.refresh()
  }

  if (objects.length === 0) {
    return (
      <div className="emptyState">
        <span className="emptyStateIcon">🤝</span>
        <p className="emptyStateText">
          Пока нет общих объектов.<br />
          Пригласите кого-то — и будете вести ленту вдвоём.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {objects.map((obj) => {
        const isOwner = obj.meRole === 'OWNER'
        return (
          <div key={obj.objectId} className="card" style={{ gap: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div>
                <div className="objectCardName">{obj.objectName}</div>
                {obj.kind ? <div className="objectCardKind">{obj.kind}</div> : null}
              </div>
              <span className={`badge ${isOwner ? 'badge--ochre' : 'badge--moss'}`}>
                {isOwner ? 'Хозяин' : 'Участник'}
              </span>
            </div>

            <hr className="dividerLine" />

            <div>
              <div className="filtersPanelLabel" style={{ marginBottom: 10 }}>Участники</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {obj.members.map((m) => (
                  <div key={m.userId} className="memberRow">
                    <span className="memberName">{m.name ?? '…'}</span>
                    {isOwner && m.userId !== currentUserId ? (
                      <button
                        type="button"
                        onClick={() => revokeMember(obj.objectId, m.userId, m.name)}
                        className="btnIcon btnIcon--danger"
                      >
                        Убрать
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {isOwner ? (
              <div>
                <div className="filtersPanelLabel" style={{ marginBottom: 10 }}>Пригласить по почте</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="email"
                    value={inviteEmailByObject[obj.objectId] ?? ''}
                    onChange={(e) => setInviteEmailByObject((prev) => ({ ...prev, [obj.objectId]: e.target.value }))}
                    placeholder="почта@пример.ру"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => invite(obj.objectId)}
                    className="btnPrimary"
                    style={{ width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    Позвать
                  </button>
                </div>

                {inviteNoteByObjectId[obj.objectId] ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--textSoft)', lineHeight: 1.4 }}>
                    {inviteNoteByObjectId[obj.objectId]}
                  </div>
                ) : null}

                {obj.pendingInvitations.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <div className="filtersPanelLabel" style={{ marginBottom: 8 }}>Ожидают ответа</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {obj.pendingInvitations.map((inv) => (
                        <div key={inv.id} className="memberRow">
                          <span style={{ fontSize: 14, color: 'var(--textSoft)' }}>{inv.invitedEmail}</span>
                          <button
                            type="button"
                            onClick={() => revokeInvitation(inv.id)}
                            className="btnIcon"
                          >
                            Отозвать
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
